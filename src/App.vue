<script setup lang="ts">
  // #region 导入
  import { onShow } from '@dcloudio/uni-app'
  import { ensureLogin, resetEnsureLogin } from '@/api'
  // #endregion

  // #region 生命周期
  onShow(() => {
    resetEnsureLogin()
    ensureLogin().catch((err) => {
      console.error('App login error:', err)
    })
  })
  // #endregion
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

    .vip-btn-wrapper {
      background: linear-gradient(90deg, #ec7e62 0%, #f0a755 100%);
      color: #fff;
      padding: 12rpx 16rpx;
      border-radius: 40rpx;
      font-weight: bold;
      font-size: 24rpx;
      display: flex;
      align-items: center;
      gap: 10rpx;
      .vip-btn-img {
        width: 27rpx;
        height: 23rpx;
      }
    }

    .vip-badge {
      background: linear-gradient(135deg, #2c2c40, #4a4a6a);
      color: #f59e0b;
      padding: 8rpx 24rpx;
      border-radius: 40rpx;
      font-size: 28rpx;
      display: flex;
      align-items: center;
      border: 2rpx solid rgba(245, 158, 11, 0.3);

      .vip-badge-icon {
        width: 36rpx;
        height: 36rpx;
        margin-right: 12rpx;
      }
    }
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
    height: 646rpx;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: -1;
  }

  .container {
    padding: 90rpx 30rpx 30rpx 30rpx;
  }

  .arrow-right-icon {
    width: 14rpx;
    height: 14rpx;
    border-top: 3rpx solid #cccccc;
    border-right: 3rpx solid #cccccc;
    transform: rotate(45deg);
  }
</style>
