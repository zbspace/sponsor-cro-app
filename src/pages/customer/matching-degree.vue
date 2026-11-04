<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">按适应症找客户</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <view class="fm-wrap">
    <!-- #region 搜索记录 -->
    <view class="fm-record">
      <text>搜索记录：</text>
      <text class="fm-kw">{{ indicationKeyword || '—' }}</text>
    </view>
    <!-- #endregion -->

    <!-- #region 匹配汇总 -->
    <view class="fm-sum">
      <view class="fm-sum-top">
        共
        <text class="fm-sum-total">{{ summary.total }}</text>
        家企业
      </view>
      <view class="fm-sum-grid">
        <view class="fm-sum-cell yes">
          <view class="fm-sum-line">
            <text class="fm-sum-num">{{ summary.matchCnt }}</text>
            <text class="fm-sum-unit">家</text>
          </view>
          <text class="fm-sum-label">匹配到相关产品管线</text>
        </view>
        <view class="fm-sum-cell no">
          <view class="fm-sum-line">
            <text class="fm-sum-num">{{ summary.notMatchCnt }}</text>
            <text class="fm-sum-unit">家</text>
          </view>
          <text class="fm-sum-label">未匹配到相关产品管线</text>
        </view>
      </view>
    </view>
    <!-- #endregion -->

    <!-- #region 企业名称搜索 -->
    <view class="fm-select">
      <view class="fm-search">
        <icon type="search" size="16" color="#9CA3AF" />
        <input
          type="text"
          :value="companyKeyword"
          placeholder="搜索并选择企业"
          placeholder-style="color: #9CA3AF"
          @input="onCompanyInput"
          @focus="openCompanyDropdown"
        />
        <view class="fm-clear" v-if="companyKeyword" @click="clearCompanyKeyword">
          <text>×</text>
        </view>
      </view>

      <!-- 母公司下拉联想 -->
      <view class="fm-dropdown" v-if="showCompanyDropdown">
        <view class="fm-dropdown-hint" v-if="companyLoading">
          <text>加载中...</text>
        </view>
        <template v-else>
          <scroll-view
            scroll-y
            class="fm-dropdown-list"
            :show-scrollbar="false"
            :style="companyDropdownStyle"
            v-if="companyOptions.length > 0"
          >
            <view
              class="fm-dropdown-item"
              v-for="item in companyOptions"
              :key="item.parentCompanyId"
              @click="selectCompany(item)"
            >
              <text>{{ item.parentCompanyShortName }}</text>
            </view>
          </scroll-view>
          <view class="fm-dropdown-hint" v-else>
            <text>未找到相关企业</text>
          </view>
        </template>
      </view>
    </view>
    <!-- #endregion -->

    <!-- #region 列表上限提示 -->
    <view class="fm-note" v-if="noteText">{{ noteText }}</view>
    <!-- #endregion -->

    <!-- #region 匹配企业列表 -->
    <view class="fm-table">
      <view class="fm-thead">
        <text class="fm-th fm-c1">序号</text>
        <text class="fm-th fm-c2">企业简称</text>
        <text class="fm-th fm-c3">相关产品管线</text>
      </view>

      <view
        class="fm-tr"
        v-for="(item, index) in list"
        :key="item.parentCompanyId"
        @click="goToDetail(item)"
      >
        <text class="fm-idx">{{ index + 1 }}</text>
        <text class="fm-co">{{ item.name }}</text>
        <view class="fm-cell">
          <text class="fm-tag" :class="item.matched ? 'yes' : 'no'">
            {{ item.matched ? '是' : '否' }}
          </text>
          <view class="arrow-right-icon"></view>
        </view>
      </view>

      <view class="fm-empty" v-if="listLoading">
        <text>加载中...</text>
      </view>
      <view class="fm-empty" v-else-if="list.length === 0">
        <text>未找到匹配企业</text>
      </view>
    </view>
    <!-- #endregion -->
  </view>

  <phone-bind-popup />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed } from 'vue'
  import { onLoad, onUnload } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import { getMatchingScoreList, matchingCompanyStatistics, queryParentName } from '@/api'
  import type { MatchingScoreItem, ParentCompanyItem } from '@/types/api'
  // #endregion

  // #region 状态
  // 列表接口只返回第一页 100 条，更多企业靠选择母公司定位
  const LIST_LIMIT = 100

  // 母公司下拉分页与高度
  const COMPANY_PAGE_SIZE = 20
  const DROPDOWN_ITEM_HEIGHT = 84
  const DROPDOWN_MAX_HEIGHT = 504

  interface MatchingItem {
    parentCompanyId: number
    name: string
    matched: boolean
  }

  // 路由带入的适应症，仅用于展示搜索记录
  const indicationKeyword = ref('')
  // 企业名称搜索关键词
  const companyKeyword = ref('')
  // 母公司下拉数据
  const companyOptions = ref<ParentCompanyItem[]>([])
  const companyLoading = ref(false)
  const showCompanyDropdown = ref(false)
  const selectedCompany = ref<ParentCompanyItem | null>(null)
  const list = ref<MatchingItem[]>([])
  const listLoading = ref(false)
  const summary = ref({ total: 0, matchCnt: 0, notMatchCnt: 0 })

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  // 下拉列表高度随条目数变化
  const companyDropdownStyle = computed(() => {
    const height = Math.min(companyOptions.value.length * DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT)
    return { height: `${height}rpx` }
  })

  // 列表上限提示
  const noteText = computed(() =>
    list.value.length >= LIST_LIMIT ? `最多展示 ${LIST_LIMIT} 家` : ''
  )
  // #endregion

  // #region 生命周期
  onLoad((options) => {
    menu.value = uni.getMenuButtonBoundingClientRect()

    indicationKeyword.value = options?.indication ? decodeURIComponent(options.indication) : ''

    fetchPageData()
  })

  onUnload(() => {
    if (companySearchTimer) clearTimeout(companySearchTimer)
  })
  // #endregion

  // #region 数据请求
  function buildParams() {
    return {
      indication: indicationKeyword.value || undefined,
      // 选中母公司后按其 ID 查询
      parentCompanyId: selectedCompany.value?.parentCompanyId,
      pageNum: 1,
      pageSize: LIST_LIMIT
    }
  }

  async function fetchPageData() {
    listLoading.value = true
    // 汇总统计与列表互不依赖，并行请求
    await Promise.all([fetchSummary(), fetchList()])
    listLoading.value = false
  }

  async function fetchSummary() {
    try {
      const res = await matchingCompanyStatistics(buildParams())
      summary.value = {
        total: res.data?.total ?? 0,
        matchCnt: res.data?.matchCnt ?? 0,
        notMatchCnt: res.data?.notMatchCnt ?? 0
      }
    } catch {
      summary.value = { total: 0, matchCnt: 0, notMatchCnt: 0 }
    }
  }

  async function fetchList() {
    try {
      const res = await getMatchingScoreList(buildParams())
      list.value = (res.data?.list || []).map((item: MatchingScoreItem) => ({
        parentCompanyId: item.parentCompanyId,
        name: item.parentCompanyName,
        matched: item.matchingResult === '是'
      }))
    } catch {
      list.value = []
    } finally {
      listLoading.value = false
    }
  }
  // #endregion

  // #region 母公司下拉
  let companySearchTimer: ReturnType<typeof setTimeout> | null = null

  function openCompanyDropdown() {
    showCompanyDropdown.value = true
    if (!companyOptions.value.length && !companyLoading.value) fetchCompanyOptions()
  }

  // 输入即查询母公司（防抖 300ms）
  function onCompanyInput(e: any) {
    companyKeyword.value = e?.detail?.value ?? ''
    selectedCompany.value = null
    showCompanyDropdown.value = true
    if (companySearchTimer) clearTimeout(companySearchTimer)
    companySearchTimer = setTimeout(fetchCompanyOptions, 300)
  }

  async function fetchCompanyOptions() {
    companyLoading.value = true
    try {
      const res = await queryParentName({
        pageNum: 1,
        pageSize: COMPANY_PAGE_SIZE,
        searchKey: companyKeyword.value.trim() || undefined
      })
      companyOptions.value = res.data?.list || []
    } catch {
      companyOptions.value = []
    } finally {
      companyLoading.value = false
    }
  }

  // 选中母公司后按 parentCompanyId 重新查询列表
  function selectCompany(item: ParentCompanyItem) {
    selectedCompany.value = item
    companyKeyword.value = item.parentCompanyShortName
    showCompanyDropdown.value = false
    fetchPageData()
  }
  // #endregion

  // #region 方法
  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  // 清空企业名称筛选，回到全部企业
  function clearCompanyKeyword() {
    if (companySearchTimer) clearTimeout(companySearchTimer)
    companyKeyword.value = ''
    selectedCompany.value = null
    companyOptions.value = []
    showCompanyDropdown.value = false
    fetchPageData()
  }

  function goToDetail(item: MatchingItem) {
    uni.navigateTo({
      url: `/pages/customer/company-detail?companyName=${encodeURIComponent(item.name)}&parentCompanyId=${item.parentCompanyId}`
    })
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .fm-wrap {
    padding: 12rpx 24rpx calc(40rpx + env(safe-area-inset-bottom));
  }

  /* #region 搜索记录 */
  .fm-record {
    margin: 0 8rpx 20rpx;
    font-size: 24rpx;
    color: #9ca3af;

    .fm-kw {
      color: #1f2329;
      font-weight: 600;
    }
  }
  /* #endregion */

  /* #region 企业名称搜索 */
  .fm-select {
    position: relative;
    margin-bottom: 24rpx;
  }

  .fm-search {
    display: flex;
    align-items: center;
    gap: 16rpx;
    height: 88rpx;
    padding: 0 28rpx;
    background: #ffffff;
    border-radius: 24rpx;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);

    input {
      flex: 1;
      min-width: 0;
      font-size: 28rpx;
      color: #1f2329;
    }

    .fm-clear {
      width: 36rpx;
      height: 36rpx;
      flex-shrink: 0;
      border-radius: 50%;
      background: #c9cfd8;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        color: #ffffff;
        font-size: 26rpx;
        line-height: 1;
      }

      &:active {
        background: #b3bac6;
      }
    }
  }

  .fm-dropdown {
    position: absolute;
    top: 96rpx;
    left: 0;
    right: 0;
    z-index: 10;
    background: #ffffff;
    border-radius: 24rpx;
    box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.14);
    overflow: hidden;
  }

  .fm-dropdown-list {
    box-sizing: border-box;
  }

  .fm-dropdown-item {
    display: flex;
    align-items: center;
    height: 84rpx;
    padding: 0 28rpx;
    font-size: 28rpx;
    color: #1f2329;
    border-bottom: 1rpx solid #f2f4f7;

    &:last-child {
      border-bottom: none;
    }

    &:active {
      background: #f5f7fa;
    }
  }

  .fm-dropdown-hint {
    padding: 32rpx 28rpx;
    text-align: center;
    font-size: 26rpx;
    color: #9ca3af;
  }
  /* #endregion */

  /* #region 匹配汇总 */
  .fm-sum {
    padding: 24rpx;
    margin-bottom: 24rpx;
    background: #ffffff;
    border-radius: 32rpx;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);

    .fm-sum-top {
      margin: 0 4rpx 18rpx;
      font-size: 24rpx;
      color: #9ca3af;

      .fm-sum-total {
        font-size: 26rpx;
        font-weight: 700;
        color: #1f2329;
      }
    }

    .fm-sum-grid {
      display: flex;
      gap: 16rpx;
    }

    .fm-sum-cell {
      flex: 1;
      min-width: 0;
      padding: 18rpx 22rpx;
      border-radius: 24rpx;

      &.yes {
        background: #e6f7f1;

        .fm-sum-num,
        .fm-sum-unit,
        .fm-sum-label {
          color: #0b7b5b;
        }
      }

      &.no {
        background: #f5f6f8;

        .fm-sum-num,
        .fm-sum-unit,
        .fm-sum-label {
          color: #8a929e;
        }
      }
    }

    .fm-sum-line {
      display: flex;
      align-items: baseline;
      gap: 6rpx;
    }

    .fm-sum-num {
      font-size: 46rpx;
      font-weight: 700;
      line-height: 1.1;
    }

    .fm-sum-unit {
      font-size: 22rpx;
      font-weight: 500;
    }

    .fm-sum-label {
      display: block;
      margin-top: 6rpx;
      font-size: 22rpx;
      line-height: 1.45;
    }
  }
  /* #endregion */

  /* #region 列表上限提示 */
  .fm-note {
    margin: 0 4rpx 18rpx;
    padding-left: 24rpx;
    font-size: 23rpx;
    line-height: 1.6;
    color: #9ca3af;
  }
  /* #endregion */

  /* #region 匹配企业列表 */
  .fm-table {
    padding: 0 24rpx;
    background: #ffffff;
    border-radius: 32rpx;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);
  }

  .fm-thead {
    display: flex;
    align-items: center;
    padding: 22rpx 4rpx;
    border-bottom: 2rpx solid #f0f1f3;
  }

  .fm-th {
    font-size: 24rpx;
    color: #9ca3af;
  }

  .fm-c1 {
    width: 84rpx;
    flex-shrink: 0;
    text-align: center;
  }

  .fm-c2 {
    flex: 1;
    min-width: 0;
  }

  .fm-c3 {
    width: 184rpx;
    flex-shrink: 0;
    text-align: right;
  }

  .fm-tr {
    display: flex;
    align-items: center;
    padding: 0 4rpx;
    border-bottom: 2rpx solid #f0f1f3;

    &:last-child {
      border-bottom: none;
    }

    &:active {
      background: #fafbfd;
    }
  }

  .fm-idx {
    width: 84rpx;
    flex-shrink: 0;
    padding: 26rpx 0;
    text-align: center;
    font-size: 26rpx;
    color: #6b7280;
  }

  .fm-co {
    flex: 1;
    min-width: 0;
    padding: 26rpx 0;
    font-size: 29rpx;
    font-weight: 500;
    color: #1f2329;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .fm-cell {
    width: 184rpx;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10rpx;

    .arrow-right-icon {
      flex-shrink: 0;
    }
  }

  .fm-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 44rpx;
    min-width: 76rpx;
    padding: 0 16rpx;
    border-radius: 14rpx;
    font-size: 24rpx;
    font-weight: 600;

    &.yes {
      background: #e6f7f1;
      color: #0b7b5b;
    }

    &.no {
      background: #f1f3f7;
      color: #6b7280;
    }
  }

  .fm-empty {
    padding: 60rpx 0;
    text-align: center;
    font-size: 26rpx;
    color: #9ca3af;
  }
  /* #endregion */
</style>
