<!-- 全国临床CRO公司榜 -->
<template>
  <view class="cro-rank-page">
    <!-- #region 顶部导航 -->
    <view class="nav" :style="{ paddingTop: `${menu.top}px` }">
      <view class="nav-bar" :style="{ height: `${menu.height}px` }">
        <view class="nav-back" @click="goBack">
          <view class="back-arrow"></view>
        </view>
        <text class="nav-title">全国临床CRO公司榜</text>
      </view>
    </view>
    <!-- #endregion -->

    <view class="page-body">
      <!-- #region 顶部 Banner -->
      <view class="cb-banner">
        <view class="cb-deco cb-deco1"></view>
        <view class="cb-deco cb-deco2"></view>
        <!-- 领奖台装饰 -->
        <view class="cb-podium">
          <view class="podium-bar bar-left"></view>
          <view class="podium-bar bar-center"></view>
          <view class="podium-bar bar-right"></view>
        </view>
        <!-- 奖杯装饰 -->
        <view class="cb-cup">
          <view class="cup-handle handle-left"></view>
          <view class="cup-handle handle-right"></view>
          <view class="cup-body"></view>
          <view class="cup-stem"></view>
          <view class="cup-base"></view>
        </view>
        <view class="cb-banner-title">
          全国临床CRO公司
          <text class="gold">榜</text>
        </view>
      </view>
      <!-- #endregion -->

      <!-- #region 筛选区：年份 + 企业名称搜索 -->
      <view class="co-card filter-card">
        <view class="co-filter" @click="toggleYearDropdown">
          <text class="co-filter-label">年份</text>
          <view class="co-filter-div"></view>
          <text class="co-filter-val" :class="{ on: !!selectedYear }">
            {{ selectedYear || '全部' }}
          </text>
          <view class="co-filter-arrow"></view>
        </view>

        <!-- 年份下拉 -->
        <view class="cb-dropdown" v-if="showYearDropdown">
          <view
            class="cb-opt"
            v-for="opt in yearOptions"
            :key="opt.value"
            :class="{ active: opt.value === selectedYear }"
            @click.stop="selectYear(opt.value)"
          >
            {{ opt.text }}
          </view>
        </view>

        <!-- 企业名称搜索 -->
        <view class="cb-search">
          <view class="cb-search-icon"></view>
          <input
            class="cb-search-input"
            type="text"
            v-model="searchKeyword"
            placeholder="搜索企业名称"
            placeholder-style="color: #9CA3AF"
            confirm-type="search"
            @input="onSearchInput"
            @confirm="handleSearch"
          />
          <view class="cb-search-clear" v-if="searchKeyword" @click="clearSearchKeyword">
            <text>×</text>
          </view>
          <view class="cb-search-btn" @click="handleSearch">搜索</view>
        </view>

        <!-- 企业联想下拉 -->
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
                :key="item.parentCompanyId"
                @click="selectCompany(item)"
              >
                <text class="dropdown-name">{{ item.parentCompanyShortName }}</text>
              </view>
            </scroll-view>
            <view class="dropdown-empty" v-else>
              <text>未找到相关公司</text>
            </view>
          </template>
        </view>
      </view>
      <!-- #endregion -->

      <!-- #region 排序说明 -->
      <view class="cb-note">展示前100家 · 按项目数排序</view>
      <!-- #endregion -->

      <!-- #region 榜单表格 -->
      <view class="co-card cb-table">
        <view class="cb-thead">
          <text class="cb-th cb-c1">排名</text>
          <text class="cb-th cb-c2">公司名</text>
          <text class="cb-th cb-c3">项目数</text>
          <text class="cb-th cb-c4">合作企业数</text>
        </view>

        <view
          class="cb-tr"
          v-for="(item, index) in rankList"
          :key="item.parentCompanyId ?? index"
          hover-class="cb-tr-hover"
          @click="onRowClick(item)"
        >
          <text class="cb-td cb-c1 cb-td-idx" :class="{ 'cb-top': index < 3 }">
            {{ index + 1 }}
          </text>
          <text class="cb-td cb-c2 cb-td-name">{{ item.name }}</text>
          <text class="cb-td cb-c3 cb-td-num">{{ item.experience }}</text>
          <text class="cb-td cb-c4 cb-td-num">{{ item.partners }}</text>
        </view>

        <view class="cb-empty" v-if="loading">
          <text>加载中...</text>
        </view>
        <view class="cb-empty" v-else-if="rankList.length === 0">
          <text>暂无数据</text>
        </view>
      </view>
      <!-- #endregion -->

      <view class="foot-note">榜单按项目数排序 · 数据来源于公开登记信息</view>
    </view>

    <!-- #region 右下角浮动分享按钮 -->
    <view class="co-fab">
      <button class="fab-btn" open-type="share">
        <view class="fab-share-icon">
          <view class="fs-head"></view>
          <view class="fs-shaft"></view>
          <view class="fs-box"></view>
        </view>
      </button>
    </view>
    <!-- #endregion -->
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, watch, computed } from 'vue'
  import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
  import {
    selectClinicalCroRankList,
    getUserInfo,
    getParentShortNameList,
    refreshUserDetail
  } from '@/api'
  import type { ParentCompanyItem } from '@/types/api'
  import { APPLY_STATUS } from '@/utils/enums'
  // #endregion

  // #region 页面基础状态与生命周期
  const menu = ref({ top: 44, height: 32 })
  // 申请状态：0-未申请，1-申请试用中，2-试用中，3-申请开通中，4-开通中
  const applyStatus = ref<number>(APPLY_STATUS.未申请)
  const showVipExpiredPopup = ref(false)

  // 是否存在待处理的申请（申请试用中 / 申请开通中）
  const hasPendingApply = computed(
    () =>
      applyStatus.value === APPLY_STATUS.申请试用中 || applyStatus.value === APPLY_STATUS.申请开通中
  )

  const goBack = () => {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  onLoad(() => {
    // #ifdef MP-WEIXIN
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    // #endif
    fetchRankData()
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
    const detail = await refreshUserDetail()
    applyStatus.value = detail?.applyStatus ?? APPLY_STATUS.未申请
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
  // #endregion

  // #region 榜单数据加载
  interface RankItem {
    parentCompanyId: number
    name: string
    experience: number
    partners: number
  }

  // 榜单接口只展示前 100 家
  const LIST_LIMIT = 100
  const rankList = ref<RankItem[]>([])
  const loading = ref(false)

  async function fetchRankData() {
    loading.value = true
    try {
      const res = await selectClinicalCroRankList({
        pageNum: 1,
        pageSize: LIST_LIMIT,
        lastYear: selectedYear.value,
        croParentCompanyId: selectedCompany.value?.parentCompanyId
      })
      rankList.value = (res.data?.list || []).map((item) => ({
        parentCompanyId: item.parentCompanyId,
        name: item.parentCompanyShortName,
        experience: item.projectExperienceNum,
        partners: item.cooperationEnterpriseNum
      }))
    } catch {
      rankList.value = []
    } finally {
      loading.value = false
    }
  }

  const onRowClick = (item: RankItem) => {
    if (!item.parentCompanyId) return
    uni.navigateTo({
      url: `/pages/cro-stat/index?partnerParentCompanyId=${item.parentCompanyId}&parentCompanyShortName=${encodeURIComponent(item.name)}`
    })
  }
  // #endregion

  // #region 年份筛选
  const selectedYear = ref('')
  const showYearDropdown = ref(false)

  const yearOptions = (() => {
    const currentYear = new Date().getFullYear()
    const options = [{ value: '', text: '全部' }]
    for (let y = currentYear; y >= 2016; y--) {
      options.push({ value: String(y), text: String(y) })
    }
    return options
  })()

  function toggleYearDropdown() {
    showYearDropdown.value = !showYearDropdown.value
    if (showYearDropdown.value) showDropdown.value = false
  }

  function selectYear(value: string) {
    showYearDropdown.value = false
    if (selectedYear.value === value) return
    selectedYear.value = value
  }

  watch(selectedYear, () => {
    fetchRankData()
  })
  // #endregion

  // #region 公司搜索逻辑
  const searchKeyword = ref('')
  const showDropdown = ref(false)
  const searchLoading = ref(false)
  const searchResults = ref<ParentCompanyItem[]>([])
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  const selectedCompany = ref<ParentCompanyItem | null>(null)

  const DROPDOWN_ITEM_HEIGHT = 88
  const DROPDOWN_MAX_HEIGHT = 400
  const dropdownListStyle = computed(() => {
    const count = searchResults.value.length
    const height = Math.min(count * DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT)
    return { height: `${height}rpx` }
  })

  function onSearchInput() {
    if (!checkPermission()) return
    if (searchTimer) clearTimeout(searchTimer)
    selectedCompany.value = null

    const keyword = searchKeyword.value.trim()
    if (!keyword) {
      searchResults.value = []
      showDropdown.value = false
      // 清空企业搜索后恢复全量榜单
      fetchRankData()
      return
    }

    searchTimer = setTimeout(async () => {
      await fetchSearchResults()
      showDropdown.value = true
    }, 300)
  }

  /** 清空企业搜索并恢复全量榜单 */
  function clearSearchKeyword() {
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
    searchKeyword.value = ''
    selectedCompany.value = null
    searchResults.value = []
    showDropdown.value = false
    fetchRankData()
  }

  async function fetchSearchResults() {
    const keyword = searchKeyword.value.trim()
    if (!keyword) return

    searchLoading.value = true

    try {
      const res = await getParentShortNameList({
        companyType: 'cro',
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

  function selectCompany(item: ParentCompanyItem) {
    searchKeyword.value = item.parentCompanyShortName
    selectedCompany.value = item
    showDropdown.value = false
    fetchRankData()
  }

  /** 点击搜索/回车：未从联想列表选择时，按名称精确匹配兜底 */
  async function handleSearch() {
    if (!checkPermission()) return
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }

    const keyword = searchKeyword.value.trim()
    if (!keyword) {
      selectedCompany.value = null
      showDropdown.value = false
      fetchRankData()
      return
    }

    if (!selectedCompany.value) {
      await fetchSearchResults()
      const matched = searchResults.value.find((item) => item.parentCompanyShortName === keyword)
      if (!matched) {
        showDropdown.value = searchResults.value.length > 0
        uni.showToast({ title: '请从列表中选择企业名称', icon: 'none' })
        return
      }
      selectedCompany.value = matched
    }

    showDropdown.value = false
    fetchRankData()
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .cro-rank-page {
    min-height: 100vh;
    background: #f7f8fa;
  }

  // #region 顶部导航
  .nav-bar {
    position: relative;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
  }

  .nav-back {
    width: 60rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 2;

    .back-arrow {
      width: 20rpx;
      height: 20rpx;
      border-left: 4rpx solid #1f2329;
      border-bottom: 4rpx solid #1f2329;
      transform: rotate(45deg);
    }
  }

  .nav-title {
    position: absolute;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 32rpx;
    font-weight: 600;
    color: #1f2329;
  }
  // #endregion

  .page-body {
    padding: 20rpx 32rpx 160rpx;
  }

  // #region 顶部 Banner
  .cb-banner {
    position: relative;
    overflow: hidden;
    height: 136rpx;
    margin-bottom: 24rpx;
    border-radius: 28rpx;
    background: linear-gradient(120deg, #2f7fe8 0%, #1e6fff 55%, #0a57eb 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16rpx;
    padding: 0 32rpx;

    .cb-banner-title {
      font-size: 36rpx;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 4rpx;
      text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.14);

      .gold {
        background: linear-gradient(135deg, #ffe9a3 0%, #ffb547 100%);
        -webkit-background-clip: text;
        background-clip: text;
        color: transparent;
        -webkit-text-fill-color: transparent;
      }
    }

    .cb-deco {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.12);
    }

    .cb-deco1 {
      width: 180rpx;
      height: 180rpx;
      right: -36rpx;
      top: -56rpx;
    }

    .cb-deco2 {
      width: 108rpx;
      height: 108rpx;
      left: 80rpx;
      bottom: -44rpx;
    }

    // #region 领奖台
    .cb-podium {
      position: absolute;
      right: 16rpx;
      bottom: 10rpx;
      display: flex;
      align-items: flex-end;
      gap: 6rpx;

      .podium-bar {
        width: 28rpx;
        background: #ffffff;
        border-radius: 6rpx;

        &.bar-left {
          height: 37rpx;
          opacity: 0.11;
        }

        &.bar-center {
          height: 55rpx;
          opacity: 0.16;
        }

        &.bar-right {
          height: 27rpx;
          opacity: 0.07;
        }
      }
    }
    // #endregion

    // #region 奖杯
    .cb-cup {
      position: relative;
      width: 40rpx;
      height: 40rpx;
      flex: none;

      .cup-body {
        position: absolute;
        left: 6rpx;
        top: 2rpx;
        width: 28rpx;
        height: 20rpx;
        background: linear-gradient(180deg, #ffe9a3 0%, #ffb547 100%);
        border-radius: 4rpx 4rpx 50% 50% / 4rpx 4rpx 70% 70%;
      }

      .cup-handle {
        position: absolute;
        top: 6rpx;
        width: 14rpx;
        height: 14rpx;
        border: 3rpx solid #ffd07a;
        border-radius: 50%;
        box-sizing: border-box;

        &.handle-left {
          left: 0;
        }

        &.handle-right {
          right: 0;
        }
      }

      .cup-stem {
        position: absolute;
        left: 18rpx;
        top: 22rpx;
        width: 4rpx;
        height: 6rpx;
        background: #ffc76b;
      }

      .cup-base {
        position: absolute;
        left: 10rpx;
        top: 28rpx;
        width: 20rpx;
        height: 4rpx;
        border-radius: 2rpx;
        background: #ffc76b;
      }
    }
    // #endregion
  }
  // #endregion

  // #region 卡片
  .co-card {
    background: #ffffff;
    border-radius: 32rpx;
    box-shadow:
      0 2rpx 6rpx rgba(15, 23, 42, 0.06),
      0 2rpx 4rpx rgba(15, 23, 42, 0.04);
    padding: 28rpx 24rpx 24rpx;
    margin-bottom: 24rpx;
  }
  // #endregion

  // #region 筛选区
  .filter-card {
    position: relative;
    padding: 24rpx;
  }

  .co-filter {
    display: flex;
    align-items: center;
    gap: 20rpx;
    height: 96rpx;
    padding: 0 28rpx;
    background: #ffffff;
    border-radius: 24rpx;
    box-shadow:
      0 2rpx 6rpx rgba(15, 23, 42, 0.06),
      0 2rpx 4rpx rgba(15, 23, 42, 0.04);
    margin-bottom: 20rpx;
  }

  .co-filter-label {
    flex-shrink: 0;
    font-size: 26rpx;
    font-weight: 500;
    color: #1f2329;
  }

  .co-filter-div {
    flex-shrink: 0;
    width: 2rpx;
    height: 32rpx;
    background: #f0f1f3;
  }

  .co-filter-val {
    flex: 1;
    min-width: 0;
    font-size: 26rpx;
    color: #9ca3af;

    &.on {
      color: #1e6fff;
      font-weight: 600;
    }
  }

  .co-filter-arrow {
    flex-shrink: 0;
    width: 14rpx;
    height: 14rpx;
    border-right: 3rpx solid #9ca3af;
    border-bottom: 3rpx solid #9ca3af;
    transform: rotate(45deg);
    margin-top: -6rpx;
  }

  // #region 年份下拉
  .cb-dropdown {
    position: absolute;
    left: 24rpx;
    top: 128rpx;
    z-index: 20;
    background: #ffffff;
    border-radius: 24rpx;
    box-shadow: 0 16rpx 48rpx rgba(15, 23, 42, 0.1);
    padding: 12rpx;
    min-width: 256rpx;
    max-height: 520rpx;
    overflow-y: auto;

    .cb-opt {
      padding: 20rpx 28rpx;
      font-size: 26rpx;
      color: #1f2329;
      border-radius: 16rpx;
      white-space: nowrap;

      &.active {
        color: #1e6fff;
        font-weight: 600;
        background: #ebf3ff;
      }
    }
  }
  // #endregion

  // #region 企业搜索胶囊
  .cb-search {
    display: flex;
    align-items: center;
    gap: 16rpx;
    height: 76rpx;
    background: #f7f8fa;
    border-radius: 20rpx;
    padding-left: 24rpx;
    overflow: hidden;
  }

  .cb-search-icon {
    position: relative;
    flex: none;
    width: 32rpx;
    height: 32rpx;

    &::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      width: 22rpx;
      height: 22rpx;
      border: 3rpx solid #9ca3af;
      border-radius: 50%;
      box-sizing: border-box;
    }

    &::before {
      content: '';
      position: absolute;
      left: 15rpx;
      top: 19rpx;
      width: 10rpx;
      height: 3rpx;
      background: #9ca3af;
      border-radius: 2rpx;
      transform: rotate(45deg);
    }
  }

  .cb-search-input {
    flex: 1;
    min-width: 0;
    height: 100%;
    font-size: 26rpx;
    color: #1f2329;
  }

  .cb-search-clear {
    flex-shrink: 0;
    height: 100%;
    padding: 0 4rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    text {
      font-size: 34rpx;
      line-height: 1;
      color: #c4c8d0;
    }
  }

  .cb-search-btn {
    flex-shrink: 0;
    height: 100%;
    padding: 0 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e6fff;
    color: #ffffff;
    font-size: 26rpx;
    border-radius: 0 20rpx 20rpx 0;

    &:active {
      opacity: 0.85;
    }
  }
  // #endregion

  // #region 企业联想下拉
  .search-dropdown {
    position: absolute;
    left: 24rpx;
    right: 24rpx;
    top: 220rpx;
    z-index: 30;
    background: #ffffff;
    border-radius: 24rpx;
    box-shadow: 0 16rpx 48rpx rgba(15, 23, 42, 0.1);
    padding: 8rpx 0;
    max-height: 400rpx;
    overflow-y: auto;

    .dropdown-list {
      width: 100%;
    }

    .dropdown-item {
      padding: 24rpx 30rpx;
      border-bottom: 2rpx solid #f0f1f3;

      &:last-child {
        border-bottom: none;
      }

      &:active {
        background: #f7f8fa;
      }

      .dropdown-name {
        font-size: 26rpx;
        color: #1f2329;
      }
    }

    .dropdown-loading,
    .dropdown-empty {
      padding: 30rpx 0;
      text-align: center;
      font-size: 24rpx;
      color: #9ca3af;
    }
  }
  // #endregion
  // #endregion

  // #region 排序说明
  .cb-note {
    font-size: 24rpx;
    color: #9ca3af;
    margin: 0 8rpx 16rpx;
  }
  // #endregion

  // #region 榜单表格
  .cb-table {
    padding: 12rpx 24rpx;
  }

  .cb-thead {
    display: flex;
    padding: 20rpx 8rpx;
    border-bottom: 2rpx solid #f0f1f3;
  }

  .cb-th {
    font-size: 24rpx;
    color: #9ca3af;
    text-align: center;
  }

  .cb-c1 {
    width: 96rpx;
    flex-shrink: 0;
  }

  .cb-c2 {
    flex: 1;
    min-width: 0;
  }

  .cb-c3 {
    width: 148rpx;
    flex-shrink: 0;
  }

  .cb-c4 {
    width: 176rpx;
    flex-shrink: 0;
  }

  .cb-tr {
    display: flex;
    align-items: center;
    border-bottom: 2rpx solid #f0f1f3;

    &:last-child {
      border-bottom: none;
    }
  }

  .cb-tr-hover {
    background-color: #f7f8fa;
  }

  .cb-td {
    font-size: 26rpx;
    color: #1f2329;
    padding: 26rpx 8rpx;
    text-align: center;
  }

  .cb-td-idx {
    color: #6b7280;
  }

  .cb-td-name {
    text-align: left;
    font-weight: 500;
    color: #1e6fff;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .cb-td-num {
    font-weight: 600;
  }

  .cb-top {
    color: #1e6fff;
    font-weight: 700;
  }

  .cb-empty {
    text-align: center;
    padding: 60rpx 0 48rpx;
    font-size: 26rpx;
    color: #9ca3af;
  }
  // #endregion

  .foot-note {
    text-align: center;
    font-size: 22rpx;
    color: #9ca3af;
    margin: 32rpx 0 8rpx;
    line-height: 1.6;
  }

  // #region 右下角浮动分享按钮
  .co-fab {
    position: fixed;
    right: 28rpx;
    bottom: 128rpx;
    z-index: 30;
  }

  .fab-btn {
    width: 92rpx;
    height: 92rpx;
    padding: 0;
    margin: 0;
    line-height: 1;
    border-radius: 50%;
    background: #1e6fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12rpx 36rpx rgba(30, 111, 255, 0.35);

    &::after {
      border: none;
    }

    &:active {
      transform: scale(0.94);
    }
  }

  .fab-share-icon {
    position: relative;
    width: 40rpx;
    height: 44rpx;

    .fs-head {
      position: absolute;
      left: 14rpx;
      top: 2rpx;
      width: 12rpx;
      height: 12rpx;
      border-left: 4rpx solid #ffffff;
      border-top: 4rpx solid #ffffff;
      border-radius: 2rpx;
      transform: rotate(45deg);
    }

    .fs-shaft {
      position: absolute;
      left: 18rpx;
      top: 4rpx;
      width: 4rpx;
      height: 22rpx;
      background: #ffffff;
      border-radius: 2rpx;
    }

    .fs-box {
      position: absolute;
      left: 2rpx;
      bottom: 0;
      width: 36rpx;
      height: 18rpx;
      border: 4rpx solid #ffffff;
      border-top: none;
      border-radius: 0 0 8rpx 8rpx;
      box-sizing: border-box;
    }
  }
  // #endregion
</style>
