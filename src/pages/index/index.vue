<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="vip-btn-wrapper" v-if="isVip !== 1" @click="goTo('vip/index')">
      <image class="vip-btn-img" src="/static/icons/vip.png" mode="aspectFit" />
      <text>开通VIP</text>
      <view class="arrow-right-icon" style="border-color: #fff"></view>
    </view>
    <view class="vip-badge" v-else @click="goTo('vip/index')">
      <image class="vip-badge-icon" src="/static/vip-icon.svg" mode="aspectFit" />
      <text>尊享会员</text>
    </view>
  </view>

  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <scroll-view
    scroll-y
    class="container-scroll-view"
    :show-scrollbar="false"
    enhanced
    :style="{
      height: `calc(100vh - ${menu.top}px - ${menu.height}px)`
    }"
  >
    <view class="container">
      <!-- 标题 -->
      <view class="title-section">
        <text class="main-title">申办方&CRO</text>
        <text class="sub-title">试验合作记录查询</text>
      </view>

      <!-- 申办方 & CRO 查询区域 -->
      <view class="search-section">
        <view class="search-bar">
          <view class="filter-dropdown" @click="toggleFilter">
            <text>{{ currentFilter }}</text>
            <view class="arrow-down"></view>
          </view>
          <view class="divider"></view>
          <view class="search-input-wrapper">
            <icon type="search" size="18" color="#CCCCCC" class="search-icon" />
            <input
              type="text"
              :placeholder="currentFilter === '申办方' ? '输入申办方名称' : '输入CRO名称'"
              v-model="searchKeyword"
              placeholder-style="color: #CCCCCC"
              @input="onSearchInput"
            />
            <view class="arrow-right-icon"></view>
          </view>
        </view>

        <!-- 搜索下拉 -->
        <view class="search-dropdown" v-if="showDropdown">
          <view class="dropdown-loading" v-if="searchLoading">
            <text>加载中...</text>
          </view>
          <template v-else>
            <view
              class="dropdown-item"
              v-for="item in searchResults"
              :key="item.parentCompanyId"
              @click="selectCompany(item)"
            >
              <text class="dropdown-name">{{ item.parentCompanyShortName }}</text>
            </view>
            <view class="dropdown-empty" v-if="searchResults.length === 0">
              <text>未找到相关公司</text>
            </view>
          </template>
        </view>
      </view>

      <!-- CRO 榜单 -->
      <view class="ranking-card">
        <view class="ranking-header">
          <text class="ranking-title">中国临床CRO榜单</text>
          <view class="view-all">
            <text @click="goTo('cro-rank/index')">查看全部</text>
            <view class="arrow-right-icon"></view>
          </view>
        </view>
        <view class="ranking-list">
          <view
            class="ranking-item"
            v-for="(item, index) in rankingList"
            :key="index"
            @click="goToCroStat(item)"
          >
            <view class="rank-badge" :class="'rank-' + (index + 1)">
              <image
                class="rank-icon"
                :src="`../../static/icons/${index + 1}.png`"
                mode="aspectFit"
              />
            </view>
            <view class="company-info">
              <text class="company-name">{{ item.parentCompanyShortName }}</text>
              <view class="company-stats">
                <text>项目经验：{{ item.projectExperienceNum }}</text>
                <text class="stat-divider">合作企业数：{{ item.cooperationEnterpriseNum }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="data-source-note">注：合作记录数据来源遗传办国合审批公示数据</view>

      <!-- 悬浮按钮 -->
      <view class="side-floating-buttons">
        <view class="float-btn home-btn" @click="goToHome">
          <image src="../../static/icons/home.png" mode="aspectFit" />
        </view>
        <view class="float-btn star-btn" @click="toggleStar">
          <!-- <image src="../../static/icons/收藏1.png" mode="aspectFit" /> -->
          <image src="../../static/icons/收藏2.svg" mode="aspectFit" />
        </view>
      </view>

      <!-- 底部助手标语 -->
      <view class="bd-assistant-section">
        <text class="bd-name">临研商务(BD)助手</text>
        <text class="bd-slogan">- 助力BD拿单 -</text>
      </view>

      <!-- 底部 -->
      <view class="footer">
        <view class="footer-links">
          <button class="footer-link-item share-btn" open-type="share">
            <image class="footer-icon" src="/static/icons/分享.png" mode="aspectFit" />
            <text>分享给朋友</text>
          </button>
          <view class="footer-link-item" @click="showDataStatement = true">
            <image class="footer-icon" src="/static/icons/数据声明.png" mode="aspectFit" />
            <text>数据声明</text>
          </view>
          <view class="footer-link-item" @click="goTo('contact/index')">
            <image class="footer-icon" src="/static/icons/联系我们.png" mode="aspectFit" />
            <text>联系我们</text>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>

  <!-- 数据声明弹窗 -->
  <data-statement-popup v-model:visible="showDataStatement" />

  <!-- 手机号绑定弹窗 -->
  <phone-bind-popup />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, reactive, computed } from 'vue'
  import { onShow, onShareAppMessage, onLoad } from '@dcloudio/uni-app'
  import DataStatementPopup from '../../components/data-statement-popup/data-statement-popup.vue'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import {
    getIndexInfo,
    getVip,
    ensureLogin,
    selectClinicalCroRankList,
    getParentShortNameList
  } from '@/api'
  import type { IndexInfoResponse, ParentCompanyItem, CroRankItem } from '@/types/api'
  // #endregion

  // #region 状态
  const isVip = ref(0)
  const showDataStatement = ref(false)
  const searchKeyword = ref('')
  const currentFilter = ref('申办方')
  // 搜索下拉状态
  const searchResults = ref<ParentCompanyItem[]>([])
  const showDropdown = ref(false)
  const searchLoading = ref(false)
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  const rankingList = ref<CroRankItem[]>([])
  const indexData = reactive<IndexInfoResponse>({
    accuracy: '0%',
    streak: 0,
    allDays: 200,
    progress: '0%',
    nextWordId: 1,
    allWordsNum: 0,
    recitedWordsNum: 0,
    toReviewWordsNum: 0,
    collectWordsNum: 0
  })

  // 正确率百分比（去 % 转数字）
  const accuracyPercent = computed(() => parseFloat(indexData.accuracy) || 0)
  // 坚持天数百分比
  const streakPercent = computed(() => (indexData.streak / indexData.allDays) * 100)
  // 进度百分比（去 % 转数字）
  const progressPercent = computed(() => parseFloat(indexData.progress) || 0)
  // #endregion

  // #region 生命周期
  onShow(async () => {
    // 确保登录成功后再获取数据
    await ensureLogin()
    isVip.value = getVip()
    fetchCroRankList()
  })

  onShareAppMessage(() => {
    return {
      title: '临床研究核心词汇 - 攻克研究核心词汇',
      path: '/pages/index/index',
      imageUrl: '/static/icons/header-bg.png'
    }
  })
  // #endregion

  // #region 方法

  async function fetchCroRankList() {
    try {
      const res = await selectClinicalCroRankList({
        pageNum: 1,
        pageSize: 3
      })
      rankingList.value = res.data?.list || []
    } catch {
      // 静默处理，保持默认值
    }
  }

  function goTo(path: string, query?: string) {
    const url = query ? `/pages/${path}?${query}` : `/pages/${path}`
    uni.navigateTo({ url })
  }

  function goToLearn() {
    if (indexData.nextWordId) {
      uni.navigateTo({ url: `/pages/learn/question?wordId=${indexData.nextWordId}&learnedCount=1` })
    } else {
      uni.showToast({ title: '暂无待背诵单词', icon: 'none' })
    }
  }

  // 当前筛选类型对应的接口 companyType
  const currentCompanyType = computed(() => (currentFilter.value === '申办方' ? 'sponsor' : 'cro'))

  function toggleFilter() {
    currentFilter.value = currentFilter.value === '申办方' ? 'CRO' : '申办方'
    // 切换类型时清空搜索
    searchKeyword.value = ''
    searchResults.value = []
    showDropdown.value = false
  }

  /**
   * 输入防抖触发搜索
   */
  function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer)
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

  /**
   * 调用母公司简称列表接口获取搜索建议
   */
  async function fetchSearchResults() {
    const keyword = searchKeyword.value.trim()
    if (!keyword) return
    searchLoading.value = true
    showDropdown.value = true
    try {
      const res = await getParentShortNameList({
        companyType: currentCompanyType.value,
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

  /**
   * 选择搜索建议，跳转对应公司统计页
   */
  function selectCompany(item: ParentCompanyItem) {
    searchKeyword.value = item.parentCompanyShortName
    showDropdown.value = false
    console.log(2222, item)

    // 公司名称参数，用于跳转页面标题显示
    if (currentCompanyType.value === 'sponsor') {
      const nameParam = `companyName=${encodeURIComponent(item.parentCompanyShortName)}`
      goTo('sponsor-stat/index', `sponsorParentCompanyId=${item.parentCompanyId}&${nameParam}`)
    } else {
      goTo(
        'cro-stat/index',
        `partnerParentCompanyId=${item.parentCompanyId}&parentCompanyShortName=${item.parentCompanyShortName}`
      )
    }
  }

  // 前往CRO统计页
  function goToCroStat(item: CroRankItem) {
    console.log(3333, item)
    goTo(
      'cro-stat/index',
      `partnerParentCompanyId=${item.parentCompanyId}&parentCompanyShortName=${item.parentCompanyShortName}`
    )
  }

  function goToHome() {
    uni.reLaunch({ url: '/pages/index/index' })
  }

  function toggleStar() {
    goTo('collect/index')
  }
  // #endregion

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  onLoad(() => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
  })
</script>

<style lang="scss" scoped>
  /* #region 申办方 & CRO 查询 */
  .search-section {
    position: relative;
    margin-bottom: 60rpx;
    .search-bar {
      background: #ffffff;
      border-radius: 24rpx;
      height: 100rpx;
      display: flex;
      align-items: center;
      padding: 0 30rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

      .filter-dropdown {
        display: flex;
        align-items: center;
        padding-right: 20rpx;
        color: #666666;
        font-size: 28rpx;

        .arrow-down {
          width: 0;
          height: 0;
          border-left: 8rpx solid transparent;
          border-right: 8rpx solid transparent;
          border-top: 10rpx solid #999999;
          margin-left: 12rpx;
        }
      }

      .divider {
        width: 2rpx;
        height: 40rpx;
        background-color: #f0f0f0;
        margin: 0 20rpx;
      }

      .search-input-wrapper {
        flex: 1;
        display: flex;
        align-items: center;

        .search-icon {
          margin-right: 16rpx;
        }

        input {
          flex: 1;
          font-size: 28rpx;
          color: #333333;
        }
      }
    }

    // #region 搜索下拉
    .search-dropdown {
      position: absolute;
      top: 100rpx;
      left: 0;
      right: 0;
      background: #ffffff;
      border-radius: 16rpx;
      box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
      z-index: 100;
      max-height: 480rpx;
      overflow-y: auto;

      .dropdown-item {
        padding: 26rpx 30rpx;
        border-bottom: 2rpx solid #f5f5f5;

        &:last-child {
          border-bottom: none;
        }

        &:active {
          background: #f5f7fa;
        }

        .dropdown-name {
          font-size: 28rpx;
          color: #333333;
        }
      }

      .dropdown-loading,
      .dropdown-empty {
        padding: 40rpx 0;
        text-align: center;

        text {
          font-size: 26rpx;
          color: #999999;
        }
      }
    }
    // #endregion
  }
  /* #endregion */

  /* #region CRO 榜单 */
  .ranking-card {
    border-radius: 32rpx;
    margin-bottom: 30rpx;

    .ranking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24rpx;

      .ranking-title {
        font-weight: 400;
        font-size: 28rpx;
        color: #999999;
        line-height: 52rpx;
      }

      .view-all {
        display: flex;
        align-items: center;
        font-size: 24rpx;
        color: #cccccc;

        .arrow-right {
          margin-left: 6rpx;
        }
      }
    }

    .ranking-list {
      background: #ffffff;
      border-radius: 32rpx;
      padding: 0 30rpx;
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
      .ranking-item {
        display: flex;
        align-items: center;
        padding: 30rpx 0;
        border-bottom: 1rpx solid #f8f8f8;

        &:last-child {
          border-bottom: none;
        }

        .rank-badge {
          width: 60rpx;
          height: 60rpx;
          border-radius: 8rpx;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 32rpx;
          font-weight: bold;
          margin-right: 30rpx;
          color: #cccccc;

          &.rank-1 {
            color: #ff6b6b;
          }
          &.rank-2 {
            color: #499ae6;
          }
          &.rank-3 {
            color: #8bc34a;
          }
        }

        .company-info {
          flex: 1;

          .company-name {
            font-size: 32rpx;
            font-weight: 500;
            color: #333333;
            margin-bottom: 8rpx;
            display: block;
          }

          .company-stats {
            display: flex;
            font-size: 24rpx;
            color: #999999;

            .stat-divider {
              margin-left: 30rpx;
            }
          }
        }
      }
    }
  }

  .data-source-note {
    font-size: 24rpx;
    color: #cccccc;
    text-align: center;
    margin-bottom: 120rpx;
  }
  /* #endregion */

  /* #region 底部助手 */
  .bd-assistant-section {
    text-align: center;
    margin-bottom: 40rpx;
    .bd-name {
      display: block;
      font-size: 28rpx;
      color: #999999;
      margin-bottom: 12rpx;
    }
    .bd-slogan {
      display: block;
      font-size: 24rpx;
      color: #cccccc;
    }
  }
  /* #endregion */

  /* #region 悬浮按钮 */
  .side-floating-buttons {
    position: fixed;
    right: 30rpx;
    bottom: 250rpx;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
    z-index: 100;

    .float-btn {
      width: 80rpx;
      height: 80rpx;
      border-radius: 12rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      // box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

      image {
        width: 80rpx;
        height: 80rpx;
      }

      // &.home-btn {
      //   background-color: #499ae6;
      // }

      // &.star-btn {
      //   background-color: #ff8b8b;
      // }
    }
  }
  /* #endregion */

  /* #region 标题 */
  .title-section {
    text-align: center;
    margin-bottom: 60rpx;
    .title-icon {
      height: 76rpx;
      margin-bottom: 8rpx;
    }

    .sub-title {
      font-weight: 400;
      font-size: 28rpx;
      color: #999999;
      line-height: 52rpx;
      text-align: center;
      font-style: normal;
      text-transform: none;
      margin-bottom: 40rpx;
      display: block;
    }
  }
  /* #endregion */

  /* #region 进度卡片 */
  .progress-card {
    background-color: #ffffff;
    border-radius: 32rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
    border: 2rpx solid #eeeeee;

    .progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 28rpx;
      color: #666;
      margin-bottom: 30rpx;
      .progress-title,
      .progress-text {
        font-weight: 400;
        font-size: 28rpx;
        color: #999999;
        line-height: 52rpx;
        text-align: left;
        font-style: normal;
        text-transform: none;
      }
    }

    .progress-bar {
      height: 36rpx;
      background-color: #f3f4f6;
      border-radius: 12rpx;
      margin-bottom: 60rpx;
      overflow: hidden;

      .progress-fill {
        height: 100%;
        background-color: #499ae6;
        border-radius: 12rpx;
        transition: width 0.3s ease;
      }
    }

    .stats-row {
      display: flex;
      justify-content: space-around;
      margin-bottom: 30rpx;
      background: #fafbfc;
      border-radius: 20rpx 20rpx 20rpx 20rpx;
      padding: 30rpx 0;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-label {
          font-weight: 400;
          font-size: 28rpx;
          color: #999999;
          line-height: 52rpx;
          text-align: left;
          font-style: normal;
          text-transform: none;
          margin-bottom: 20rpx;
        }
      }
    }

    .start-btn {
      background-color: #499ae6;
      color: white;
      border-radius: 48rpx;
      width: 272rpx;
      height: 80rpx;
      font-size: 28rpx;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
  /* #endregion */

  /* #region 菜单列表 */
  .record-title {
    font-weight: 400;
    font-size: 28rpx;
    color: #999999;
    line-height: 52rpx;
    text-align: left;
    font-style: normal;
    text-transform: none;
    margin-bottom: 24rpx;
  }

  .menu-list {
    background-color: #ffffff;
    border-radius: 32rpx;
    padding: 20rpx 30rpx;
    margin-bottom: 56rpx;

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30rpx 0;
      border-bottom: 2rpx solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      .menu-left {
        display: flex;
        align-items: center;
        font-weight: 400;
        font-size: 28rpx;
        color: #333333;
        line-height: 52rpx;
        text-align: left;
        font-style: normal;
        text-transform: none;

        .icon-img {
          width: 48rpx;
          height: 48rpx;
          margin-right: 24rpx;
        }
      }

      .menu-right {
        display: flex;
        align-items: center;
        color: #999;
        font-size: 28rpx;

        .count {
          margin-right: 20rpx;
        }
      }
    }
  }
  /* #endregion */

  /* #region 底部 */
  .footer {
    text-align: center;

    .footer-text {
      display: block;
      font-weight: 400;
      font-size: 24rpx;
      color: #999999;
      line-height: 52rpx;
      text-align: left;
      font-style: normal;
      text-transform: none;
      margin-bottom: 20rpx;
      text-align: center;
    }

    .footer-sub {
      display: block;
      font-weight: 400;
      font-size: 24rpx;
      color: #999999;
      line-height: 52rpx;
      text-align: left;
      font-style: normal;
      text-transform: none;
      margin-bottom: 60rpx;
      text-align: center;
    }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 60rpx;
      font-size: 24rpx;
      color: #666;
      margin-bottom: 70rpx;

      .footer-link-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        font-weight: 400;
        font-size: 24rpx;
        color: #666666;
        line-height: 52rpx;
        text-align: left;
        font-style: normal;
        text-transform: none;

        .footer-icon {
          width: 66rpx;
          height: 66rpx;
          margin-bottom: 20rpx;
        }
      }

      .share-btn {
        background-color: transparent;
        padding: 0;
        margin: 0;
        border: none;
        border-radius: 0;
        color: #666;
        overflow: visible;
        line-height: 52rpx;

        &::after {
          display: none;
        }
      }
    }
  }
  /* #endregion */
</style>
