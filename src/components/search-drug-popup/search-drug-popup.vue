<template>
  <bottom-sheet ref="sheetRef" :visible="visible" @close="close">
    <view class="search-popup-content">
      <!-- 药品搜索 -->
      <template v-if="!showCompanyList">
        <view class="modal-head-row">
          <view class="modal-title-wrap">
            <text class="modal-title">查药品</text>
            <text class="modal-sub">输入药品名称，查看研发企业</text>
          </view>
          <view class="modal-close" @click="close"><text>×</text></view>
        </view>

        <view class="search-wrap">
          <view class="modal-search">
            <view class="search-ico"></view>
            <input
              type="text"
              :adjust-position="false"
              v-model="drugState.keyword"
              placeholder="输入药品名称，如：信迪利单抗"
              placeholder-style="color: #9CA3AF"
              @input="onSearchInput"
              @keyboardheightchange="onKeyboardHeightChange"
            />
            <view class="modal-confirm" @click="handleSearch"><text>搜索</text></view>
          </view>

          <!-- 搜索下拉联想 -->
          <view class="search-dropdown" v-if="drugState.showDropdown">
            <view class="dropdown-loading" v-if="drugState.loading">
              <text>加载中...</text>
            </view>
            <template v-else>
              <!-- 结果较多时可上下滚动 -->
              <scroll-view
                scroll-y
                class="dropdown-list"
                :show-scrollbar="false"
                :style="dropdownListStyle(drugState.results.length)"
                v-if="drugState.results.length > 0"
              >
                <view
                  class="dropdown-item"
                  v-for="item in drugState.results"
                  :key="item.cleanedDrugName"
                  @click="selectDrug(item)"
                >
                  <text class="dropdown-name">{{ item.cleanedDrugName }}</text>
                </view>
              </scroll-view>
              <view class="dropdown-empty" v-if="drugState.results.length === 0">
                <text>未找到相关药品</text>
              </view>
            </template>
          </view>
        </view>

        <view class="modal-history">
          <view class="mh-head">
            <text class="mh-title">搜索历史</text>
            <text class="mh-clear" v-if="recentList.length > 0" @click="clearRecentList">清空</text>
          </view>
          <view class="mh-chips" v-if="recentList.length > 0">
            <view
              class="mh-chip"
              v-for="item in recentList"
              :key="item.cleanedDrugName"
              @click="selectRecent(item)"
            >
              <text>{{ item.cleanedDrugName }}</text>
            </view>
          </view>
          <view class="mh-empty" v-else>
            <view class="mh-empty-ico"><view class="search-ico"></view></view>
            <text>暂无搜索记录</text>
          </view>
        </view>
      </template>

      <!-- 相关企业列表 -->
      <template v-else>
        <view class="modal-head-row">
          <view class="modal-back" @click="backToDrug"><text>‹</text></view>
          <view class="modal-title-wrap">
            <text class="modal-title">选择相关企业</text>
            <text class="modal-sub">选择企业后查看药品统计</text>
          </view>
          <view class="modal-close" @click="close"><text>×</text></view>
        </view>

        <view class="company-loading" v-if="companyLoading">
          <text>加载中...</text>
        </view>
        <template v-else>
          <scroll-view
            scroll-y
            class="company-list"
            :show-scrollbar="false"
            v-if="companyList.length > 0"
          >
            <view class="company-table">
              <view class="table-row table-head">
                <view class="col-index"><text>序号</text></view>
                <view class="col-company"><text>企业</text></view>
              </view>
              <view
                class="table-row"
                v-for="(item, index) in companyList"
                :key="item.parentCompanyId"
                @click="selectCompany(item)"
              >
                <view class="col-index">
                  <text>{{ index + 1 }}</text>
                </view>
                <view class="col-company">
                  <text>{{ item.parentCompanyShortName || item.companyStandardName }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
          <view class="company-empty" v-if="companyList.length === 0">
            <text>未找到相关企业</text>
          </view>
        </template>
      </template>
    </view>
  </bottom-sheet>
</template>

<script setup lang="ts">
  // #region 导入
  import { shallowReactive, ref, watch } from 'vue'
  import { queryCleanedDrugName, queryParentCompanyByDrugName } from '@/api'
  import type { CleanedDrugItem, CompanyShortItem } from '@/types/api'
  // #endregion

  // #region 类型定义
  interface DrugSearchState {
    keyword: string
    results: CleanedDrugItem[]
    showDropdown: boolean
    loading: boolean
    selected: CleanedDrugItem | null
    timer: ReturnType<typeof setTimeout> | null
  }
  // #endregion

  // #region 属性与事件
  const props = defineProps<{
    visible: boolean
  }>()

  const emit = defineEmits(['update:visible'])
  // #endregion

  // #region 键盘避让
  // 弹层容器引用：input 的 keyboardheightchange 事件拿到键盘高度后上报给 bottom-sheet
  const sheetRef = ref<{ setKeyboardHeight: (height: number) => void } | null>(null)

  function onKeyboardHeightChange(e: { detail: { height: number } }) {
    sheetRef.value?.setKeyboardHeight(e.detail?.height || 0)
  }
  // #endregion

  // #region 药品搜索
  const drugState = shallowReactive<DrugSearchState>({
    keyword: '',
    results: [],
    showDropdown: false,
    loading: false,
    selected: null,
    timer: null
  })

  function onSearchInput() {
    if (drugState.timer) clearTimeout(drugState.timer)
    drugState.selected = null // 输入时重置已选

    const keyword = drugState.keyword.trim()
    if (!keyword) {
      drugState.results = []
      drugState.showDropdown = false
      return
    }

    drugState.timer = setTimeout(() => {
      fetchDrugNames()
    }, 300)
  }

  async function fetchDrugNames() {
    const keyword = drugState.keyword.trim()
    if (!keyword) return

    drugState.loading = true
    drugState.showDropdown = true

    try {
      const res = await queryCleanedDrugName({
        pageNum: 1,
        pageSize: 20,
        searchKey: keyword
      })
      drugState.results = res.data?.list || []
    } catch {
      drugState.results = []
    } finally {
      drugState.loading = false
    }
  }

  function selectDrug(item: CleanedDrugItem) {
    drugState.keyword = item.cleanedDrugName
    drugState.selected = item
    drugState.showDropdown = false
  }
  // #endregion

  // #region 相关企业列表
  const showCompanyList = ref(false)
  const companyLoading = ref(false)
  const companyList = ref<CompanyShortItem[]>([])
  // 当前搜索的药品名，用于企业查询与跳转
  const currentDrugName = ref('')

  // 第一步：按药品名查询相关企业
  async function handleSearch() {
    const drugName = (drugState.selected?.cleanedDrugName || drugState.keyword).trim()
    if (!drugName) {
      uni.showToast({
        title: '请选择药品',
        icon: 'none'
      })
      return
    }

    if (drugState.timer) clearTimeout(drugState.timer)
    drugState.showDropdown = false
    currentDrugName.value = drugName
    saveRecent(drugState.selected || { cleanedDrugName: drugName })

    // 第二步：展示相关企业列表
    showCompanyList.value = true
    companyList.value = []
    companyLoading.value = true

    try {
      const res = await queryParentCompanyByDrugName({
        pageNum: 1,
        pageSize: 50,
        searchKey: drugName
      })
      companyList.value = res.data?.list || []
    } catch {
      companyList.value = []
    } finally {
      companyLoading.value = false
    }
  }

  function backToDrug() {
    showCompanyList.value = false
    companyList.value = []
    companyLoading.value = false
  }

  // 第三步：选择企业后进入药品统计主页
  function selectCompany(company: CompanyShortItem) {
    const drug = drugState.selected
    const query = [
      `drugStandardName=${encodeURIComponent(currentDrugName.value)}`,
      `parentCompanyId=${company.parentCompanyId ?? ''}`,
      `standardCompanyName=${encodeURIComponent(company.parentCompanyShortName || '')}`,
      `cleanedDrugType=${encodeURIComponent(drug?.drugType || '')}`,
      `cleanedClassification=${encodeURIComponent((drug?.registrationCategoryList || []).join('、'))}`
    ]

    uni.navigateTo({
      url: `/pages/drug-stat/index?${query.join('&')}`
    })

    close()
  }
  // #endregion

  // #region 最近搜索记录
  const RECENT_STORAGE_KEY = 'searchDrugRecentList'
  const RECENT_MAX_COUNT = 10
  const recentList = ref<CleanedDrugItem[]>([])

  function loadRecentList() {
    try {
      const data = uni.getStorageSync(RECENT_STORAGE_KEY)
      // 兼容旧版本仅存药品名的记录
      const list: CleanedDrugItem[] = Array.isArray(data)
        ? data.filter((item: any) => item && typeof item === 'object')
        : []
      recentList.value = list.slice(0, RECENT_MAX_COUNT)
    } catch {
      recentList.value = []
    }
  }

  // 记录搜索药品信息：去重、最新的排前面、最多保留 10 条
  function saveRecent(item: CleanedDrugItem) {
    const list = [
      item,
      ...recentList.value.filter((record) => record.cleanedDrugName !== item.cleanedDrugName)
    ].slice(0, RECENT_MAX_COUNT)
    recentList.value = list
    uni.setStorageSync(RECENT_STORAGE_KEY, list)
  }

  // 清空搜索历史
  function clearRecentList() {
    recentList.value = []
    uni.removeStorageSync(RECENT_STORAGE_KEY)
  }

  // 点击历史记录：回填药品信息并直接查询相关企业
  function selectRecent(item: CleanedDrugItem) {
    drugState.keyword = item.cleanedDrugName
    drugState.selected = item
    drugState.showDropdown = false
    handleSearch()
  }
  // #endregion

  // #region UI 辅助逻辑
  // 下拉列表高度：单行约 88rpx，最多展示约 400rpx，超出可上下滚动
  const DROPDOWN_ITEM_HEIGHT = 88
  const DROPDOWN_MAX_HEIGHT = 400
  function dropdownListStyle(count: number) {
    const height = Math.min(count * DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT)
    return { height: `${height}rpx` }
  }

  function close() {
    emit('update:visible', false)
  }
  // #endregion

  // #region 监听
  watch(
    () => props.visible,
    (val) => {
      if (val) {
        // 打开时读取最近搜索记录
        loadRecentList()
        return
      }
      // 关闭时重置药品与企业列表状态
      if (drugState.timer) clearTimeout(drugState.timer)
      drugState.timer = null
      drugState.keyword = ''
      drugState.results = []
      drugState.showDropdown = false
      drugState.selected = null
      backToDrug()
      currentDrugName.value = ''
    }
  )
  // #endregion
</script>

<style lang="scss" scoped>
  .search-popup-content {
    width: 100%;
    min-height: 80vh;
    max-height: 86vh;
    background: #ffffff;
    border-radius: 40rpx 40rpx 0 0;
    padding: 56rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
    position: relative;
    box-sizing: border-box;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  /* #region 头部 */
  .modal-head-row {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding-bottom: 20rpx;

    .modal-title-wrap {
      flex: 1;
      min-width: 0;
    }

    .modal-title {
      display: block;
      font-size: 32rpx;
      font-weight: 600;
      color: #1f2329;
    }

    .modal-sub {
      display: block;
      margin-top: 4rpx;
      font-size: 22rpx;
      color: #9ca3af;
    }

    .modal-close {
      width: 60rpx;
      height: 60rpx;
      flex-shrink: 0;
      border-radius: 50%;
      background: #f7f8fa;
      color: #6b7280;
      font-size: 40rpx;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;

      &:active {
        background: #eceef1;
      }
    }
  }

  .modal-back {
    width: 60rpx;
    height: 60rpx;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 48rpx;
      line-height: 1;
      color: #6b7280;
    }
  }
  /* #endregion */

  /* #region 搜索框 */
  .search-wrap {
    position: relative;
    margin-bottom: 16rpx;

    .modal-search {
      display: flex;
      align-items: center;
      gap: 16rpx;
      height: 80rpx;
      padding: 0 24rpx;
      background: #f7f8fa;
      border-radius: 20rpx;

      input {
        flex: 1;
        min-width: 0;
        font-size: 28rpx;
        color: #1f2329;
      }
    }

    .modal-confirm {
      flex-shrink: 0;
      height: 60rpx;
      padding: 0 32rpx;
      border-radius: 16rpx;
      background: #1e6fff;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        color: #ffffff;
        font-size: 26rpx;
      }

      &:active {
        opacity: 0.85;
      }
    }

    .search-dropdown {
      position: absolute;
      top: 92rpx;
      left: 0;
      right: 0;
      padding: 8rpx 12rpx;
      background: #ffffff;
      border-radius: 20rpx;
      box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.1);
      z-index: 10;

      .dropdown-list {
        width: 100%;
      }

      .dropdown-item {
        padding: 22rpx 16rpx;
        border-radius: 16rpx;

        &:active {
          background: #f7f8fa;
        }

        .dropdown-name {
          font-size: 28rpx;
          color: #1f2329;
        }
      }

      .dropdown-loading,
      .dropdown-empty {
        padding: 30rpx 0;
        text-align: center;
        font-size: 26rpx;
        color: #9ca3af;
      }
    }
  }

  // 放大镜图标（纯 CSS 绘制）
  .search-ico {
    position: relative;
    width: 34rpx;
    height: 34rpx;
    flex-shrink: 0;
    border: 4rpx solid #9ca3af;
    border-radius: 50%;
    box-sizing: border-box;

    &::after {
      content: '';
      position: absolute;
      right: -10rpx;
      bottom: -8rpx;
      width: 14rpx;
      height: 4rpx;
      border-radius: 2rpx;
      background: #9ca3af;
      transform: rotate(45deg);
    }
  }
  /* #endregion */

  /* #region 搜索历史 */
  .modal-history {
    padding-top: 4rpx;
    flex: 1;
    display: flex;
    flex-direction: column;

    .mh-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 4rpx 0 16rpx;
    }

    .mh-title {
      font-size: 24rpx;
      color: #9ca3af;
    }

    .mh-clear {
      font-size: 24rpx;
      color: #9ca3af;

      &:active {
        color: #1e6fff;
      }
    }

    .mh-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;
    }

    .mh-chip {
      padding: 12rpx 26rpx;
      background: #f7f8fa;
      border-radius: 32rpx;

      text {
        font-size: 26rpx;
        color: #1f2329;
      }

      &:active {
        background: #e8edf3;

        text {
          color: #1e6fff;
        }
      }
    }

    .mh-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20rpx;
      padding: 44rpx 0 20rpx;

      .mh-empty-ico {
        width: 104rpx;
        height: 104rpx;
        border-radius: 50%;
        background: #f7f8fa;
        display: flex;
        align-items: center;
        justify-content: center;

        .search-ico {
          width: 44rpx;
          height: 44rpx;
          border-color: #c6cbd4;

          &::after {
            right: -12rpx;
            bottom: -10rpx;
            width: 18rpx;
            height: 5rpx;
            background: #c6cbd4;
          }
        }
      }

      text {
        font-size: 24rpx;
        color: #9ca3af;
      }
    }
  }
  /* #endregion */

  /* #region 相关企业列表 */
  .company-list {
    max-height: 640rpx;

    .company-table {
      border: 1rpx solid #4096ee;
      border-bottom: none;
    }

    .table-row {
      display: flex;
      align-items: center;
      height: 88rpx;
      border-bottom: 1rpx solid #4096ee;

      &.table-head {
        background: #4096ee;

        text {
          color: #ffffff;
          font-weight: bold;
        }
      }

      .col-index {
        width: 140rpx;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        border-right: 1rpx solid #4096ee;

        text {
          font-size: 26rpx;
          color: #333333;
        }
      }

      .col-company {
        flex: 1;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 0 16rpx;
        overflow: hidden;

        text {
          font-size: 26rpx;
          color: #333333;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
      }
    }
  }

  .company-loading,
  .company-empty {
    padding: 60rpx 0;
    text-align: center;
    font-size: 26rpx;
    color: #999999;
  }
  /* #endregion */
</style>
