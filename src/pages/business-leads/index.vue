<!-- 商机线索 -->
<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon visibility-hidden">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">{{ '商机线索' }}</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <!-- #region 免费领VIP -->
  <view class="free-vip-banner-container" v-if="userInfo?.vipCode === VIP_CODE.普通">
    <free-vip-banner
      :visible="showFreeVipBanner"
      @apply="handleBannerApply"
      @close="showFreeVipBanner = false"
      @success="fetchVipApplicationStatus"
    />
  </view>

  <!-- 查询公司 -->
  <view class="search-input-section">
    <view class="input-wrapper">
      <icon type="search" size="18" color="#B2B2B2" class="search-icon" />
      <input
        type="text"
        v-model="searchKeyword"
        placeholder="搜索企业名称"
        placeholder-style="color: #B2B2B2"
        @input="onSearchInput"
      />
      <view class="search-go" @click="handleSearchClick">
        <text>搜索</text>
      </view>
    </view>

    <!-- 搜索下拉联想 -->
    <view class="search-dropdown" v-if="showDropdown">
      <view class="dropdown-loading" v-if="searchLoading">
        <text>加载中...</text>
      </view>
      <template v-else>
        <!-- 结果较多时可上下滚动 -->
        <scroll-view
          scroll-y
          class="dropdown-list"
          :show-scrollbar="false"
          :style="dropdownListStyle"
          v-if="searchResults.length > 0"
        >
          <view
            class="dropdown-item"
            v-for="item in searchResults"
            :key="item.standardId"
            @click="selectCompany(item)"
          >
            <text class="dropdown-name">{{ item.companyStandardName }}</text>
          </view>
        </scroll-view>
        <view class="dropdown-empty" v-if="searchResults.length === 0">
          <text>未找到相关公司</text>
        </view>
      </template>
    </view>
  </view>

  <!-- 线索类型 -->
  <view class="seg-tabs">
    <view
      class="seg-tab"
      v-for="item in typeOptions"
      :key="item.value"
      :class="{ active: type === item.value }"
      @click="handleTypeChange(item.value)"
    >
      <text>{{ item.label }}</text>
      <text class="seg-n" v-if="typeCounts[item.value] > 0">
        {{ formatCount(typeCounts[item.value]) }}
      </text>
    </view>
  </view>

  <scroll-view
    scroll-y
    class="container-scroll-view"
    :show-scrollbar="false"
    lower-threshold="100"
    @scrolltolower="loadMore"
    :style="{
      height: `calc(100vh - ${menu.top}px - ${menu.height}px - 200px)`
    }"
  >
    <view class="container">
      <!-- 列表内容 -->
      <view class="list-container">
        <view class="lead-card" v-for="(item, index) in list" :key="index">
          <!-- 药品名称 + 分类/分期 -->
          <view class="lead-head">
            <text class="lead-drug">{{ item.drugStandardName }}</text>
            <text class="tag tag-lead" v-if="item.cleanedClassificationOrStages">
              {{ item.cleanedClassificationOrStages }}
            </text>
          </view>

          <view class="lead-tags">
            <text class="tag" :class="getDrugTypeClass(item)" v-if="item.cleanedDrugType">
              {{ item.cleanedDrugType }}
            </text>
            <text class="tag tag-amber" v-if="item.ndaPriorityApproval">
              {{ item.ndaPriorityApproval }}
            </text>
          </view>

          <!-- 字段信息 -->
          <view class="lead-fields">
            <view class="lf" v-for="row in getFieldRows(item)" :key="row.label">
              <text class="lf-label">{{ row.label }}：</text>
              <text class="lf-value">{{ row.value || '—' }}</text>
              <text class="tag tag-fresh" v-if="row.fresh">6个月以内</text>
              <text class="lf-note" v-if="row.note">{{ row.note }}</text>
            </view>
          </view>

          <!-- 商机线索 -->
          <view class="lead-tip">
            <text class="tip-label">商机线索：</text>
            <text>{{ item.businessClueText }}</text>
          </view>
        </view>

        <!-- 加载状态 -->
        <view class="load-more">
          <text v-if="loading">加载中...</text>
          <text v-else-if="finished && list.length > 0">没有更多了</text>
          <text v-else-if="list.length === 0">暂无数据</text>
        </view>
      </view>
    </view>
  </scroll-view>

  <phone-bind-popup />

  <!-- 底部导航 -->
  <tab-bar active="opportunity" />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import {
    getAfterListingBusinessClueList,
    getBeforeListingBusinessClueList,
    queryStandardCompany,
    refreshUserDetail,
    getUserInfo
  } from '@/api'
  import type { OpportunityVo, OpportunityParam, StandardCompanyItem } from '@/types/api'
  import { VIP_CODE, APPLY_STATUS } from '@/utils/enums'
  import FreeVipBanner from '@/components/free-vip-banner/free-vip-banner.vue'
  import TabBar from '@/components/tab-bar/index.vue'
  // #endregion

  // #region 页面基础状态与生命周期
  const menu = ref({ top: 0, left: 0, height: 0 })
  const companyName = ref('')
  const companyId = ref()
  // 先用本地缓存渲染，登录完成后刷新为最新用户信息
  const userInfo = ref(getUserInfo())

  const goBack = () => {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  onLoad((options: any) => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    if (options?.companyName) {
      companyName.value = decodeURIComponent(options.companyName)
    }
    if (options?.companyId) {
      companyId.value = Number(options.companyId)
    }
    if (options?.type) {
      type.value = options.type as ClueType
    }

    fetchList()
    fetchTypeCount(otherType())
    fetchVipApplicationStatus()
  })
  // #endregion

  // #region 线索列表加载逻辑
  type ClueType = 'before' | 'after'

  const type = ref<ClueType>('before')
  const typeOptions = [
    { label: 'I期/II期/III期', value: 'before' },
    { label: 'IV期/IIT', value: 'after' }
  ] as const
  /** 各类型线索条数（用于 Tab 角标） */
  const typeCounts = ref<Record<ClueType, number>>({ before: 0, after: 0 })

  const list = ref<OpportunityVo[]>([])
  const pageNum = ref(1)
  const pageSize = 10
  const loading = ref(false)
  const finished = ref(false)

  function otherType() {
    return type.value === 'before' ? 'after' : 'before'
  }

  // 注意：后端接口命名与线索类型相反
  // 上市前 -> getBeforeListingBusinessClueList，上市后 -> getAfterListingBusinessClueList
  function getListApi(target: ClueType) {
    return target === 'before' ? getBeforeListingBusinessClueList : getAfterListingBusinessClueList
  }

  function resetList() {
    list.value = []
    pageNum.value = 1
    finished.value = false
  }

  async function fetchList() {
    if (loading.value || finished.value) return
    loading.value = true

    try {
      const params: OpportunityParam = {
        pageNum: pageNum.value,
        pageSize: pageSize,
        parentCompanyId: companyId.value
      }

      const res = await getListApi(type.value)(params)
      const resData = res.data

      if (resData) {
        const newList = resData.list || []
        list.value = [...list.value, ...newList]
        typeCounts.value[type.value] = resData.total || 0
        if (newList.length < pageSize || pageNum.value >= resData.pages) {
          finished.value = true
        }
      }
    } catch (error) {
      console.error('获取列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  /** 未加载过的类型也需要展示线索条数，这里轻量拉取一次总数 */
  async function fetchTypeCount(target: ClueType) {
    if (typeCounts.value[target]) return
    try {
      const res = await getListApi(target)({
        pageNum: 1,
        pageSize: 1,
        parentCompanyId: companyId.value
      })
      typeCounts.value[target] = res.data?.total || 0
    } catch {
      typeCounts.value[target] = 0
    }
  }

  function handleTypeChange(val: ClueType) {
    if (type.value === val) return
    type.value = val
    resetList()
    fetchList()
  }

  function loadMore() {
    if (!finished.value && !loading.value) {
      pageNum.value++
      fetchList()
    }
  }

  /** 按企业筛选线索列表 */
  function applyCompany(item: StandardCompanyItem) {
    companyName.value = item.companyStandardName
    companyId.value = item.parentCompanyId
    typeCounts.value = { before: 0, after: 0 }
    resetList()
    fetchList()
    fetchTypeCount(otherType())
  }

  /** 药品类型标签配色：生物制品用紫色，化药用青色 */
  function getDrugTypeClass(item: OpportunityVo) {
    return item.cleanedDrugType?.includes('生物') ? 'tag-bio' : 'tag-chem'
  }

  interface FieldRow {
    label: string
    value: string
    /** 是否展示「6个月以内」标签 */
    fresh?: boolean
    /** 值后的补充说明 */
    note?: string
  }

  const DATE_LABEL: Record<string, string> = {
    ind: '受理日期',
    cde: '登记日期',
    nda: '受理日期'
  }

  /** 日期是否在 6 个月以内 */
  function isFreshDate(date: string) {
    if (!date) return false
    const [year, month, day] = date.split('-').map(Number)
    if (!year || !month || !day) return false
    const limit = new Date()
    limit.setMonth(limit.getMonth() - 6)
    return new Date(year, month - 1, day).getTime() >= limit.getTime()
  }

  /**
   * 根据数据类型组装卡片字段行
   * ind: 受理日期 + 受理状态 + 获批日期 + 受理号 + 适应症
   * cde: 登记日期 + 试验分期 + 登记号 + 适应症
   * nda: 受理日期 + 申请状态 + 获批日期 + 受理号 + 适应症
   */
  function getFieldRows(item: OpportunityVo): FieldRow[] {
    const rows: FieldRow[] = [
      { label: '申请人', value: item.applicationCompany },
      {
        label: DATE_LABEL[item.dataType] || '受理日期',
        value: item.undertakeDate,
        fresh: isFreshDate(item.undertakeDate)
      }
    ]

    if (item.dataType === 'cde') {
      rows.push({ label: '试验分期', value: item.cleanedClassificationOrStages })
      rows.push({ label: '登记号', value: item.acceptanceNo })
    } else {
      rows.push({
        label: item.dataType === 'nda' ? '申请状态' : '受理状态',
        value: item.applicationStatus
      })
      rows.push({ label: '获批日期', value: item.approvalTime })
      rows.push({ label: '受理号', value: item.acceptanceNo })
    }

    rows.push({
      label: '适应症',
      value: item.indication,
      note: item.dataType === 'ind' && !item.indication ? '（获批后适应症才会公示）' : ''
    })

    return rows
  }

  /** Tab 角标数字千分位展示 */
  function formatCount(count: number) {
    return String(count).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  }
  // #endregion

  // #region 搜索联想逻辑
  const searchKeyword = ref('')
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  const selectedCompany = ref<StandardCompanyItem | null>(null)
  const searchResults = ref<StandardCompanyItem[]>([])
  const showDropdown = ref(false)
  const searchLoading = ref(false)

  const DROPDOWN_ITEM_HEIGHT = 88
  const DROPDOWN_MAX_HEIGHT = 400
  const dropdownListStyle = computed(() => {
    const count = searchResults.value.length
    const height = Math.min(count * DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT)
    return { height: `${height}rpx` }
  })

  function onSearchInput() {
    if (!checkPermission()) {
      return
    }
    if (searchTimer) clearTimeout(searchTimer)
    selectedCompany.value = null

    const keyword = searchKeyword.value.trim()
    if (!keyword) {
      searchResults.value = []
      showDropdown.value = false
      return
    }

    searchTimer = setTimeout(() => {
      fetchSearchResults()
    }, 300)
  }

  async function fetchSearchResults() {
    const keyword = searchKeyword.value.trim()
    if (!keyword) return

    searchLoading.value = true
    showDropdown.value = true

    try {
      const res = await queryStandardCompany({
        companyStandardName: keyword,
        pageNum: 1,
        pageSize: 99
      })
      searchResults.value = res.data?.list || []
    } catch {
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  /** 点击「搜索」：立即查询企业联想列表 */
  function handleSearchClick() {
    if (!checkPermission()) {
      return
    }
    if (!searchKeyword.value.trim()) {
      uni.showToast({ title: '请输入企业名称', icon: 'none' })
      return
    }
    if (searchTimer) clearTimeout(searchTimer)
    fetchSearchResults()
  }

  function selectCompany(item: StandardCompanyItem) {
    searchKeyword.value = item.companyStandardName
    selectedCompany.value = item
    showDropdown.value = false
    applyCompany(item)
  }
  // #endregion

  // #region VIP 状态与权限控制
  // 申请状态：0-未申请，1-申请试用中，2-试用中，3-申请开通中，4-开通中
  const applyStatus = ref<number>(APPLY_STATUS.未申请)
  const showVipExpiredPopup = ref(false)
  const showFreeVipBanner = ref(false)

  // 是否存在待处理的申请（申请试用中 / 申请开通中）
  const hasPendingApply = computed(
    () =>
      applyStatus.value === APPLY_STATUS.申请试用中 || applyStatus.value === APPLY_STATUS.申请开通中
  )

  async function fetchVipApplicationStatus() {
    const detail = await refreshUserDetail()
    if (!detail) {
      applyStatus.value = APPLY_STATUS.未申请
      showFreeVipBanner.value = false
      return
    }
    userInfo.value = detail
    applyStatus.value = detail.applyStatus ?? APPLY_STATUS.未申请
    // 从未申请过 → 展示「免费试用」横幅
    showFreeVipBanner.value = applyStatus.value === APPLY_STATUS.未申请
  }

  function checkPermission() {
    const userInfo = getUserInfo()
    const vipCode = userInfo?.vipCode ?? 0

    if (vipCode !== 0) return true

    // 已提交申请，等待处理
    if (hasPendingApply.value) {
      uni.showToast({
        title: '您已经提交申请，请您耐心等待',
        icon: 'none',
        duration: 3000
      })
      return false
    }
    // 申请过但当前不是会员 → 会员已过期，引导重新申请
    if (applyStatus.value !== APPLY_STATUS.未申请) {
      showVipExpiredPopup.value = true
      return false
    }
    return true
  }

  function handleBannerApply() {
    if (hasPendingApply.value) {
      uni.showToast({ title: '您已提交试用申请，等待电话联系', icon: 'none' })
      return
    }
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .container {
    padding: 30rpx;
    padding-top: 0;
  }

  .note-box {
    padding: 24rpx;
    background: linear-gradient(180deg, rgba(255, 241, 241, 0.5) 0%, rgba(255, 255, 255, 0) 100%);
    border-radius: 16rpx;
    margin-bottom: 30rpx;

    .note-text {
      font-size: 24rpx;
      color: #ff4d4f;
      line-height: 1.6;
    }
  }

  /* #region 查询公司 */
  .search-input-section {
    position: relative;
    margin: 40rpx 0;
    padding: 0 30rpx;

    .input-wrapper {
      background: #ffffff;
      border-radius: 44rpx;
      height: 88rpx;
      padding: 0 12rpx 0 32rpx;
      display: flex;
      align-items: center;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);

      .search-icon {
        margin-right: 16rpx;
      }

      input {
        flex: 1;
        font-size: 28rpx;
        color: #333333;
      }

      .search-go {
        flex-shrink: 0;
        height: 64rpx;
        padding: 0 28rpx;
        border-radius: 32rpx;
        background: #1e6fff;
        display: flex;
        align-items: center;

        text {
          color: #ffffff;
          font-size: 26rpx;
          font-weight: 600;
        }

        &:active {
          background: #0a57eb;
        }
      }
    }

    .search-dropdown {
      position: absolute;
      top: 96rpx;
      left: 30rpx;
      right: 30rpx;
      background: #ffffff;
      border-radius: 12rpx;
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
      z-index: 10;
      max-height: 400rpx;
      overflow-y: auto;

      // 滚动列表
      .dropdown-list {
        width: 100%;
      }

      .dropdown-item {
        padding: 24rpx 30rpx;
        border-bottom: 1rpx solid #f5f5f5;

        &:last-child {
          border-bottom: none;
        }

        &:active {
          background: #f7f8fa;
        }

        .dropdown-name {
          font-size: 28rpx;
          color: #333333;
        }
      }

      .dropdown-loading,
      .dropdown-empty {
        padding: 30rpx 0;
        text-align: center;
        font-size: 26rpx;
        color: #999999;
      }
    }
  }
  /* #endregion */

  /* #region 线索类型切换 */
  .seg-tabs {
    display: flex;
    background: #ffffff;
    border-radius: 24rpx;
    padding: 6rpx;
    margin: 0 30rpx 24rpx;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);

    .seg-tab {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10rpx;
      padding: 16rpx 0;
      border-radius: 18rpx;
      font-size: 26rpx;
      color: #6b7280;
      transition: all 0.15s;

      &.active {
        background: #1e6fff;
        color: #ffffff;
        font-weight: 600;
      }

      .seg-n {
        padding: 2rpx 12rpx;
        border-radius: 18rpx;
        background: rgba(30, 111, 255, 0.09);
        color: #1e6fff;
        font-size: 22rpx;
        font-weight: 600;
      }

      &.active .seg-n {
        background: rgba(255, 255, 255, 0.24);
        color: #ffffff;
      }
    }
  }
  /* #endregion */

  /* #region 线索卡片 */
  .tag {
    font-size: 20rpx;
    padding: 4rpx 14rpx;
    border-radius: 10rpx;
    font-weight: 500;
  }

  .tag-lead {
    background: #1e6fff;
    color: #ffffff;
  }

  .tag-bio {
    background: #eef0fe;
    color: #6d28d9;
  }

  .tag-chem {
    background: #e6f7f1;
    color: #0b7b5b;
  }

  .tag-amber {
    background: #fdf3e3;
    color: #b45309;
  }

  .tag-fresh {
    background: #e6f7f1;
    color: #0b7b5b;
  }

  .lead-card {
    background: #ffffff;
    border-radius: 28rpx;
    padding: 28rpx 32rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);

    .lead-head {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .lead-drug {
        font-size: 30rpx;
        font-weight: 600;
        color: #1f2329;
      }

      .tag-lead {
        margin-left: auto;
        flex-shrink: 0;
      }
    }

    .lead-tags {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12rpx;
      margin-top: 12rpx;
    }

    .lead-fields {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
      margin-top: 24rpx;

      .lf {
        display: flex;
        font-size: 24rpx;
        line-height: 1.5;

        .lf-label {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .lf-value {
          color: #6b7280;
          word-break: break-all;
        }

        .lf-note {
          color: #9ca3af;
          font-size: 22rpx;
        }

        .tag-fresh {
          margin-left: 12rpx;
          flex-shrink: 0;
        }
      }
    }

    .lead-tip {
      margin-top: 24rpx;
      padding: 20rpx 24rpx;
      background: #ebf3ff;
      border-radius: 18rpx;
      font-size: 24rpx;
      color: #0a57eb;
      line-height: 1.6;

      .tip-label {
        color: #1e6fff;
        font-weight: 600;
      }
    }
  }

  .load-more {
    padding: 30rpx 0;
    text-align: center;
    font-size: 24rpx;
    color: #999;
  }
  /* #endregion */
</style>
