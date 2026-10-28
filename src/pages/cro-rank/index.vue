<template>
  <!-- 顶部背景与导航 -->
  <view class="header-bg" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-bar" :style="{ height: `${menu.height}px` }">
      <view class="back-btn" @click="goBack">
        <view class="back-icon"></view>
      </view>
    </view>
  </view>

  <image class="bg-img" src="../../static/header-bg-rank.png" mode="aspectFit" />

  <view class="content-body">
    <!-- 公司选择 -->
    <view class="filter-card">
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
    </view>

    <!-- 年份选择 -->
    <view class="filter-card">
      <uni-data-select
        v-model="selectedYear"
        :localdata="yearOptions"
        :clear="false"
        placeholder="选择年份"
      />
    </view>

    <!-- 榜单表格 -->
    <view class="rank-table-card">
      <view class="table-header">
        <text class="col-rank">排序</text>
        <text class="col-name">CRO公司</text>
        <text class="col-exp">项目经验</text>
        <text class="col-pharma">合作药企</text>
      </view>

      <scroll-view
        scroll-y
        class="scroll-view"
        @scrolltolower="onScrollToLower"
        :show-scrollbar="false"
        :style="{
          height: `calc(100vh - ${menu.top}px - ${menu.height}px - 390px)`
        }"
      >
        <view
          class="table-row"
          v-for="(item, index) in rankList"
          :key="index"
          :class="{ zebra: index % 2 === 1 }"
          hover-class="row-hover"
          @click="onRowClick(item)"
        >
          <text class="col-rank">{{ index + 1 }}</text>
          <text class="col-name highlight">{{ item.name }}</text>
          <text class="col-exp">{{ item.experience }}</text>
          <text class="col-pharma">{{ item.partners }}</text>
        </view>

        <view class="loading-status" v-if="loading || noMore">
          <text>{{ loading ? '加载中...' : '没有更多了' }}</text>
        </view>
        <view class="empty-tip" v-if="rankList.length === 0 && !loading">暂无数据</view>
      </scroll-view>
    </view>
  </view>

  <!-- 底部按钮 -->
  <view class="footer">
    <button class="share-btn" open-type="share">分享</button>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, watch, computed } from 'vue'
  import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
  import {
    selectClinicalCroRankList,
    getUserInfo,
    queryStandardCompany,
    getVipApplication
  } from '@/api'
  import type { OpportunityVo, OpportunityParam, StandardCompanyItem } from '@/types/api'
  // #endregion

  // #region 页面基础状态与生命周期
  const menu = ref({ top: 44, height: 32 })
  const applicationStatus = ref(0)
  const applicationInfo = ref<{
    haveFirstApplication: boolean
    havePendingApplication: boolean
  }>({
    haveFirstApplication: true,
    havePendingApplication: false
  })
  const showVipExpiredPopup = ref(false)

  const goBack = () => {
    uni.navigateBack()
  }

  onLoad(() => {
    // #ifdef MP-WEIXIN
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    // #endif
    fetchRankData(true)
    fetchVipApplicationStatus()
  })

  onShareAppMessage(() => {
    return {
      title: '中国临床CRO榜单 - 临床研究一站式查询',
      path: '/pages/cro-rank/index',
      imageUrl: '/static/icons/header-bg.png'
    }
  })

  async function fetchVipApplicationStatus() {
    try {
      const res = await getVipApplication()
      if (res.data) {
        applicationStatus.value = res.data.approvalStatus || 0
        applicationInfo.value.haveFirstApplication = res.data.haveFirstApplication ?? true
        applicationInfo.value.havePendingApplication = res.data.havePendingApplication ?? false
      }
    } catch {
      // 静默处理
    }
  }

  function checkPermission() {
    const userInfo = getUserInfo()
    const vipCode = userInfo?.vipCode ?? 0

    if (
      applicationInfo.value.haveFirstApplication &&
      !applicationInfo.value.havePendingApplication &&
      vipCode === 0
    ) {
      showVipExpiredPopup.value = true
      return false
    }
    if (
      applicationInfo.value.haveFirstApplication &&
      applicationInfo.value.havePendingApplication &&
      vipCode === 0
    ) {
      uni.showToast({
        title: '您已经提交申请，请您耐心等待',
        icon: 'none',
        duration: 3000
      })
      return false
    }
    return true
  }
  // #endregion

  // #region 榜单数据加载
  const rankList = ref<{ name: string; experience: number; partners: number }[]>([])
  const loading = ref(false)
  const noMore = ref(false)
  const page = ref(1)
  const pageSize = 10
  const selectedYear = ref('')

  const yearOptions = (() => {
    const currentYear = new Date().getFullYear()
    const options = [{ value: '', text: '全部历史' }]
    for (let y = currentYear; y >= 2016; y--) {
      options.push({ value: String(y), text: `${y}年度` })
    }
    return options
  })()

  const fetchRankData = async (reset = false) => {
    if (loading.value) return
    if (!reset && noMore.value) return

    if (reset) {
      page.value = 1
      rankList.value = []
      noMore.value = false
    }

    loading.value = true

    try {
      const res = await selectClinicalCroRankList({
        pageNum: page.value,
        pageSize,
        lastYear: selectedYear.value,
        croParentCompanyId: selectedCompany.value?.standardId
      })
      if (res.data?.list) {
        const mapped = res.data.list.map((item) => ({
          name: item.parentCompanyShortName,
          experience: item.projectExperienceNum,
          partners: item.cooperationEnterpriseNum,
          parentCompanyId: item.parentCompanyId
        }))

        if (reset) {
          rankList.value = mapped
        } else {
          rankList.value = [...rankList.value, ...mapped]
        }

        if (page.value >= res.data.pages) {
          noMore.value = true
        }
      }
    } catch {
      // 静默处理
    } finally {
      loading.value = false
      page.value++
    }
  }

  const onScrollToLower = () => {
    fetchRankData()
  }

  const onRowClick = (item: any) => {
    if (!item.parentCompanyId) return
    uni.navigateTo({
      url: `/pages/cro-stat/index?partnerParentCompanyId=${item.parentCompanyId}&parentCompanyShortName=${encodeURIComponent(item.name)}`
    })
  }

  watch(selectedYear, () => {
    fetchRankData(true)
  })
  // #endregion

  // #region 公司搜索逻辑
  const searchKeyword = ref('')
  const showDropdown = ref(false)
  const searchLoading = ref(false)
  const searchResults = ref<StandardCompanyItem[]>([])
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  const selectedCompany = ref<StandardCompanyItem | null>(null)

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
      // 清空企业搜索后恢复全量榜单
      fetchRankData(true)
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

  const selectCompany = (item: any) => {
    searchKeyword.value = item.companyStandardName
    selectedCompany.value = item
    showDropdown.value = false
    fetchRankData(true)
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .header-bg {
    padding-top: 400rpx;
    position: relative;
    overflow: hidden;

    .nav-bar {
      padding-left: 30rpx;
      display: flex;
      align-items: center;

      .back-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;

        .back-icon {
          width: 20rpx;
          height: 20rpx;
          border-left: 4rpx solid #333;
          border-bottom: 4rpx solid #333;
          transform: rotate(45deg);
        }
      }
    }

    .header-content {
      padding: 40rpx 40rpx 20rpx;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: relative;
      z-index: 1;

      .title-section {
        flex: 1;
        .main-title {
          font-size: 44rpx;
          font-weight: bold;
          color: #003087;
          font-style: italic;
          display: block;
          margin-bottom: 16rpx;
        }
        .sub-title {
          font-size: 22rpx;
          color: #f38a8a;
          line-height: 1.4;
        }
      }
    }
  }

  .content-body {
    padding: 0 30rpx;
    margin-top: 216rpx;

    .filter-card {
      background: #ffffff;
      height: 90rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      padding: 0 25rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
      margin-bottom: 30rpx;

      :deep(.uni-select) {
        flex: 1;
        border: none;
        .uni-select__input-text {
          font-size: 28rpx;
          color: #adadad;
        }
        .uni-select__selector {
          .uni-select__selector-item {
            line-height: 40px;
          }
        }
      }
    }

    .rank-table-card {
      background: #ffffff;
      border-radius: 24rpx;
      padding: 20rpx;
      box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

      .table-header {
        display: flex;
        padding: 30rpx 0;
        border-bottom: 2rpx solid #f8f8f8;

        text {
          font-size: 26rpx;
          color: #666;
          text-align: center;
        }
      }

      .table-row {
        display: flex;
        padding: 30rpx 0;
        align-items: center;

        &.zebra {
          background-color: #fcfdfe;
        }

        // 点击反馈
        &.row-hover {
          background-color: #f2f7fc;
        }

        text {
          font-size: 28rpx;
          color: #333;
          text-align: center;
        }

        .highlight {
          color: #499ae6;
        }
      }

      .col-rank {
        width: 100rpx;
      }
      .col-name {
        flex: 2;
        text-align: left !important;
        padding-left: 20rpx;
      }
      .col-exp {
        flex: 1;
      }
      .col-pharma {
        flex: 1;
      }

      // #region 滚动列表样式
      .scroll-view {
        width: 100%;
      }

      .loading-status,
      .empty-tip {
        padding: 40rpx 0;
        text-align: center;
        text {
          font-size: 24rpx;
          color: #999;
        }
      }
      // #endregion
    }
  }

  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 30rpx 40rpx 60rpx;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #fff 40%);
    z-index: 10;

    .share-btn {
      width: 100%;
      background: #499ae6;
      color: #ffffff;
      height: 90rpx;
      border-radius: 45rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      box-shadow: 0 8rpx 20rpx rgba(73, 154, 230, 0.3);
      border: none;
      padding: 0;
      margin: 0;
      line-height: 90rpx;

      &::after {
        border: none;
      }
    }
  }

  .search-input-section {
    position: relative;
    margin: 40rpx 0;
    width: 100%;
    padding: 0 25rpx;

    .input-wrapper {
      background: #ffffff;
      border-radius: 44rpx;
      height: 88rpx;
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
</style>
