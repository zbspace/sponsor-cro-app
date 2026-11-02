<template></template>

<script setup lang="ts">
  import { onShow } from '@dcloudio/uni-app'
  import { refreshUserDetail } from '@/api'

  // 每次进入小程序（冷启动 / 从后台切回）同步一次用户信息，
  // 保证会员状态等可能已在服务端变更的数据及时更新
  onShow(() => {
    refreshUserDetail()
  })
</script>

<style lang="scss">
  /* #region 全局样式 */
  view,
  text,
  scroll-view,
  button {
    box-sizing: border-box;
  }

  page {
    height: 100%;
    background-color: #f5f7fa;
    font-family:
      'Microsoft YaHei',
      '微软雅黑',
      'PingFang SC',
      -apple-system,
      BlinkMacSystemFont,
      'Helvetica Neue',
      sans-serif;
  }
  /* #endregion */

  .header {
    display: flex;
    justify-content: space-between;
    flex-shrink: 0;
    align-items: center;
    position: relative;
    width: 100%;
    padding: 0 30rpx;

    .nav-left {
      display: flex;
      align-items: center;

      .back-icon {
        width: 64rpx;
        height: 64rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 8rpx;

        .arrow {
          width: 24rpx;
          height: 24rpx;
          border-left: 4rpx solid #000;
          border-bottom: 4rpx solid #000;
          transform: rotate(45deg);
        }
      }

      .progress-text {
        font-size: 28rpx;
        color: #666;
      }
    }

    /* #region 会员标签：配色与规格对齐原型 trial-tag */
    .vip-btn-wrapper {
      background: linear-gradient(120deg, #ffa940, #ff7e2d);
      color: #fff;
      padding: 8rpx 24rpx;
      border-radius: 28rpx;
      font-weight: 600;
      font-size: 22rpx;
      display: flex;
      align-items: center;
      gap: 10rpx;
      .vip-btn-img {
        width: 27rpx;
        height: 23rpx;
      }
    }

    .vip-badge {
      background: linear-gradient(120deg, #2bd8a0, #0fae7a);
      color: #fff;
      padding: 8rpx 24rpx;
      border-radius: 28rpx;
      font-weight: 600;
      font-size: 22rpx;
      display: flex;
      align-items: center;
    }
    /* #endregion */
    .title {
      font-family:
        PingFang SC,
        PingFang SC;
      font-weight: 400;
      font-size: 32rpx;
      color: #000000;
      position: absolute;
      left: 80px;
      right: 80px;
      text-align: center;
    }
  }

  .bg-img {
    width: 100%;
    height: 666rpx;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: -1;
  }

  .container {
    padding: 60rpx 30rpx 0rpx 30rpx;
  }

  .arrow-right-icon {
    width: 14rpx;
    height: 14rpx;
    border-top: 3rpx solid #cccccc;
    border-right: 3rpx solid #cccccc;
    transform: rotate(45deg);
  }
  .arrow-right-icon-white {
    width: 14rpx;
    height: 14rpx;
    border-top: 3rpx solid #fff;
    border-right: 3rpx solid #fff;
    transform: rotate(45deg);
  }

  .close-icon {
    width: 36rpx;
    height: 36rpx;
  }

  .visibility-hidden {
    visibility: hidden;
  }
</style>
