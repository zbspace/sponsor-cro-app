<!-- 中国药企临床试验榜单 -->
<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">中国药企临床试验榜单</text>
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
        <text class="clear-icon" v-if="searchKeyword" @click="clearSearchKeyword">×</text>
      </view>

      <!-- 搜索下拉联想 -->
      <view class="search-dropdown" v-if="showDropdown">
        <view class="dropdown-loading" v-if="searchLoading">
          <text>加载中...</text>
        </view>
        <template v-else>
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
          v-model="stageFilter"
          :localdata="stageOptions"
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
    <view
      class="rank-scroll-wrapper"
      :style="{
        height: `calc(100vh - ${menu.top}px - ${menu.height}px - 150px)`
      }"
    >
      <view class="card list-card">
        <!-- 表头固定在滚动区域外 -->
        <view class="table-header">
          <text class="col-rank">序号</text>
          <text class="col-name">药企名称</text>
          <text class="col-count">临床试验</text>
        </view>

        <scroll-view
          class="container-scroll-view"
          scroll-y
          :show-scrollbar="false"
          lower-threshold="100"
          @scrolltolower="loadMore"
        >
          <view class="table-body">
            <view
              class="table-row"
              v-for="(item, index) in list"
              :key="item.parentCompanyId ?? index"
              hover-class="row-hover"
              @click="onRowClick(item)"
            >
              <text class="col-rank">{{ item.rankNo ?? index + 1 }}</text>
              <text class="col-name">{{ item.parentCompanyName || '--' }}</text>
              <text class="col-count">{{ item.clinicalTrialNum ?? '--' }}</text>
            </view>
          </view>

          <!-- 加载状态提示 -->
          <view class="load-status" v-if="loading && list.length > 0">
            <text>加载中...</text>
          </view>
          <view class="load-status" v-else-if="!hasMore && list.length > 0">
            <text>{{ list.length >= MAX_COUNT ? '已达200条展示上限' : '没有更多了' }}</text>
          </view>
          <view class="load-status" v-if="!loading && list.length === 0">
            <text>暂无数据</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { getClinicalTrialDevelopmentRank, queryStandardCompany } from '@/api'
  import type {
    ClinicalTrialDevelopmentRankParam,
    ClinicalTrialDevelopmentRankVo,
    StandardCompanyItem
  } from '@/types/api'
  import { onLoad } from '@dcloudio/uni-app'
  import { DRUG_TYPE_VALUES, TRIAL_PHASE_VALUES, createEnumsToOptions } from '@/utils/enums'

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

  /** 清空搜索关键字并复位联想状态，恢复全量榜单 */
  function clearSearchKeyword() {
    searchKeyword.value = ''
    selectedCompany.value = null
    searchResults.value = []
    showDropdown.value = false
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
    fetchList(true)
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
  // 试验分期/药品类型取值与 CDE 接口文档保持一致
  const currentYearFilter = ref<number | ''>('')
  const stageFilter = ref('')
  const drugTypeFilter = ref('')

  const yearOptions = computed(() => [
    { value: '', text: '年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: year, text: `${year}年度` }
    })
  ])

  const stageOptions = computed(() => [
    { value: '', text: '试验分期' },
    ...createEnumsToOptions(TRIAL_PHASE_VALUES)
  ])

  const drugTypeOptions = computed(() => [
    { value: '', text: '药品类型' },
    ...createEnumsToOptions(DRUG_TYPE_VALUES)
  ])
  // #endregion

  // #region 列表数据
  const list = ref<ClinicalTrialDevelopmentRankVo[]>([])
  const pageNum = ref(1)
  const pageSize = 20
  const total = ref(0)
  const loading = ref(false)
  // 最多展示 200 条数据
  const MAX_COUNT = 200
  const hasMore = computed(() => list.value.length < Math.min(total.value, MAX_COUNT))

  async function fetchList(refresh = false) {
    if (loading.value) return
    if (refresh) {
      pageNum.value = 1
    }
    loading.value = true

    const params: ClinicalTrialDevelopmentRankParam = {
      parentCompanyId: selectedCompany.value?.parentCompanyId || '',
      queryYear: currentYearFilter.value || '',
      cleanedTrialStages: stageFilter.value || '',
      cleanedDrugType: drugTypeFilter.value || '',
      pageNum: pageNum.value,
      pageSize
    }

    try {
      const res = await getClinicalTrialDevelopmentRank(params)
      if (res.data) {
        if (refresh) {
          list.value = res.data.list || []
        } else {
          list.value = [...list.value, ...(res.data.list || [])]
        }
        total.value = res.data.total || 0
      }
    } catch (e) {
      console.error('获取药企临床试验榜单失败', e)
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

  // 跳转客户（企业）详情页
  function onRowClick(item: ClinicalTrialDevelopmentRankVo) {
    if (!item.parentCompanyId) return
    uni.navigateTo({
      url: `/pages/customer/company-detail?companyId=${item.parentCompanyId}&companyName=${encodeURIComponent(item.parentCompanyName || '')}`
    })
  }
  // #endregion

  // 筛选变化时自动重新请求列表数据
  watch(currentYearFilter, () => {
    fetchList(true)
  })
  watch(stageFilter, () => {
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
    padding: 0 30rpx 30rpx 30rpx;
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

      .clear-icon {
        flex-shrink: 0;
        padding-left: 10rpx;
        font-size: 32rpx;
        line-height: 1;
        color: #cccccc;
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

    &:nth-child(2) {
      :deep(.uni-select) {
        .uni-select__selector {
          width: max-content;
        }
      }
    }
  }

  // #region 表格
  .rank-scroll-wrapper {
    border-radius: 20px;
    overflow: hidden;

    // 卡片撑满容器，表头固定，仅表格内容滚动
    .list-card {
      height: 100%;
      margin-bottom: 0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    .container-scroll-view {
      flex: 1;
      min-height: 0;
    }
  }

  .card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  }

  .list-card {
    .table-header {
      display: flex;
      padding: 22rpx 0;
      border-bottom: 2rpx solid #f8f8f8;
      font-weight: 400;
      font-size: 24rpx;
      color: #9199ae;
      line-height: 52rpx;
      background: #f7f9ff;
    }

    .table-row {
      display: flex;
      padding: 22rpx 0;
      border-bottom: 2rpx solid #f8f8f8;
      font-weight: 400;
      font-size: 24rpx;
      color: #293959;
      line-height: 52rpx;

      &:last-child {
        border-bottom: none;
      }

      // 点击反馈
      &.row-hover {
        background-color: #f2f7fc;
      }
    }

    .col-rank {
      width: 120rpx;
      text-align: center;
    }

    .col-name {
      flex: 1;
      text-align: center;
      word-break: break-all;
      &.highlight {
        color: #499ae6;
      }
    }

    .col-count {
      width: 240rpx;
      text-align: center;
      word-break: break-all;
    }

    // #region 加载状态
    .load-status {
      padding: 40rpx 0;
      text-align: center;

      text {
        font-size: 24rpx;
        color: #999;
      }
    }
    // #endregion
  }
  // #endregion
</style>
