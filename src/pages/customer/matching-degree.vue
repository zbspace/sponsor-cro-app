<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">匹配度</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <!-- 搜索栏 -->
  <view class="search-section">
    <view class="search-input-section">
      <view class="input-wrapper">
        <icon type="search" size="18" color="#CCCCCC" class="search-icon" />
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="输入查找目标客户"
          placeholder-style="color: #CCCCCC"
          @input="onSearchInput"
        />
        <view class="arrow-down-icon"></view>
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
              :key="item.parentCompanyId"
              @click="selectCompany(item)"
            >
              <text class="dropdown-name">{{ item.parentCompanyShortName }}</text>
            </view>
          </scroll-view>
          <view class="dropdown-empty" v-if="searchResults.length === 0">
            <text>未找到相关公司</text>
          </view>
        </template>
      </view>
    </view>
  </view>

  <!-- 内容卡片 -->
  <scroll-view
    scroll-y
    class="container-scroll-view"
    :show-scrollbar="false"
    :style="{
      maxHeight: `calc(100vh - 130px - ${menu.top}px - ${menu.height}px)`,
      marginTop: `${menu.top + menu.height + 88}rpx`
    }"
    @scrolltolower="onScrollToLower"
  >
    <view class="list-container">
      <view
        class="company-card"
        v-for="item in list"
        :key="item.parentCompanyId"
        @click="goToDetail(item)"
      >
        <view class="card-header">
          <view class="company-info">
            <view class="company-logo">{{ item.shortName[0] }}</view>
            <text class="company-name">{{ item.name }}</text>
          </view>
          <view class="match-score">
            <text class="label">匹配分数：</text>
            <text class="value">{{ item.score }}</text>
          </view>
        </view>

        <view class="match-details">
          <view class="detail-item">
            <view class="status-icon" :class="{ success: item.indicationMatch }">
              <icon
                :type="item.indicationMatch ? 'success' : 'clear'"
                size="14"
                :color="item.indicationMatch ? '#52C41A' : '#F5222D'"
              />
            </view>
            <text class="detail-label">适应症匹配记录</text>
            <text class="detail-count">{{ item.indicationCount }}</text>
          </view>
          <view class="detail-item">
            <view class="status-icon" :class="{ success: item.drugMatch }">
              <icon
                :type="item.drugMatch ? 'success' : 'clear'"
                size="14"
                :color="item.drugMatch ? '#52C41A' : '#F5222D'"
              />
            </view>
            <text class="detail-label">药品匹配记录</text>
            <text class="detail-count">{{ item.drugCount }}</text>
          </view>
          <view class="detail-item">
            <view class="status-icon" :class="{ success: item.leadMatch }">
              <icon
                :type="item.leadMatch ? 'success' : 'clear'"
                size="14"
                :color="item.leadMatch ? '#52C41A' : '#F5222D'"
              />
            </view>
            <text class="detail-label">商机线索匹配记录</text>
            <text class="detail-count">{{ item.leadCount }}</text>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-status" v-if="list.length > 0 && (listLoading || noMore)">
        <text>{{ listLoading ? '加载中...' : '没有更多了' }}</text>
      </view>
    </view>
  </scroll-view>

  <phone-bind-popup />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import { getParentShortNameList, getMatchingScoreList } from '@/api'
  import type { ParentCompanyItem } from '@/types/api'

  // #endregion

  // #region 状态
  const searchKeyword = ref('')

  interface MatchingItem {
    parentCompanyId: number
    name: string
    shortName: string
    score: number
    indicationMatch: boolean
    indicationCount: number
    drugMatch: boolean
    drugCount: number
    leadMatch: boolean
    leadCount: number
  }

  const list = ref<MatchingItem[]>([])
  const pageNum = ref(1)
  const pageSize = 20
  const listLoading = ref(false)
  const noMore = ref(false)
  // 请求序号，用于丢弃过期响应
  let requestId = 0

  // 搜索条件（来自找客户弹窗，仅用于查询，不回填搜索框）
  const queryParams = {
    indication: '',
    productName: ''
  }

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })
  // #endregion

  // #region 生命周期
  onLoad((options) => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    queryParams.indication = options?.indication ? decodeURIComponent(options.indication) : ''
    queryParams.productName = options?.drugName ? decodeURIComponent(options.drugName) : ''

    fetchMatchingList(true)
  })
  // #endregion

  // #region 方法
  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  function goToDetail(item: MatchingItem) {
    uni.navigateTo({
      url: `/pages/customer/company-detail?companyName=${encodeURIComponent(item.name)}&parentCompanyId=${item.parentCompanyId}`
    })
  }

  // 获取匹配度列表，isRefresh 为 true 时重新从第一页加载
  async function fetchMatchingList(isRefresh = false) {
    if (!isRefresh) {
      if (listLoading.value || noMore.value) return
    } else {
      pageNum.value = 1
      noMore.value = false
      list.value = []
    }

    const currentRequestId = ++requestId
    listLoading.value = true
    try {
      const res = await getMatchingScoreList({
        indication: queryParams.indication || undefined,
        productName: queryParams.productName || undefined,
        parentCompanyId: selectedCompany.value?.parentCompanyId,
        pageNum: pageNum.value,
        pageSize
      })
      // 已有更新的请求，忽略本次结果
      if (currentRequestId !== requestId) return

      const newList = (res.data?.list || []).map((item) => ({
        parentCompanyId: item.parentCompanyId,
        name: item.parentCompanyName,
        shortName: (item.parentCompanyName || '').charAt(0),
        score: item.matchingScore,
        indicationMatch: item.matchingIndicationCnt > 0,
        indicationCount: item.matchingIndicationCnt,
        drugMatch: item.matchingDrugCnt > 0,
        drugCount: item.matchingDrugCnt,
        leadMatch: item.matchingBusinessClueCnt > 0,
        leadCount: item.matchingBusinessClueCnt
      }))
      list.value = [...list.value, ...newList]

      if (newList.length < pageSize) {
        noMore.value = true
      } else {
        pageNum.value++
      }
    } catch {
      if (currentRequestId === requestId) noMore.value = true
    } finally {
      if (currentRequestId === requestId) listLoading.value = false
    }
  }

  // 滚动到底部加载下一页
  function onScrollToLower() {
    fetchMatchingList()
  }
  // #endregion

  // #region 下拉联想
  const selectedCompany = ref<ParentCompanyItem | null>(null)
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  const searchResults = ref<ParentCompanyItem[]>([])
  const showDropdown = ref(false)
  const searchLoading = ref(false)

  function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer)
    // 选中值发生变化时重新查询匹配列表
    const hadSelected = selectedCompany.value !== null
    selectedCompany.value = null // 输入时重置已选公司
    if (hadSelected) fetchMatchingList(true)

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
      const res = await getParentShortNameList({
        companyType: 'sponsor',
        pageNum: 1,
        pageSize: 20,
        shortName: keyword
      })
      searchResults.value = res.data?.list || []
    } catch {
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  // 下拉列表高度：单行约 88rpx，最多展示约 400rpx，超出可上下滚动
  const DROPDOWN_ITEM_HEIGHT = 88
  const DROPDOWN_MAX_HEIGHT = 400
  const dropdownListStyle = computed(() => {
    const count = searchResults.value.length
    const height = Math.min(count * DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT)
    return { height: `${height}rpx` }
  })

  function selectCompany(item: ParentCompanyItem) {
    searchKeyword.value = item.parentCompanyShortName
    selectedCompany.value = item
    showDropdown.value = false
    // 选中值发生变化时重新查询匹配列表
    fetchMatchingList(true)
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .search-section {
    position: fixed;
    left: 30rpx;
    right: 30rpx;
    z-index: 90;
    margin-top: 50rpx;
  }

  .list-container {
    padding: 0 30rpx 30rpx;
  }

  .loading-status {
    text-align: center;
    padding: 30rpx 0;
    font-size: 24rpx;
    color: #999999;
  }

  .company-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30rpx;

      .company-info {
        display: flex;
        align-items: center;
        gap: 20rpx;

        .company-logo {
          width: 64rpx;
          height: 64rpx;
          background: #499ae6;
          border-radius: 50%;
          color: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 32rpx;
          font-weight: bold;
        }

        .company-name {
          font-size: 32rpx;
          color: #333;
          font-weight: bold;
        }
      }

      .match-score {
        font-size: 24rpx;
        .label {
          color: #499ae6;
        }
        .value {
          color: #499ae6;
          font-weight: bold;
        }
      }
    }

    .match-details {
      background: #f7f8fa;
      border-radius: 20rpx;
      padding: 20rpx 30rpx;

      .detail-item {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;
        &:last-child {
          margin-bottom: 0;
        }

        .status-icon {
          margin-right: 16rpx;
          display: flex;
          align-items: center;
        }

        .detail-label {
          flex: 1;
          font-size: 26rpx;
          color: #666;
        }

        .detail-count {
          font-size: 26rpx;
          color: #333;
          width: 60rpx;
          text-align: right;
        }
      }
    }
  }

  .search-input-section {
    position: relative;
    margin-bottom: 60rpx;

    .arrow-down-icon {
      width: 0;
      height: 0;
      border-left: 10rpx solid transparent;
      border-right: 10rpx solid transparent;
      border-top: 12rpx solid #cccccc;
      margin-left: 16rpx;
    }

    .search-icon {
      margin-right: 16rpx;
    }

    .input-wrapper {
      background: #fff;
      border-radius: 16rpx;
      height: 88rpx;
      padding: 0 30rpx;
      display: flex;
      align-items: center;

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
</style>
