<template>
  <!-- #region 手机号绑定弹窗 -->
  <bottom-sheet :visible="visible" :z-index="9999" :mask-closable="false">
    <view class="phone-modal">
      <text class="modal-title">绑定手机号</text>
      <text class="modal-desc">为保障账号安全，请绑定手机号</text>
      <button class="bind-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
        授权手机号
      </button>
    </view>
  </bottom-sheet>
  <!-- #endregion -->
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, onMounted } from 'vue'
  import { getUserInfo, setUserInfo, bandPhone } from '@/api'
  // #endregion

  // #region 状态
  const visible = ref(false)
  // #endregion

  // #region 生命周期
  onMounted(() => {
    checkAndShowBindModal()
  })
  // #endregion

  // #region 方法

  /**
   * 检查用户手机号状态，未绑定则弹出弹窗
   */
  function checkAndShowBindModal() {
    const userInfo = getUserInfo()
    if (userInfo && !userInfo.phone) {
      visible.value = true
    }
  }

  /**
   * 处理微信手机号授权回调
   */
  async function onGetPhoneNumber(e: any) {
    if (e.detail.code) {
      try {
        await bandPhone(e.detail.code)
        // 绑定成功后更新本地用户信息，标记手机号已绑定
        const userInfo = getUserInfo()
        if (userInfo) {
          setUserInfo({ ...userInfo, phone: 'bound' })
        }
        visible.value = false
        uni.showToast({ title: '手机号绑定成功', icon: 'success' })
      } catch {
        uni.showToast({ title: '绑定失败，请重试', icon: 'none' })
      }
    } else {
      // 用户拒绝授权时仍保留弹窗，不允许跳过
      uni.showToast({ title: '请授权手机号以继续使用', icon: 'none' })
    }
  }
  // #endregion
</script>

<style lang="scss" scoped>
  /* #region 手机号绑定弹窗 */
  .phone-modal {
    width: 100%;
    min-height: 520rpx;
    max-height: 80vh;
    background: #fff;
    border-radius: 40rpx 40rpx 0 0;
    padding: 60rpx 48rpx calc(60rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;

    .modal-title {
      font-size: 36rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 20rpx;
    }

    .modal-desc {
      font-size: 28rpx;
      color: #999;
      margin-bottom: 60rpx;
    }

    .bind-btn {
      width: 100%;
      height: 92rpx;
      background: linear-gradient(135deg, #3d7bff 0%, #1e5fff 100%);
      color: #fff;
      font-size: 32rpx;
      font-weight: 600;
      border-radius: 46rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      border: none;
      box-shadow: 0 16rpx 36rpx rgba(30, 95, 255, 0.3);

      &::after {
        border: none;
      }
    }
  }
  /* #endregion */
</style>
