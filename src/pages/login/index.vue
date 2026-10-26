<template>
  <view class="login-page">
    <!-- #region 背景光晕 -->
    <view class="lg-orb lg-orb1"></view>
    <view class="lg-orb lg-orb2"></view>
    <view class="lg-orb lg-orb3"></view>
    <!-- #endregion -->

    <!-- #region 品牌区 -->
    <view class="login-hero">
      <view class="login-logo">
        <image class="login-logo-img" src="/static/login/logo.png" mode="aspectFill" />
      </view>
      <view class="login-title">临研商机宝</view>
      <view class="login-slogan">明析客情 · 稳妥商机</view>
    </view>
    <!-- #endregion -->

    <!-- #region 平台数据 -->
    <view class="lg-stats">
      <view v-for="item in stats" :key="item.label" class="lg-s-item">
        <view class="lg-s-label">
          <view class="lg-s-ico" :style="{ color: item.color }">
            <view class="ico" :class="'ico-' + item.type"></view>
          </view>
          <text>{{ item.label }}</text>
        </view>
        <view class="lg-s-num">
          {{ item.num }}
          <text class="lg-s-plus">+</text>
        </view>
      </view>
    </view>
    <!-- #endregion -->

    <!-- #region 登录操作 -->
    <view class="login-sheet">
      <button class="auth-btn auth-btn-wechat" :disabled="loading" @click="handleLogin">
        <view class="wx-ico"></view>
        <text>{{ loading ? '登录中...' : '微信登录' }}</text>
      </button>
      <view class="auth-agree" @click="toggleAgree">
        <view class="ck" :class="{ on: agreed }">
          <view class="ck-tick"></view>
        </view>
        <text class="auth-agree-text">
          我已阅读并同意
          <text class="link">《用户协议》</text>
          和
          <text class="link">《隐私政策》</text>
        </text>
      </view>
    </view>
    <view class="login-version">数仓医药出品</view>
    <!-- #endregion -->
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { ensureLogin, getUserInfo, resetEnsureLogin } from '@/api'
  // #endregion

  // #region 页面状态
  const agreed = ref(false)
  const loading = ref(false)

  /** 平台覆盖数据（与原型保持一致） */
  const stats = [
    { type: 'building', label: '覆盖药企', num: '6000', color: '#1E6FFF' },
    { type: 'flask', label: '覆盖临床CRO', num: '800', color: '#10B981' },
    { type: 'tube', label: '覆盖实验室', num: '600', color: '#0EA5E9' },
    { type: 'plus', label: '覆盖医院', num: '3000', color: '#F59E0B' },
    { type: 'capsule', label: '覆盖药品', num: '20000', color: '#7E57C2' },
    { type: 'target', label: '商机线索', num: '2000', color: '#EC4899' }
  ]
  // #endregion

  // #region 生命周期
  onLoad(() => {
    // 已登录用户无需停留在登录页
    if (getUserInfo()?.token) {
      uni.reLaunch({ url: '/pages/index/index' })
    }
  })
  // #endregion

  // #region 交互逻辑
  /**
   * 切换协议勾选状态
   */
  function toggleAgree() {
    agreed.value = !agreed.value
  }

  /**
   * 微信登录：校验协议后发起登录，成功进入首页
   */
  async function handleLogin() {
    if (!agreed.value) {
      uni.showToast({ title: '请先阅读并同意《用户协议》和《隐私政策》', icon: 'none' })
      return
    }
    if (loading.value) return

    loading.value = true
    try {
      // 重置登录单例，确保每次点击都重新发起登录
      resetEnsureLogin()
      await ensureLogin()
      if (!getUserInfo()?.token) {
        throw new Error('登录失败')
      }
      // 登录成功后进入完善资料页
      uni.reLaunch({ url: '/pages/profile-setup/index' })
    } catch {
      uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
    } finally {
      loading.value = false
    }
  }
  // #endregion
</script>

<style lang="scss" scoped>
  /* #region 页面容器 */
  .login-page {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
    padding: 40rpx 0 120rpx;
    background: linear-gradient(180deg, #d6e9ff 0%, #e4f1ff 42%, #f5f7fa 100%);
  }
  /* #endregion */

  /* #region 背景光晕 */
  .lg-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  .lg-orb1 {
    width: 520rpx;
    height: 520rpx;
    top: -180rpx;
    right: -160rpx;
    background: radial-gradient(circle, rgba(30, 111, 255, 0.14), transparent 68%);
  }

  .lg-orb2 {
    width: 420rpx;
    height: 420rpx;
    top: 320rpx;
    left: -190rpx;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.1), transparent 68%);
  }

  .lg-orb3 {
    width: 280rpx;
    height: 280rpx;
    top: 180rpx;
    right: 52rpx;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.9), transparent 70%);
  }
  /* #endregion */

  /* #region 品牌区 */
  .login-hero {
    position: relative;
    padding: 84rpx 0 48rpx;
    text-align: center;
    flex-shrink: 0;
  }

  .login-logo {
    width: 160rpx;
    height: 160rpx;
    margin: 0 auto 36rpx;
    border-radius: 48rpx;
    background: #fff;
    overflow: hidden;
    box-shadow:
      0 28rpx 68rpx rgba(30, 111, 255, 0.22),
      0 0 0 12rpx rgba(255, 255, 255, 0.35);
  }

  .login-logo-img {
    width: 100%;
    height: 100%;
    display: block;
  }

  .login-title {
    font-size: 54rpx;
    font-weight: 800;
    color: #0a2540;
    letter-spacing: 6rpx;
  }

  .login-slogan {
    margin-top: 20rpx;
    font-size: 26rpx;
    color: #5a7aa6;
    letter-spacing: 10rpx;
  }
  /* #endregion */

  /* #region 平台数据 */
  .lg-stats {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    margin: 12rpx 44rpx 0;
  }

  .lg-s-item {
    width: calc(50% - 10rpx);
    margin-bottom: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    padding: 28rpx 32rpx 26rpx;
    border-radius: 28rpx;
    background: rgba(255, 255, 255, 0.72);
    box-shadow: 0 4rpx 20rpx rgba(30, 70, 140, 0.06);
    overflow: hidden;
  }

  .lg-s-label {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 24rpx;
    color: #5a7aa6;
    line-height: 1.3;
    white-space: nowrap;
  }

  .lg-s-ico {
    width: 26rpx;
    height: 26rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .lg-s-num {
    font-size: 44rpx;
    font-weight: 800;
    color: #0a2540;
    letter-spacing: 1rpx;
    line-height: 1.1;
  }

  .lg-s-plus {
    font-size: 32rpx;
    font-weight: 700;
    color: #1e6fff;
    margin-left: 2rpx;
  }
  /* #endregion */

  /* #region 数据图标（纯 CSS 绘制） */
  .ico {
    position: relative;
    width: 26rpx;
    height: 26rpx;
  }

  /* 药企：楼宇 */
  .ico-building {
    width: 22rpx;
    height: 24rpx;
    margin: 0 auto;
    border: 3rpx solid currentColor;
    border-radius: 3rpx;

    &::before {
      content: '';
      position: absolute;
      top: 6rpx;
      left: 6rpx;
      width: 4rpx;
      height: 4rpx;
      border-radius: 1rpx;
      background: currentColor;
      box-shadow:
        8rpx 0 0 currentColor,
        0 8rpx 0 currentColor,
        8rpx 8rpx 0 currentColor;
    }
  }

  /* 临床CRO：锥形瓶 */
  .ico-flask {
    &::before {
      content: '';
      position: absolute;
      top: 1rpx;
      left: 11rpx;
      width: 4rpx;
      height: 9rpx;
      background: currentColor;
    }

    &::after {
      content: '';
      position: absolute;
      top: 9rpx;
      left: 2rpx;
      width: 0;
      height: 0;
      border-left: 11rpx solid transparent;
      border-right: 11rpx solid transparent;
      border-bottom: 16rpx solid currentColor;
      border-radius: 0 0 4rpx 4rpx;
    }
  }

  /* 实验室：试管 */
  .ico-tube {
    width: 14rpx;
    height: 24rpx;
    margin: 1rpx auto 0;
    border: 3rpx solid currentColor;
    border-radius: 8rpx;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 8rpx;
      background: currentColor;
      border-radius: 0 0 6rpx 6rpx;
    }

    &::after {
      content: '';
      position: absolute;
      left: -5rpx;
      right: -5rpx;
      top: -6rpx;
      height: 3rpx;
      border-radius: 2rpx;
      background: currentColor;
    }
  }

  /* 医院：十字 */
  .ico-plus {
    &::before {
      content: '';
      position: absolute;
      top: 2rpx;
      left: 10rpx;
      width: 6rpx;
      height: 22rpx;
      border-radius: 3rpx;
      background: currentColor;
    }

    &::after {
      content: '';
      position: absolute;
      top: 10rpx;
      left: 2rpx;
      width: 22rpx;
      height: 6rpx;
      border-radius: 3rpx;
      background: currentColor;
    }
  }

  /* 药品：胶囊 */
  .ico-capsule {
    width: 26rpx;
    height: 16rpx;
    margin: 5rpx auto 0;
    border: 3rpx solid currentColor;
    border-radius: 10rpx;
    transform: rotate(-35deg);

    &::after {
      content: '';
      position: absolute;
      top: -3rpx;
      left: 50%;
      width: 3rpx;
      height: 16rpx;
      margin-left: -2rpx;
      background: currentColor;
    }
  }

  /* 商机线索：同心圆 */
  .ico-target {
    border: 3rpx solid currentColor;
    border-radius: 50%;

    &::before {
      content: '';
      position: absolute;
      top: 5rpx;
      left: 5rpx;
      width: 10rpx;
      height: 10rpx;
      border: 3rpx solid currentColor;
      border-radius: 50%;
    }

    &::after {
      content: '';
      position: absolute;
      top: 10rpx;
      left: 10rpx;
      width: 6rpx;
      height: 6rpx;
      border-radius: 50%;
      background: currentColor;
    }
  }
  /* #endregion */

  /* #region 登录操作 */
  .login-sheet {
    position: relative;
    margin: 48rpx 44rpx 0;
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
    gap: 16rpx;

    &::after {
      border: none;
    }

    &[disabled] {
      opacity: 0.75;
    }
  }

  .auth-btn-wechat {
    background: linear-gradient(135deg, #08d069, #06b35a);
    color: #fff;
    box-shadow: 0 20rpx 48rpx rgba(7, 193, 96, 0.32);
  }

  /* 微信图标（内联 SVG） */
  .wx-ico {
    width: 40rpx;
    height: 40rpx;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTkgNEM1LjcgNCAzIDYuMyAzIDkuMmMwIDEuNi44IDMuMSAyLjIgNC4xTDQuNiAxNmwyLjktMS41Yy41LjEgMSAuMiAxLjUuMi4yIDAgLjQgMCAuNi0uMS0uMi0uNi0uMy0xLjItLjMtMS45IDAtMyAyLjctNS40IDYtNS40aC40QzE0LjcgNS43IDEyLjEgNCA5IDR6IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTE1LjUgOC43Yy0zLjEgMC01LjYgMi4xLTUuNiA0LjggMCAyLjYgMi41IDQuOCA1LjYgNC44LjYgMCAxLjItLjEgMS43LS4zbDIuNCAxLjItLjUtMS42YzEuNC0uOSAyLjEtMi4yIDIuMS0zLjYgMC0yLjctMi41LTQuOC01LjYtNC44eiIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC45Ii8+PC9zdmc+');
    background-size: 100% 100%;
    background-repeat: no-repeat;
  }

  .auth-agree {
    margin-top: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14rpx;
    font-size: 24rpx;
    color: #5a7aa6;
  }

  .auth-agree-text {
    font-size: 24rpx;
    color: #5a7aa6;
  }

  .auth-agree .link {
    color: #1e6fff;
  }

  .ck {
    width: 32rpx;
    height: 32rpx;
    border: 3rpx solid #b9c3d0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    background: transparent;

    &.on {
      background: #1e6fff;
      border-color: #1e6fff;
    }
  }

  .ck-tick {
    width: 14rpx;
    height: 7rpx;
    border-left: 3rpx solid #fff;
    border-bottom: 3rpx solid #fff;
    transform: rotate(-45deg) translate(1rpx, -2rpx);
    opacity: 0;
  }

  .ck.on .ck-tick {
    opacity: 1;
  }

  .login-version {
    position: relative;
    margin-top: 48rpx;
    text-align: center;
    font-size: 24rpx;
    color: #9aa7b8;
    letter-spacing: 2rpx;
  }
  /* #endregion */
</style>
