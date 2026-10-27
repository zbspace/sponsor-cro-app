<template>
  <bottom-sheet :visible="visible" :z-index="9999" @close="close">
    <view class="vip-expired-content">
      <view class="modal-head-row">
        <view class="modal-title-wrap">
          <text class="modal-title">你的试用VIP名额已经用完</text>
          <text class="modal-sub">继续使用，需要开通会员</text>
        </view>
        <view class="modal-close" @click="close"><text>×</text></view>
      </view>

      <view class="popup-body"></view>

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
    padding: 56rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex-direction: column;

    .modal-head-row {
      display: flex;
      align-items: center;
      gap: 20rpx;
      padding-bottom: 20rpx;

      .modal-title-wrap {
        flex: 1;
        min-width: 0;
      }

      .modal-title {
        display: block;
        font-size: 32rpx;
        font-weight: 600;
        color: #1f2329;
      }

      .modal-sub {
        display: block;
        margin-top: 4rpx;
        font-size: 22rpx;
        color: #9ca3af;
      }

      .modal-close {
        width: 60rpx;
        height: 60rpx;
        flex-shrink: 0;
        border-radius: 50%;
        background: #f7f8fa;
        color: #6b7280;
        font-size: 40rpx;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;

        &:active {
          background: #eceef1;
        }
      }
    }

    .popup-body {
      flex: 1;
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
