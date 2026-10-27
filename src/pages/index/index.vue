<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view
      class="vip-btn-wrapper"
      v-if="userInfo?.vipCode === VIP_CODE.普通"
      @click="handleApplyTrialClick"
    >
      <text>申请试用</text>
      <view class="arrow-right-icon" style="border-color: #fff"></view>
    </view>
    <view class="vip-btn-wrapper" v-if="userInfo?.vipCode === VIP_CODE.VIP试用">
      <text>试用中</text>
    </view>
    <view
      class="vip-badge"
      v-if="userInfo?.vipCode === VIP_CODE.VIP用户"
      @click="goTo('vip/index')"
    >
      <image class="vip-badge-icon" src="/static/vip-icon.svg" mode="aspectFit" />
      <text>尊享会员</text>
    </view>
  </view>

  <image class="bg-img" src="../../static/home/head-bg.png" mode="aspectFit" />

  <scroll-view
    scroll-y
    class="container-scroll-view"
    :show-scrollbar="false"
    enhanced
    :style="{
      height: `calc(100vh - ${menu.top}px - ${menu.height}px)`
    }"
  >
    <view class="container" style="padding-bottom: calc(120rpx + env(safe-area-inset-bottom))">
      <!-- 标题 -->
      <view class="title-section">
        <text class="main-title">药研查-商务版</text>
        <text class="sub-title">明熟客情 稳妥商机</text>
      </view>

      <!-- 搜索栏 -->
      <view class="search-section">
        <view class="search-box">
          <view class="search-type" :class="{ open: typeMenuOpen }" @click="toggleTypeMenu">
            <text class="search-type-label">{{ HOME_SEARCH_META[searchType].label }}</text>
            <view class="st-chev"></view>
            <view class="st-menu" v-if="typeMenuOpen" @click.stop>
              <view
                v-for="item in SEARCH_TYPE_OPTIONS"
                :key="item.value"
                class="st-opt"
                :class="{ active: searchType === item.value }"
                @click.stop="selectSearchType(item.value)"
              >
                <text>{{ item.label }}</text>
                <view class="st-check" v-if="searchType === item.value"></view>
              </view>
            </view>
          </view>
          <input
            class="search-input"
            type="text"
            v-model="searchKeyword"
            :placeholder="HOME_SEARCH_META[searchType].placeholder"
            placeholder-style="color: #B2B2B2"
            @input="onSearchInput"
            @focus="typeMenuOpen = false"
          />
          <view class="search-go" @click="handleHomeSearch">
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
                :key="item.parentCompanyId"
                @click="selectCompany(item)"
              >
                <text class="dropdown-name">{{ item.parentCompanyShortName }}</text>
              </view>
            </scroll-view>
            <view class="dropdown-empty" v-if="searchResults.length === 0">
              <text>未找到相关结果</text>
            </view>
          </template>
        </view>
      </view>

      <!-- 内容 -->
      <!-- #region 功能网格 -->
      <view class="feature-grid">
        <view
          class="grid-item"
          v-for="(item, index) in gridItems"
          :key="index"
          @click="handleGridClick(item)"
        >
          <view class="item-content">
            <text class="item-title">{{ item.title }}</text>
            <view class="item-desc">
              <text>{{ item.desc }}</text>
              <view class="arrow-right-icon-white"></view>
            </view>
          </view>
          <image class="item-icon" :src="item.icon" mode="aspectFit" />
        </view>
      </view>
      <!-- #endregion -->

      <!-- #region 数据榜单 -->
      <view class="rank-section">
        <view class="section-header">
          <view class="header-line"></view>
          <text class="header-title">数据榜单</text>
        </view>
        <view class="rank-list">
          <view
            class="rank-item"
            v-for="(item, index) in rankLists"
            :key="index"
            @click="goTo(item.path)"
          >
            <view class="rank-icon-wrapper">
              <image class="rank-icon" :src="item.iconUrl" mode="aspectFit" />
            </view>
            <text class="rank-title">{{ item.title }}</text>
            <view class="arrow-right-icon"></view>
          </view>
        </view>
      </view>
      <!-- #endregion -->

      <!-- 底部助手标语 -->
      <view class="bd-assistant-section">
        <text class="bd-slogan">- 助力BD拿单 -</text>
      </view>
    </view>
  </scroll-view>

  <image
    class="collect-icon"
    src="../../static/icons/收藏.png"
    mode="aspectFit"
    @click="goTo('collect/index')"
  />

  <!-- #region 免费领VIP -->
  <view class="free-vip-banner-container">
    <free-vip-banner
      v-if="userInfo?.vipCode === VIP_CODE.普通"
      :visible="showFreeVipBanner"
      @apply="handleBannerApply"
      @close="showFreeVipBanner = false"
      @success="fetchVipApplicationStatus"
    />
  </view>

  <!-- #endregion -->

  <!-- 手机号绑定弹窗 -->
  <phone-bind-popup />

  <!-- company & cro 弹窗 -->
  <search-company-cro-popup v-model:visible="showSearchPopup" />

  <!--company & lab 弹窗 -->
  <search-company-lab-popup v-model:visible="showCompanyLabPopup" />

  <!-- sponsor site pi 弹窗 -->
  <search-sponsor-site-pi-popup v-model:visible="showSponsorSitePiPopup" />

  <!-- 申请试用弹窗 -->
  <trial-apply-popup v-model:visible="showTrialPopup" @success="fetchVipApplicationStatus" />

  <!-- 找客户弹窗 -->
  <find-customer-popup v-model:visible="showFindPopup" />

  <!-- 查客户弹窗 -->
  <search-customer-popup v-model:visible="showCustomerCustomerPopup" />

  <!-- 查产品弹窗 -->
  <search-drug-popup v-model:visible="showDrugPopup" />

  <!-- 底部导航 -->
  <tab-bar active="home" />

  <!-- VIP过期弹窗 -->
  <vip-expired-popup v-model:visible="showVipExpiredPopup" @apply="showTrialPopup = true" />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import TabBar from '@/components/tab-bar/index.vue'
  import FreeVipBanner from '@/components/free-vip-banner/free-vip-banner.vue'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import TrialApplyPopup from '@/components/trial-apply-popup/trial-apply-popup.vue'
  import FindCustomerPopup from '@/components/find-customer-popup/find-customer-popup.vue'
  import SearchCompanyLabPopup from '@/components/search-company-lab-popup/search-company-lab-popup.vue'
  import SearchSponsorSitePiPopup from '@/components/search-sponsor-site-pi-popup/search-sponsor-site-pi-popup.vue'
  import SearchCustomerPopup from '@/components/search-customer-popup/search-customer-popup.vue'
  import VipExpiredPopup from '@/components/vip-expired-popup/vip-expired-popup.vue'
  import { VIP_CODE, VIP_APPLICATION_STATUS } from '@/utils/enums'
  import {
    getVipApplication,
    getUserInfo,
    getParentShortNameList,
    queryPharmaShortName
  } from '@/api'
  import type { UserInfo, ParentCompanyItem } from '@/types/api'
  // #endregion

  // #region 页面基础状态与生命周期
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  // 先用本地缓存渲染，登录完成后刷新为最新用户信息
  const userInfo = ref<UserInfo | null>(getUserInfo())

  onLoad(() => {
    // 未登录用户先进入登录页
    if (!getUserInfo()?.token) {
      uni.reLaunch({ url: '/pages/login/index' })
      return
    }

    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    // 登录统一由登录页处理，这里直接使用本地登录信息
    userInfo.value = getUserInfo()
    // 查询申请状态
    fetchVipApplicationStatus()
  })

  function goTo(path: string, query?: string) {
    const url = query ? `/pages/${path}?${query}` : `/pages/${path}`
    uni.navigateTo({ url })
  }
  // #endregion

  // #region 首页搜索
  type HomeSearchType = 'co' | 'cro' | 'lab'

  const HOME_SEARCH_META: Record<HomeSearchType, { label: string; placeholder: string }> = {
    co: { label: '查客户', placeholder: '请输入企业简称' },
    cro: { label: '查CRO', placeholder: '请输入CRO名称' },
    lab: { label: '查LAB', placeholder: '请输入实验室名称' }
  }

  const SEARCH_TYPE_OPTIONS: { value: HomeSearchType; label: string }[] = [
    { value: 'co', label: '查客户' },
    { value: 'cro', label: '查CRO' },
    { value: 'lab', label: '查LAB' }
  ]

  const searchType = ref<HomeSearchType>('co')
  const searchKeyword = ref('')
  const searchResults = ref<ParentCompanyItem[]>([])
  const showDropdown = ref(false)
  const searchLoading = ref(false)
  const typeMenuOpen = ref(false)
  const selectedCompany = ref<ParentCompanyItem | null>(null)
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  // 下拉列表高度：单行约 88rpx，最多展示约 400rpx，超出可上下滚动
  const DROPDOWN_ITEM_HEIGHT = 88
  const DROPDOWN_MAX_HEIGHT = 400
  const dropdownListStyle = computed(() => {
    const height = Math.min(searchResults.value.length * DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT)
    return { height: `${height}rpx` }
  })

  function toggleTypeMenu() {
    typeMenuOpen.value = !typeMenuOpen.value
    showDropdown.value = false
  }

  function selectSearchType(type: HomeSearchType) {
    typeMenuOpen.value = false
    if (searchType.value === type) return
    if (searchTimer) clearTimeout(searchTimer)
    searchTimer = null
    searchType.value = type
    searchKeyword.value = ''
    searchResults.value = []
    showDropdown.value = false
    selectedCompany.value = null
  }

  function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer)
    selectedCompany.value = null // 输入时重置已选

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

    const type = searchType.value
    searchLoading.value = true
    showDropdown.value = true

    try {
      if (type === 'co') {
        const res = await queryPharmaShortName({ pageNum: 1, pageSize: 20, searchKey: keyword })
        searchResults.value = res.data?.list || []
      } else {
        const res = await getParentShortNameList({
          companyType: type === 'cro' ? 'cro' : 'thirdLab',
          pageNum: 1,
          pageSize: 20,
          shortName: keyword
        })
        searchResults.value = res.data?.list || []
      }
    } catch {
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  function selectCompany(item: ParentCompanyItem) {
    searchKeyword.value = item.parentCompanyShortName
    selectedCompany.value = item
    showDropdown.value = false
  }

  function handleHomeSearch() {
    if (!checkPermission()) return

    typeMenuOpen.value = false
    const keyword = searchKeyword.value.trim()
    const company = selectedCompany.value
    const id = company ? company.parentCompanyId : ''
    const name = company ? company.parentCompanyShortName : keyword

    if (!name) {
      uni.showToast({ title: '请输入查询关键词', icon: 'none' })
      return
    }

    if (searchType.value === 'co') {
      if (!company) {
        uni.showToast({ title: '请输入并选择企业', icon: 'none' })
        return
      }
      uni.navigateTo({
        url: `/pages/customer/company-detail?companyId=${id}&companyName=${encodeURIComponent(name)}`
      })
    } else if (searchType.value === 'cro') {
      uni.navigateTo({
        url: `/pages/cro-stat/index?partnerParentCompanyId=${id}&parentCompanyShortName=${encodeURIComponent(name)}`
      })
    } else {
      uni.navigateTo({
        url: `/pages/lab-stat/index?partnerParentCompanyId=${id}&parentCompanyShortName=${encodeURIComponent(name)}`
      })
    }

    showDropdown.value = false
  }
  // #endregion

  // #region 功能网格与导航逻辑
  const gridItems = [
    {
      title: '查客户',
      desc: '立即前往',
      icon: '/static/home/1.png',
      path: 'customer/company-detail'
    },
    {
      title: '找客户',
      desc: '立即前往',
      icon: '/static/home/2.png',
      path: 'customer/company-detail'
    },
    {
      title: '查产品',
      desc: '立即前往',
      icon: '/static/home/3.png',
      path: 'drug-stat/index'
    },
    {
      title: '查药企&CRO\n合作关系',
      desc: '立即前往',
      icon: '/static/home/4.png',
      path: 'cro-stat/index',
      special: true
    },
    {
      title: '查药企&中心实\n验室合作关系',
      desc: '立即前往',
      icon: '/static/home/5.png',
      path: 'lab-stat/index'
    },
    {
      title: '查药企&医院/研\n究者合作关系',
      desc: '立即前往',
      icon: '/static/home/6.png',
      path: 'hospital-stat/index'
    }
  ]

  function handleGridClick(item: any) {
    if (!checkPermission()) {
      return
    }

    if (item.title === '查药企&CRO\n合作关系') {
      showSearchPopup.value = true
    } else if (item.title === '找客户') {
      showFindPopup.value = true
    } else if (item.title === '查药企&中心实\n验室合作关系') {
      showCompanyLabPopup.value = true
    } else if (item.title === '查药企&医院/研\n究者合作关系') {
      showSponsorSitePiPopup.value = true
    } else if (item.title === '查客户') {
      showCustomerCustomerPopup.value = true
    } else if (item.title === '查产品') {
      showDrugPopup.value = true
    } else if (item.path) {
      goTo(item.path)
    } else {
      uni.showToast({ title: '该功能暂未开启', icon: 'none' })
    }
  }

  // 数据榜单数据
  const rankLists = [
    {
      title: '中国临床CRO公司榜单',
      icon: 'CRO',
      iconUrl: '/static/home/11.png',
      path: 'cro-rank/index'
    },
    {
      title: '中国附条件获批上市药品清单',
      icon: 'med',
      iconUrl: '/static/home/12.png',
      path: 'conditional-drug-list/index'
    },
    {
      title: '中国1类新药获批上市清单',
      icon: 'doc',
      iconUrl: '/static/home/13.png',
      path: 'medicine-rank/new-drug'
    },
    {
      title: '中国药企临床试验榜单',
      icon: 'building',
      iconUrl: '/static/home/14.png',
      path: 'sponsor-rank/index'
    }
  ]
  // #endregion

  // #region VIP 状态与权限控制
  const applicationStatus = ref(0)
  const applicationInfo = ref<{
    haveFirstApplication: boolean
    havePendingApplication: boolean
  }>({
    haveFirstApplication: true,
    havePendingApplication: false
  })
  const showFreeVipBanner = ref(false)
  const showVipExpiredPopup = ref(false)

  async function fetchVipApplicationStatus() {
    try {
      const res = await getVipApplication()
      if (res.data) {
        applicationStatus.value = res.data.approvalStatus || 0
        applicationInfo.value.haveFirstApplication = res.data.haveFirstApplication ?? true
        applicationInfo.value.havePendingApplication = res.data.havePendingApplication ?? false
        showFreeVipBanner.value = !applicationInfo.value.haveFirstApplication
      }
    } catch {
      applicationStatus.value = 0
      showFreeVipBanner.value = false
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
        title: '您的申请正在审核中，请稍后再试，或者直接联系我们',
        icon: 'none',
        duration: 3000
      })
      return false
    }
    return true
  }

  function handleApplyTrialClick() {
    if (applicationStatus.value === VIP_APPLICATION_STATUS.待审批) {
      uni.showToast({ title: '您已提交试用申请，等待电话联系', icon: 'none' })
      return
    }
    showTrialPopup.value = true
  }

  function handleBannerApply() {
    if (applicationStatus.value === VIP_APPLICATION_STATUS.待审批) {
      uni.showToast({ title: '您已提交试用申请，等待电话联系', icon: 'none' })
      return
    }
  }
  // #endregion

  // #region 弹窗状态管理
  const showSearchPopup = ref(false)
  const showTrialPopup = ref(false)
  const showFindPopup = ref(false)
  const showCompanyLabPopup = ref(false)
  const showSponsorSitePiPopup = ref(false)
  const showCustomerCustomerPopup = ref(false)
  const showDrugPopup = ref(false)
  // #endregion
</script>

<style lang="scss" scoped>
  /* #region 标题 */
  .title-section {
    text-align: center;
    margin-bottom: 40rpx;

    .main-title {
      font-weight: 400;
      font-size: 44rpx;
      color: #293959;
      line-height: 96rpx;
      margin-bottom: 18rpx;
    }

    .sub-title {
      font-weight: 400;
      font-size: 28rpx;
      color: #9199ae;
      line-height: 52rpx;
      margin-bottom: 40rpx;
      display: block;
    }
  }
  /* #endregion */

  /* #region 首页搜索 */
  .search-section {
    position: relative;
    z-index: 30;
    margin-bottom: 30rpx;

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      height: 84rpx;
      padding: 0 8rpx 0 12rpx;
      background: #ffffff;
      border-radius: 44rpx;
      box-shadow: 0 8rpx 28rpx rgba(61, 123, 224, 0.12);
    }

    .search-type {
      position: relative;
      display: flex;
      align-items: center;
      height: 64rpx;
      padding: 0 16rpx;
      flex-shrink: 0;
      border-right: 2rpx solid #eef0f4;

      .search-type-label {
        font-size: 26rpx;
        font-weight: 500;
        color: #293959;
        white-space: nowrap;
      }

      .st-chev {
        width: 10rpx;
        height: 10rpx;
        margin-left: 8rpx;
        margin-top: -6rpx;
        border-right: 3rpx solid #9199ae;
        border-bottom: 3rpx solid #9199ae;
        transform: rotate(45deg);
        transition: transform 0.2s ease;
      }

      &.open .st-chev {
        margin-top: 4rpx;
        transform: rotate(-135deg);
      }

      .st-menu {
        position: absolute;
        top: 78rpx;
        left: -8rpx;
        width: 264rpx;
        padding: 12rpx;
        background: #ffffff;
        border-radius: 24rpx;
        box-shadow:
          0 24rpx 60rpx rgba(10, 37, 64, 0.18),
          0 4rpx 16rpx rgba(10, 37, 64, 0.08);
        z-index: 300;

        .st-opt {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18rpx 20rpx;
          border-radius: 16rpx;
          font-size: 26rpx;
          color: #293959;

          &:active {
            background: #f2f6fc;
          }

          &.active {
            font-weight: 600;
            color: #3d7bff;
            background: #edf4ff;
          }

          .st-check {
            width: 20rpx;
            height: 10rpx;
            border-left: 4rpx solid #3d7bff;
            border-bottom: 4rpx solid #3d7bff;
            transform: rotate(-45deg);
          }
        }
      }
    }

    .search-input {
      flex: 1;
      min-width: 0;
      height: 84rpx;
      padding: 0 20rpx;
      font-size: 28rpx;
      color: #293959;
    }

    .search-go {
      width: 116rpx;
      height: 68rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
      background: #3d7bff;
      border-radius: 36rpx;

      text {
        color: #ffffff;
        font-size: 26rpx;
        font-weight: 600;
      }

      &:active {
        background: #1553ee;
      }
    }

    .search-dropdown {
      position: absolute;
      top: 92rpx;
      left: 0;
      right: 0;
      padding: 8rpx 0;
      background: #ffffff;
      border-radius: 24rpx;
      box-shadow:
        0 24rpx 60rpx rgba(10, 37, 64, 0.18),
        0 4rpx 16rpx rgba(10, 37, 64, 0.08);
      z-index: 290;

      .dropdown-loading,
      .dropdown-empty {
        padding: 24rpx;
        font-size: 26rpx;
        color: #9199ae;
        text-align: center;
      }

      .dropdown-item {
        padding: 22rpx 26rpx;
        font-size: 28rpx;
        color: #293959;

        &:active {
          background: #f7f8fa;
        }
      }
    }
  }
  /* #endregion */

  /* #region 底部助手 */
  .bd-assistant-section {
    text-align: center;
    margin-bottom: 40rpx;
    .bd-slogan {
      display: block;
      font-size: 24rpx;
      color: #cccccc;
    }
  }
  /* #endregion */

  /* #region 功能网格 */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30rpx;
    margin-bottom: 30rpx;

    .grid-item {
      position: relative;
      width: 210rpx;
      height: 142rpx;
      padding: 20rpx;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .item-content {
        position: relative;
        z-index: 2;

        .item-title {
          display: block;
          font-size: 24rpx;
          color: #ffffff;
          font-weight: 400;
          margin-bottom: 10rpx;
        }

        .item-desc {
          display: flex;
          font-size: 16rpx;
          color: #ffffff;
          align-items: center;
          opacity: 0.8;
          .arrow-right-icon-white {
            width: 10rpx;
            height: 10rpx;
            margin-left: 8rpx;
          }
        }
      }

      .item-icon {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        z-index: 1;
      }
    }
  }
  /* #endregion */

  /* #region 数据榜单 */
  .rank-section {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx 30rpx 0 30rpx;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    margin-bottom: 68rpx;

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;

      .header-line {
        width: 4px;
        height: 16px;
        background: #499ae6;
        border-radius: 2px;
        margin-right: 8px;
      }

      .header-title {
        font-size: 16px;
        font-weight: bold;
        color: #333333;
      }
    }

    .rank-list {
      .rank-item {
        display: flex;
        align-items: center;
        padding: 14px 0;
        border-bottom: 1px solid #f5f5f5;

        &:last-child {
          border-bottom: none;
        }

        .rank-icon-wrapper {
          width: 32px;
          height: 32px;
          margin-right: 12px;
          display: flex;
          justify-content: center;
          align-items: center;

          .cro-icon {
            width: 32px;
            height: 32px;
            background: #eef6ff;
            color: #499ae6;
            font-size: 10px;
            font-weight: bold;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .rank-icon {
            width: 32px;
            height: 32px;
          }
        }

        .rank-title {
          flex: 1;
          font-size: 15px;
          color: #333333;
        }

        .arrow-right {
          width: 8px;
          height: 8px;
          border-top: 2px solid #cccccc;
          border-right: 2px solid #cccccc;
          transform: rotate(45deg);
        }
      }
    }
  }
  /* #endregion */

  .collect-icon {
    position: absolute;
    z-index: 10;
    width: 82rpx;
    height: 82rpx;
    right: 30rpx;
    bottom: 180rpx;
  }
  /* #endregion */

  .free-vip-banner-container {
    position: fixed;
    bottom: 100rpx;
    left: 0;
    right: 0;
  }
</style>
