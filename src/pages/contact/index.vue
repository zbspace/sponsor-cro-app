<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">联系我们</text>
    <view class="nav-right"></view>
  </view>

  <view class="container">
    <!-- 内容卡片 -->
    <view class="content-card">
      <text class="hint-text">截图识别如下二维码</text>
      <text class="hint-text">添加微信</text>

      <view class="qr-code-wrapper">
        <!-- 占位图，实际可替换为 /static/qr-code.png -->
        <image class="qr-code" src="../../static/contact.jpg" mode="aspectFit" />
      </view>

      <view class="wechat-id-badge">
        <text>微信号：tanganbang003</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'

  const goBack = () => {
    uni.navigateBack({
      delta: 1,
      fail: () => {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    })
  }

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  onLoad(async (options: any) => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
  })
</script>

<style lang="scss" scoped>
  /* #region 内容卡片 */
  .content-card {
    background-color: #ffffff;
    border-radius: 32rpx;
    padding: 80rpx 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-shadow: 0 8rpx 40rpx rgba(0, 0, 0, 0.03);
    overflow: hidden;

    .hint-text {
      font-size: 30rpx;
      color: #333;
      line-height: 1.8;
      font-weight: 400;
    }

    .qr-code-wrapper {
      position: relative;
      margin: 60rpx 0;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;

      .qr-code {
        height: 860rpx;
        z-index: 2;
        background-color: #ffffff; /* 盖住虚线 */
      }

      .dash-line {
        position: absolute;
        top: 50%;
        left: -40rpx;
        right: -40rpx;
        height: 2rpx;
        border-top: 2rpx dashed #b5c2d1;
        z-index: 1;
      }
    }

    .wechat-id-badge {
      background-color: #499ae6;
      color: #ffffff;
      padding: 20rpx 48rpx;
      border-radius: 40rpx;
      font-size: 28rpx;
      font-weight: 500;
      margin-top: 20rpx;
    }
  }
  /* #endregion */
</style>
