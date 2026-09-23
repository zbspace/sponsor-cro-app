<template>
  <view class="vip-expired-mask" v-if="visible" @click="close" @touchmove.stop.prevent>
    <view class="vip-expired-content" @click.stop>
      <view class="popup-body">
        <text class="title">你的试用VIP名额已经用完</text>
        <text class="sub-title">继续使用，需要开通会员</text>
      </view>

      <view class="submit-btn" @click="handleApply">
        <text>申请开通</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  // #region 属性与事件
  defineProps<{
    visible: boolean
  }>()

  const emit = defineEmits(['update:visible', 'apply'])
  // #endregion

  // #region 方法
  function close() {
    emit('update:visible', false)
  }

  function handleApply() {
    emit('apply')
    close()
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .vip-expired-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
  }

  .vip-expired-content {
    width: 600rpx;
    background: #ffffff;
    border-radius: 32rpx;
    padding: 60rpx 40rpx;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;

    .popup-body {
      text-align: center;
      margin-bottom: 50rpx;

      .title {
        display: block;
        font-weight: bold;
        font-size: 36rpx;
        color: #333333;
        margin-bottom: 20rpx;
      }

      .sub-title {
        display: block;
        font-size: 30rpx;
        color: #666666;
      }
    }

    .submit-btn {
      width: 400rpx;
      height: 88rpx;
      background: linear-gradient(90deg, #4295f3 0%, #2b66ef 100%);
      border-radius: 44rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 8rpx 20rpx rgba(43, 118, 246, 0.3);

      text {
        color: #ffffff;
        font-size: 30rpx;
        font-weight: bold;
      }

      &:active {
        opacity: 0.9;
        transform: scale(0.98);
      }
    }
  }
</style>
