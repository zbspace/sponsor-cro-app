<!-- 中国1类新药获批上市清单 -->
<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">中国1类新药获批上市清单</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/home/head-bg.png" mode="aspectFit" />

  <view class="container">
    <!-- 企业查询选择 -->
    <view class="search-input-section">
      <view class="input-wrapper">
        <icon type="search" size="18" color="#B2B2B2" class="search-icon" />
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="请输入及选择企业名称"
          placeholder-style="color: #B2B2B2"
          @input="onSearchInput"
        />
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

    <!-- 筛选区域 -->
    <view class="filter-wrapper">
      <view class="time-filter-wrapper">
        <uni-data-select
          v-model="currentYearFilter"
          :localdata="yearOptions"
          :clear="false"
          placeholder="请选择"
        ></uni-data-select>
      </view>
      <view class="time-filter-wrapper">
        <uni-data-select
          v-model="drugTypeFilter"
          :localdata="drugTypeOptions"
          :clear="false"
          placeholder="请选择"
        ></uni-data-select>
      </view>
    </view>

    <!-- 列表区域 -->
    <scroll-view
      class="container-scroll-view"
      scroll-y
      :show-scrollbar="false"
      lower-threshold="100"
      :style="{
        height: `calc(100vh - ${menu.top}px - ${menu.height}px - 180px)`
      }"
      @scrolltolower="loadMore"
    >
      <view class="drug-card" v-for="(item, index) in list" :key="index">
        <text class="drug-name">{{ item.cleanedDrugName || '--' }}</text>

        <view class="tag-row">
          <view class="tag type" v-if="item.cleanedDrugType">{{ item.cleanedDrugType }}</view>
          <view class="tag class" v-if="item.cleanedClassification">
            {{ item.cleanedClassification }}
          </view>
        </view>

        <view class="card-body" @click="openRecordPopup(item)">
          <view class="info-row">
            <text class="label">持有人</text>
            <text class="value">{{ item.companyStandardName || '-' }}</text>
          </view>
          <view class="info-row">
            <text class="label">最近一次上市获批时间</text>
            <text class="value">{{ item.lastApprovedDate || '-' }}</text>
          </view>
          <view class="info-row">
            <text class="label">获批记录</text>
            <view v-if="getApprovalRecordCount(item) > 0" class="record-link-container">
              <text class="value record-link">
                {{ getApprovalRecordCount(item) }}
              </text>
              <view class="arrow-right-icon"></view>
            </view>

            <text class="value" v-else>-</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="loading-status" v-if="list.length > 0">
        <text>{{ hasMore ? '正在加载...' : '没有更多了' }}</text>
      </view>
      <!-- 初始/筛选加载中 -->
      <view class="loading-status" v-if="list.length === 0 && loading">
        <text>加载中...</text>
      </view>
      <view class="empty-status" v-if="list.length === 0 && !loading">
        <text>暂无相关记录</text>
      </view>
    </scroll-view>
  </view>

  <!-- 获批记录弹窗 -->
  <bottom-sheet :visible="recordPopupVisible" :z-index="10000" @close="closeRecordPopup">
    <view class="record-popup">
      <view class="modal-head-row">
        <view class="modal-title-wrap">
          <text class="modal-title">获批记录</text>
          <text class="modal-sub">产品获批上市记录</text>
        </view>
        <view class="modal-close" @click="closeRecordPopup">
          <text>×</text>
        </view>
      </view>

      <view class="record-table">
        <view class="record-tr record-thead">
          <text class="record-td col-index">序号</text>
          <text class="record-td col-date">获批日期</text>
          <text class="record-td col-no">受理号</text>
        </view>
        <scroll-view
          scroll-y
          class="record-table-body"
          :show-scrollbar="false"
          :style="{ height: recordTableHeight }"
        >
          <view
            class="record-tr"
            :class="{ striped: index % 2 === 1 }"
            v-for="(row, index) in recordList"
            :key="index"
          >
            <text class="record-td col-index">{{ index + 1 }}</text>
            <text class="record-td col-date">{{ row.approvalDate || '--' }}</text>
            <text class="record-td col-no">{{ row.acceptanceNo || '--' }}</text>
          </view>
          <view class="record-empty" v-if="recordList.length === 0">
            <text>暂无记录</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </bottom-sheet>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { getClassOneApprovedMarketingList, queryStandardCompany } from '@/api'
  import type {
    ClassOneApprovedMarketingParam,
    ClassOneApprovedMarketingVo,
    StandardCompanyItem
  } from '@/types/api'
  import { onLoad } from '@dcloudio/uni-app'

  // #region 企业查询选择（参考商机线索页搜索联想）
  const searchKeyword = ref('')
  const selectedCompany = ref<StandardCompanyItem | null>(null)
  const searchResults = ref<StandardCompanyItem[]>([])
  const showDropdown = ref(false)
  const searchLoading = ref(false)
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  const DROPDOWN_ITEM_HEIGHT = 88
  const DROPDOWN_MAX_HEIGHT = 400
  const dropdownListStyle = computed(() => {
    const count = searchResults.value.length
    const height = Math.min(count * DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT)
    return { height: `${height}rpx` }
  })

  function onSearchInput() {
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

  function selectCompany(item: StandardCompanyItem) {
    searchKeyword.value = item.companyStandardName
    selectedCompany.value = item
    showDropdown.value = false
    // 切换企业后重新加载列表
    fetchList(true)
  }
  // #endregion

  // #region 筛选状态
  // 药品类型取值与 NDA/IND 接口保持一致
  const DRUG_TYPE_VALUES = [
    '化药',
    '预防用生物制品',
    '治疗用生物制品',
    '中药/天然药物',
    '体外诊断试剂',
    '其他'
  ]

  const currentYearFilter = ref<number | ''>('')
  const drugTypeFilter = ref('')

  const yearOptions = computed(() => [
    { value: '', text: '获批年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: year, text: `${year}年度` }
    })
  ])

  const drugTypeOptions = computed(() => [
    { value: '', text: '药品类型' },
    ...DRUG_TYPE_VALUES.map((text) => ({ value: text, text }))
  ])
  // #endregion

  // #region 列表数据
  const list = ref<ClassOneApprovedMarketingVo[]>([])
  const pageNum = ref(1)
  const pageSize = 10
  const total = ref(0)
  const loading = ref(false)
  const hasMore = computed(() => list.value.length < total.value)

  async function fetchList(refresh = false) {
    if (loading.value) return
    if (refresh) {
      pageNum.value = 1
    }
    loading.value = true

    const params: ClassOneApprovedMarketingParam = {
      standardCompanyId: selectedCompany.value?.standardId || '',
      cleanedDrugType: drugTypeFilter.value || '',
      queryYear: currentYearFilter.value || '',
      pageNum: pageNum.value,
      pageSize
    }

    try {
      const res = await getClassOneApprovedMarketingList(params)
      if (res.data) {
        if (refresh) {
          list.value = res.data.list || []
        } else {
          list.value = [...list.value, ...(res.data.list || [])]
        }
        total.value = res.data.total || 0
      }
    } catch (e) {
      console.error('获取1类新药获批上市清单失败', e)
    } finally {
      loading.value = false
    }
  }

  function loadMore() {
    if (hasMore.value && !loading.value) {
      pageNum.value++
      fetchList()
    }
  }
  // #endregion

  // #region 获批记录弹窗
  interface ApprovalRecord {
    approvalDate?: string
    acceptanceNo?: string
  }

  const RECORD_ROW_HEIGHT = 84
  const RECORD_MAX_ROWS = 7
  const recordPopupVisible = ref(false)
  const recordList = ref<ApprovalRecord[]>([])
  const recordTableHeight = computed(
    () =>
      `${Math.min(Math.max(recordList.value.length, 1), RECORD_MAX_ROWS) * RECORD_ROW_HEIGHT}rpx`
  )

  function parseApprovalRecords(raw?: unknown): ApprovalRecord[] {
    if (!raw) return []
    let data: any
    if (Array.isArray(raw)) {
      data = raw
    } else {
      try {
        data = JSON.parse(String(raw))
      } catch {
        return []
      }
    }
    if (!Array.isArray(data)) return []
    return data.map((row: any) => ({
      approvalDate: row.approvalDate ?? row.approvedDate ?? row.approveDate ?? '',
      acceptanceNo: row.acceptanceNo ?? row.acceptanceNumber ?? ''
    }))
  }

  function getApprovalRecordCount(item: ClassOneApprovedMarketingVo) {
    return (
      parseApprovalRecords(item.acceptanceNoApprovalDates).length || item.approvedRecordNum || 0
    )
  }

  function openRecordPopup(item: ClassOneApprovedMarketingVo) {
    recordList.value = parseApprovalRecords(item.acceptanceNoApprovalDates)
    recordPopupVisible.value = true
  }

  function closeRecordPopup() {
    recordPopupVisible.value = false
  }
  // #endregion

  // 筛选变化时自动重新请求列表数据
  watch(currentYearFilter, () => {
    fetchList(true)
  })
  watch(drugTypeFilter, () => {
    fetchList(true)
  })

  // #region 辅助函数
  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }
  // #endregion

  const menu = ref({ top: 0, left: 0, height: 0 })

  onLoad(() => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
  })

  onMounted(() => {
    fetchList(true)
  })
</script>

<script lang="ts">
  export default {
    options: {
      // 微信小程序默认样式隔离，需设为 shared 才能让 :deep() 样式穿透到 uni-data-select 等子组件内部
      styleIsolation: 'shared'
    }
  }
</script>

<style lang="scss" scoped>
  .container {
    padding: 30rpx;
  }

  .header {
    margin-bottom: 50rpx;
  }

  /* 企业搜索 */
  .search-input-section {
    position: relative;
    margin-bottom: 24rpx;

    .input-wrapper {
      background: #ffffff;
      border-radius: 44rpx;
      height: 88rpx;
      padding: 0 40rpx;
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
    }

    .search-dropdown {
      position: absolute;
      top: 96rpx;
      left: 0;
      right: 0;
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

  .filter-wrapper {
    display: flex;
    align-items: center;
    gap: 20rpx;
    width: 100%;
    flex-shrink: 0;
  }

  /* 筛选 */
  .time-filter-wrapper {
    background: #ffffff;
    height: 90rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
    margin-bottom: 24rpx;
    flex: 1;
    min-width: 0;

    :deep(.uni-select) {
      border: none;
      padding: 0;

      .uni-select__input-text {
        font-size: 28rpx;
        color: #333;
      }
      .uni-select__selector {
        width: 220rpx;
        left: -30rpx;
      }
    }
  }

  .container-scroll-view {
    border-radius: 24rpx;
    overflow: hidden;
  }

  .drug-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);

    .drug-name {
      display: block;
      font-size: 32rpx;
      color: #333;
      font-weight: bold;
    }

    .tag-row {
      display: flex;
      gap: 16rpx;
      margin: 20rpx 0 24rpx;

      .tag {
        font-size: 24rpx;
        padding: 8rpx 20rpx;
        border-radius: 10rpx;

        &.type {
          background: #f3e9ff;
          color: #9013fe;
        }
        &.class {
          background: #e9f4ff;
          color: #499ae6;
        }
      }
    }

    .card-body {
      background: #f8f9fb;
      border-radius: 16rpx;
      padding: 24rpx;
      display: flex;
      flex-direction: column;
      gap: 20rpx;

      .info-row {
        display: flex;
        font-size: 26rpx;
        line-height: 1.5;
        justify-content: space-between;

        .label {
          color: #999;
          width: 280rpx;
          flex-shrink: 0;
        }

        .value {
          color: #333;
          flex: 1;
          word-break: break-all;
        }

        .record-link {
          font-weight: 400;
          font-size: 24rpx;
          color: #293959;
          line-height: 40rpx;
        }

        .record-link-container {
          display: flex;
          align-items: center;
          gap: 8rpx;
        }
      }
    }
  }

  /* 获批记录弹窗 */
  .record-popup {
    width: 100%;
    min-height: 80vh;
    max-height: 88vh;
    background: #ffffff;
    border-radius: 40rpx 40rpx 0 0;
    padding: 56rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    position: relative;
    overflow: hidden;
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
  /* #endregion */

  .record-table {
    border: 1rpx solid #eef0f3;
    border-radius: 8rpx;
    overflow: hidden;

    font-weight: 400;
    font-size: 24rpx;
    color: #293959;
    line-height: 52rpx;
  }

  .record-tr {
    display: flex;
    align-items: center;
    min-height: 84rpx;
    font-weight: 400;
    font-size: 24rpx;
    color: #9199ae;
    line-height: 52rpx;
    border-bottom: 1rpx solid #eef0f3;

    &:last-child {
      border-bottom: none;
    }

    &.striped {
      background: #f7f9fc;
    }

    &.record-thead {
      background: #f5f7fa;

      .record-td {
        color: #8b93a1;
      }
    }
  }

  .record-td {
    padding: 16rpx 12rpx;
    text-align: center;
    word-break: break-all;

    &.col-index {
      width: 100rpx;
      flex-shrink: 0;
    }

    &.col-date {
      width: 200rpx;
      flex-shrink: 0;
    }

    &.col-no {
      flex: 1;
    }
  }

  .record-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 84rpx;
    font-size: 26rpx;
    color: #999;
  }

  .loading-status,
  .empty-status {
    padding: 40rpx 0;
    text-align: center;
    font-size: 24rpx;
    color: #999;
  }
</style>
