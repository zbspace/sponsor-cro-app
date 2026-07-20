<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="vip-btn-wrapper" v-if="isVip !== 1" @click="goTo('vip/index')">
      <image class="vip-btn-img" src="/static/icons/vip.png" mode="aspectFit" />
      <text>开通VIP</text>
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
        <!-- <text class="main-title">临床研究核心词汇</text> -->
        <image class="title-icon" src="../../static/icons/临床研究核心词汇.png" mode="aspectFit" />
        <text class="sub-title">Core Vocabulary for Clinical Research</text>
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
              placeholder="输入申办方名称"
              v-model="searchKeyword"
              placeholder-style="color: #CCCCCC"
            />
            <view class="arrow-right-icon"></view>
          </view>
        </view>
      </view>

      <!-- CRO 榜单 -->
      <view class="ranking-card">
        <view class="ranking-header">
          <text class="ranking-title">中国临床CRO榜单</text>
          <view class="view-all" @click="goTo('ranking/index')">
            <text>查看全部</text>
            <view class="arrow-right-icon"></view>
          </view>
        </view>
        <view class="ranking-list">
          <view class="ranking-item" v-for="(item, index) in rankingList" :key="index">
            <view class="rank-badge" :class="'rank-' + (index + 1)">
              <!-- <text>{{ index + 1 }}</text> -->
              <image
                class="rank-icon"
                :src="`../../static/icons/${index + 1}.png`"
                mode="aspectFit"
              />
            </view>
            <view class="company-info">
              <text class="company-name">{{ item.name }}</text>
              <view class="company-stats">
                <text>项目经验：{{ item.projects }}</text>
                <text class="stat-divider">合作企业数：{{ item.partners }}</text>
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
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, reactive, computed } from 'vue'
  import { onShow, onShareAppMessage, onLoad } from '@dcloudio/uni-app'
  import CircleProgress from '../../components/circle-progress/circle-progress.vue'
  import DataStatementPopup from '../../components/data-statement-popup/data-statement-popup.vue'
  import { getIndexInfo, getVip, ensureLogin } from '@/api'
  import type { IndexInfoResponse } from '@/types/api'
  // #endregion

  // #region 状态
  const isVip = ref(0)
  const showDataStatement = ref(false)
  const searchKeyword = ref('')
  const currentFilter = ref('申办方')
  const rankingList = ref([
    { name: '泰格医药', projects: 654, partners: 654 },
    { name: '艾昆玮', projects: 654, partners: 654 },
    { name: '来博客', projects: 654, partners: 654 }
  ])
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
    fetchIndexInfo()
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
  async function fetchIndexInfo() {
    try {
      const res = await getIndexInfo()
      Object.assign(indexData, res.data)
      // 缓存总单词数
      uni.setStorageSync('allWordsNum', res.data.allWordsNum)
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

  function toggleFilter() {
    currentFilter.value = currentFilter.value === '申办方' ? 'CRO' : '申办方'
  }

  function goToHome() {
    uni.reLaunch({ url: '/pages/index/index' })
  }

  function toggleStar() {
    uni.showToast({ title: '已收藏', icon: 'success' })
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
    margin-bottom: 30rpx;
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
  }
  /* #endregion */

  /* #region CRO 榜单 */
  .ranking-card {
    background: #ffffff;
    border-radius: 32rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);

    .ranking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40rpx;

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
    margin-bottom: 60rpx;
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
