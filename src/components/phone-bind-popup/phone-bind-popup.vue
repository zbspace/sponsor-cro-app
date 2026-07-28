<template>
  <!-- #region 手机号绑定弹窗 -->
  <view class="phone-overlay" v-if="visible">
    <view class="phone-modal">
      <text class="modal-title">绑定手机号</text>
      <text class="modal-desc">为保障账号安全，请绑定手机号</text>
      <button class="bind-btn" open-type="getPhoneNumber" @getphonenumber="onGetPhoneNumber">
        授权手机号
      </button>
    </view>
  </view>
  <!-- #endregion -->
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, onMounted } from 'vue'
  import { ensureLogin, getUserInfo, setUserInfo, bandPhone } from '@/api'
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
  async function checkAndShowBindModal() {
    try {
      await ensureLogin()
      const userInfo = getUserInfo()
      if (userInfo && !userInfo.phone) {
        visible.value = true
      }
    } catch (err) {
      console.error('Phone check error:', err)
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
  .phone-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;

    .phone-modal {
      width: 560rpx;
      background: #fff;
      border-radius: 24rpx;
      padding: 60rpx 40rpx;
      display: flex;
      flex-direction: column;
      align-items: center;

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
        height: 88rpx;
        background: #499ae6;
        color: #fff;
        font-size: 32rpx;
        border-radius: 44rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        border: none;

        &::after {
          border: none;
        }
      }
    }
  }
  /* #endregion */
</style>
