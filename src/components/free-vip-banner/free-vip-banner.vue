<template>
  <view class="free-vip-banner" v-if="visible" @click="handleApply">
    <image class="banner-bg" src="../../static/apply-free-vip-bg.png" mode="aspectFill" />

    <view class="content">
      <view class="text-section">
        <text class="title">恭喜！您有1天免费VIP试用名额</text>
        <view class="apply-btn" @click.stop="handleApply">
          <text>申请</text>
        </view>
      </view>

      <view class="close-wrapper" @click.stop="handleClose">
        <text class="close-icon">×</text>
      </view>
    </view>
  </view>

  <!-- 申请试用弹窗 -->
  <trial-apply-popup v-model:visible="showTrialPopup" @success="handleSuccess" />
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import TrialApplyPopup from '@/components/trial-apply-popup/trial-apply-popup.vue'
  import { onLoad } from '@dcloudio/uni-app'

  const showTrialPopup = ref(false)

  // #region 属性与事件
  defineProps<{
    visible: boolean
  }>()

  const emit = defineEmits(['apply', 'close', 'success'])
  // #endregion

  // #region 方法
  const handleApply = () => {
    showTrialPopup.value = true
    emit('apply')
  }

  const handleClose = () => {
    emit('close')
  }

  const handleSuccess = () => {
    emit('success')
  }

  onLoad(() => {
    //
  })
  // #endregion
</script>

<style lang="scss" scoped>
  .free-vip-banner {
    position: relative;
    width: 690rpx;
    height: 160rpx;
    margin: 20rpx auto;
    border-radius: 24rpx;
    overflow: hidden;
    box-shadow: 0 8rpx 20rpx rgba(43, 118, 246, 0.15);

    .banner-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .content {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      padding: 0 40rpx;
      box-sizing: border-box;

      .text-section {
        display: flex;
        flex-direction: column;
        justify-content: center;

        .title {
          font-size: 32rpx;
          color: #ffffff;
          font-weight: 500;
          margin-bottom: 16rpx;
          text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
        }

        .apply-btn {
          width: 140rpx;
          height: 56rpx;
          background: linear-gradient(90deg, #4295f3 0%, #2b66ef 100%);
          border-radius: 28rpx;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 4rpx 12rpx rgba(43, 118, 246, 0.3);

          text {
            font-size: 26rpx;
            color: #ffffff;
            font-weight: bold;
          }

          &:active {
            opacity: 0.9;
            transform: scale(0.98);
          }
        }
      }

      .close-wrapper {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        width: 44rpx;
        height: 44rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;

        .close-icon {
          font-size: 32rpx;
          color: #ffffff;
          line-height: 1;
          margin-top: -4rpx;
        }

        &:active {
          background: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }
</style>
