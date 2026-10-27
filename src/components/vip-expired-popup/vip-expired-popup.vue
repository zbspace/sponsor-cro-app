<template>
  <bottom-sheet :visible="visible" :z-index="9999" @close="close">
    <view class="vip-expired-content">
      <view class="popup-body">
        <text class="title">你的试用VIP名额已经用完</text>
        <text class="sub-title">继续使用，需要开通会员</text>
      </view>

      <view class="submit-btn" @click="handleApply">
        <text>申请开通</text>
      </view>
    </view>
  </bottom-sheet>
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
  .vip-expired-content {
    width: 100%;
    min-height: 70vh;
    max-height: 80vh;
    background: #ffffff;
    border-radius: 40rpx 40rpx 0 0;
    padding: 60rpx 48rpx calc(60rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
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
      width: 100%;
      height: 92rpx;
      background: linear-gradient(135deg, #3d7bff 0%, #1e5fff 100%);
      border-radius: 46rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 16rpx 36rpx rgba(30, 95, 255, 0.3);

      text {
        color: #ffffff;
        font-size: 32rpx;
        font-weight: 600;
      }

      &:active {
        background: linear-gradient(135deg, #2f6bef 0%, #1553ee 100%);
        transform: scale(0.98);
      }
    }
  }
</style>
