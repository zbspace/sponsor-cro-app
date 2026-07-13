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

      <!-- 进度卡片 -->
      <view class="progress-card">
        <view class="progress-header">
          <text class="progress-title">单词背诵进度</text>
          <text class="progress-text">
            {{ indexData.recitedWordsNum }}/{{ indexData.allWordsNum }}
          </text>
        </view>
        <view class="progress-bar">
          <view
            class="progress-fill"
            :style="{
              width:
                (indexData.allWordsNum > 0
                  ? (indexData.recitedWordsNum / indexData.allWordsNum) * 100
                  : 0) + '%'
            }"
          ></view>
        </view>
        <view class="stats-row">
          <view class="stat-item">
            <text class="stat-label">正确率（%）</text>
            <circle-progress
              canvas-id="accuracyCanvas"
              :percent="accuracyPercent"
              color="#10B981"
              :text="indexData.accuracy"
              text-color="#10B981"
            />
          </view>
          <view class="stat-item">
            <text class="stat-label">坚持天数</text>
            <circle-progress
              canvas-id="daysCanvas"
              :percent="streakPercent"
              color="#F59E0B"
              :text="String(indexData.streak)"
              text-color="#F59E0B"
            />
          </view>
          <view class="stat-item">
            <text class="stat-label">进度（%）</text>
            <circle-progress
              canvas-id="progressCanvas"
              :percent="progressPercent"
              color="#499AE6"
              :text="indexData.progress"
              text-color="#499AE6"
            />
          </view>
        </view>
        <button class="start-btn" @click="goToLearn">开始背诵</button>
      </view>

      <!-- 菜单列表 -->
      <view class="record-title">背诵记录</view>
      <view class="menu-list">
        <view class="menu-item" @click="goTo('word/learned')">
          <view class="menu-left">
            <image class="icon-img" src="/static/icons/已背诵单词.png" mode="aspectFit" />
            <text>已背诵单词</text>
          </view>
          <view class="menu-right">
            <text class="count">{{ indexData.recitedWordsNum }}</text>
            <text class="arrow">〉</text>
          </view>
        </view>
        <view class="menu-item" @click="goTo('word/learned', 'tab=2')">
          <view class="menu-left">
            <image class="icon-img" src="/static/icons/待复习单词.png" mode="aspectFit" />
            <text>待复习单词</text>
          </view>
          <view class="menu-right">
            <text class="count">{{ indexData.toReviewWordsNum }}</text>
            <text class="arrow">〉</text>
          </view>
        </view>
        <view class="menu-item" @click="goTo('word/learned', 'tab=1')">
          <view class="menu-left">
            <image class="icon-img" src="/static/icons/收藏单词.png" mode="aspectFit" />
            <text>收藏单词</text>
          </view>
          <view class="menu-right">
            <text class="count">{{ indexData.collectWordsNum }}</text>
            <text class="arrow">〉</text>
          </view>
        </view>
      </view>

      <!-- 底部 -->
      <view class="footer">
        <text class="footer-text">- 别让英文成为职业瓶颈 -</text>
        <text class="footer-sub">吃透临研核心词汇，让专业能力与职业发展双向奔赴</text>
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
