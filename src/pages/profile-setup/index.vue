<!-- 完善资料 -->
<template>
  <view class="profile-page">
    <!-- 头部导航 -->
    <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
      <view class="nav-left" @click="goBack">
        <view class="back-icon">
          <view class="arrow"></view>
        </view>
      </view>
      <text class="title">完善资料</text>
      <view class="nav-right"></view>
    </view>

    <!-- 头像授权 -->
    <view class="ps-head">
      <button
        class="ps-avatar-wrap"
        open-type="chooseAvatar"
        @chooseavatar="onChooseAvatar"
        @click="handleAvatarClick"
      >
        <image v-if="avatarUrl" class="ps-avatar" :src="avatarUrl" mode="aspectFill" />
        <view v-else class="ps-avatar">{{ avatarChar }}</view>
        <view class="ps-avatar-badge">
          <view class="cam-ico"></view>
        </view>
      </button>
      <view class="ps-hint">点击头像可授权使用微信头像</view>
    </view>

    <!-- 昵称 -->
    <view class="ps-form">
      <view class="ps-field">
        <text class="ps-field-label">昵称</text>
        <input
          class="ps-field-input"
          type="nickname"
          v-model="nickname"
          :focus="nicknameFocus"
          maxlength="16"
          placeholder="请输入昵称"
          placeholder-class="ps-placeholder"
          @blur="nicknameFocus = false"
        />
        <text class="ps-fill" @click="useWxNickname">使用微信昵称</text>
      </view>
    </view>

    <!-- 完成 -->
    <view class="ps-actions">
      <button class="auth-btn auth-btn-primary" :disabled="saving" @click="handleDone">
        {{ saving ? '保存中...' : '完成' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { getUserInfo, setUserInfo, updateWxUserInfo } from '@/api'
  // #endregion

  // #region 页面状态
  const menu = ref({ top: 0, left: 0, height: 0 })
  const nickname = ref('')
  const nicknameFocus = ref(false)
  const avatarUrl = ref('')
  const saving = ref(false)

  // 未授权头像时展示昵称首字
  const avatarChar = computed(() => nickname.value.trim().charAt(0) || '临')

  onLoad(() => {
    menu.value = uni.getMenuButtonBoundingClientRect()
    const info = getUserInfo()
    nickname.value = info?.nickname || info?.wxNickname || ''
    avatarUrl.value = info?.avatarUrl || ''
  })
  // #endregion

  // #region 头像授权
  function onChooseAvatar(e: any) {
    const { avatarUrl: url } = e.detail
    if (url) avatarUrl.value = url
  }

  function handleAvatarClick() {
    // #ifndef MP-WEIXIN
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        avatarUrl.value = res.tempFilePaths[0]
      }
    })
    // #endif
  }
  // #endregion

  // #region 昵称
  function useWxNickname() {
    const info = getUserInfo()
    // 登录接口若返回过微信昵称，直接填入
    const wxName = info?.wxNickname || info?.nickname
    if (wxName) {
      nickname.value = wxName
    }
    // 微信不再允许静默获取昵称，聚焦 nickname 类型输入框调起微信昵称联想
    nicknameFocus.value = true
  }
  // #endregion

  // #region 提交
  async function handleDone() {
    const name = nickname.value.trim()
    if (!name) {
      uni.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    if (saving.value) return

    saving.value = true
    try {
      const res = await updateWxUserInfo({
        nickname: name,
        avatar: avatarUrl.value
      })

      const current = getUserInfo()
      if (current) {
        setUserInfo({
          ...current,
          nickname: res.data?.nickname || name,
          avatarUrl: res.data?.avatarUrl || avatarUrl.value || current.avatarUrl
        })
      }

      uni.showToast({ title: '资料已保存', icon: 'none' })
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/index/index' })
      }, 600)
    } catch {
      uni.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
    } finally {
      saving.value = false
    }
  }

  function goBack() {
    uni.navigateBack({
      delta: 1,
      fail: () => uni.reLaunch({ url: '/pages/index/index' })
    })
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .profile-page {
    min-height: 100vh;
    background: #f5f7fa;
  }

  /* #region 头像 */
  .ps-head {
    text-align: center;
    padding: 52rpx 0 12rpx;
  }

  .ps-avatar-wrap {
    position: relative;
    width: 176rpx;
    height: 176rpx;
    margin: 0 auto;
    padding: 0;
    border: none;
    background: transparent;
    line-height: normal;
    overflow: visible;

    &::after {
      border: none;
    }
  }

  .ps-avatar {
    width: 176rpx;
    height: 176rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #2f80ff, #0a57eb);
    color: #ffffff;
    font-size: 68rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 16rpx 40rpx rgba(30, 111, 255, 0.24);
  }

  .ps-avatar-badge {
    position: absolute;
    right: -4rpx;
    bottom: 0;
    width: 52rpx;
    height: 52rpx;
    border-radius: 50%;
    background: #ffffff;
    box-shadow: 0 8rpx 20rpx rgba(15, 23, 42, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* 相机图标（纯 CSS 绘制） */
  .cam-ico {
    position: relative;
    width: 26rpx;
    height: 20rpx;
    border: 3rpx solid #1e6fff;
    border-radius: 4rpx;

    &::before {
      content: '';
      position: absolute;
      top: 3rpx;
      left: 6rpx;
      width: 8rpx;
      height: 8rpx;
      border: 3rpx solid #1e6fff;
      border-radius: 50%;
    }

    &::after {
      content: '';
      position: absolute;
      top: -8rpx;
      left: 5rpx;
      width: 10rpx;
      height: 5rpx;
      border: 3rpx solid #1e6fff;
      border-bottom: none;
      border-radius: 4rpx 4rpx 0 0;
      background: #ffffff;
    }
  }

  .ps-hint {
    margin-top: 24rpx;
    font-size: 24rpx;
    color: #9aa7b8;
  }
  /* #endregion */

  /* #region 表单 */
  .ps-form {
    margin: 40rpx 30rpx 0;
    background: #ffffff;
    border-radius: 32rpx;
    padding: 4rpx 32rpx;
    box-shadow: 0 8rpx 30rpx rgba(30, 70, 140, 0.06);
  }

  .ps-field {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 28rpx 0;
  }

  .ps-field-label {
    width: 120rpx;
    font-size: 28rpx;
    color: #293959;
    flex-shrink: 0;
  }

  .ps-field-input {
    flex: 1;
    min-width: 0;
    font-size: 30rpx;
    color: #293959;
    background: transparent;
  }

  .ps-placeholder {
    color: #9aa7b8;
  }

  .ps-fill {
    font-size: 26rpx;
    color: #1e6fff;
    flex-shrink: 0;
  }
  /* #endregion */

  /* #region 完成按钮 */
  .ps-actions {
    margin: 56rpx 30rpx 0;
  }

  .auth-btn {
    width: 100%;
    height: 100rpx;
    margin: 0;
    padding: 0;
    border: none;
    border-radius: 50rpx;
    font-size: 32rpx;
    font-weight: 600;
    line-height: normal;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      border: none;
    }

    &[disabled] {
      opacity: 0.75;
    }
  }

  .auth-btn-primary {
    background: #1e6fff;
    color: #ffffff;
    box-shadow: 0 20rpx 48rpx rgba(30, 111, 255, 0.28);
  }
  /* #endregion */
</style>
