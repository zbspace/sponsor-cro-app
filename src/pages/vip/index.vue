<template>
  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <view class="container">
    <!-- 用户资料 -->
    <view class="user-card">
      <view class="user-info">
        <button
          class="avatar-wrapper"
          open-type="chooseAvatar"
          @chooseavatar="onChooseAvatar"
          @click="handleAvatarClick"
        >
          <image
            class="avatar"
            v-if="userInfo?.avatarUrl"
            :src="userInfo?.avatarUrl"
            mode="aspectFill"
          />
          <image
            style="width: 100rpx; height: 100rpx"
            class="avatar"
            v-else
            src="../../static/icons/default-avatar-1.png"
            mode="aspectFill"
          />
        </button>
        <view class="details">
          <text class="phone">{{ userInfo?.nickname || '微信用户' }}</text>
          <view class="vip-status">
            <image
              style="width: 28rpx; height: 28rpx"
              class="avatar"
              src="../../static/icons/vip-1.png"
              mode="aspectFill"
            />
            <text class="status">
              {{ userInfo?.vip ? 'VIP有效期至：' + userInfo?.vipExpirationTime : '暂未开通VIP' }}
            </text>
          </view>
        </view>
      </view>
      <!-- <button class="open-btn" v-if="!userInfo?.vip">立即开通</button> -->
    </view>

    <!-- 会员选项 -->
    <view class="options-container">
      <text class="section-title">选择会员时长</text>

      <view
        v-for="option in vipOptions"
        :key="option.vipLevel"
        class="option"
        :class="{ active: selectedVipLevel === option.vipLevel }"
        @click="selectedVipLevel = option.vipLevel"
      >
        <view class="option-name-wrapper">
          <text class="option-name">{{ option.vipName }}</text>
          <text class="tag" v-if="option.vipLabel">{{ option.vipLabel }}</text>
        </view>
        <view class="price-wrapper">
          <text class="option-price">￥</text>
          <text class="price-num">
            {{ (option.vipPrice / 100).toFixed(1).replace(/\.0$/, '') }}
          </text>
        </view>
      </view>

      <text class="note">注：需要发票可在首页点击”联系我们”</text>
    </view>

    <!-- 底部 -->
    <view class="footer">
      <view class="agreement">
        <view class="checkbox" :class="{ checked: isAgreed }" @click="isAgreed = !isAgreed"></view>
        <text class="agree-text">
          点击立即充值，代表您同意并接受
          <text class="link" @click="showAgreement = true">《充值服务协议》</text>
        </text>
      </view>
      <button class="pay-btn" @click="handlePay" v-if="!userInfo?.vip">立即支付</button>
      <button class="pay-btn" @click="handlePay" v-else>立即续费</button>
    </view>

    <!-- 协议弹窗 -->
    <view
      class="modal-mask"
      v-if="showAgreement"
      @click="showAgreement = false"
      @touchmove.stop.prevent=""
    >
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <text class="modal-title">VIP 会员服务协议</text>
          <text class="close-icon" @click="showAgreement = false">×</text>
        </view>
        <scroll-view scroll-y class="modal-body" :show-scrollbar="false">
          <text class="agreement-text">{{ agreementText }}</text>
        </scroll-view>
        <view class="modal-footer">
          <button class="confirm-btn" @click="showAgreement = false">已阅读并同意</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, onMounted } from 'vue'
  import {
    getVipList,
    getVirtualPayData,
    renewVipAndRecordOrder,
    getUserInfo,
    setUserInfo
  } from '@/api'
  import type { UserInfo, VipOption } from '@/types/api'
  import { agreementText } from './agreement'
  // #endregion

  // #region 状态
  const isAgreed = ref(false)
  const userInfo = ref<UserInfo | null>(null)
  const showAgreement = ref(false)

  const vipOptions = ref<VipOption[]>([])
  const selectedVipLevel = ref<number>(1)
  // #endregion

  // #region 方法
  const updateAvatar = (avatarUrl: string) => {
    const currentInfo = userInfo.value || { token: '', vip: false, vipExpirationTime: '' }
    const newUserInfo = { ...currentInfo, avatarUrl }
    setUserInfo(newUserInfo)
    userInfo.value = newUserInfo
    uni.showToast({
      title: '头像已更新',
      icon: 'none'
    })
  }

  const onChooseAvatar = (e: any) => {
    const { avatarUrl } = e.detail
    updateAvatar(avatarUrl)
  }

  const handleAvatarClick = () => {
    // #ifndef MP-WEIXIN
    uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        updateAvatar(res.tempFilePaths[0])
      }
    })
    // #endif
  }

  const handlePay = async () => {
    if (!isAgreed.value) {
      uni.showToast({
        title: '请先同意充值服务协议',
        icon: 'none'
      })
      return
    }

    if (vipOptions.value.length === 0) {
      uni.showToast({
        title: '暂无可选套餐',
        icon: 'none'
      })
      return
    }

    uni.showLoading({ title: '准备支付...' })

    try {
      // 1. 获取微信登录 code
      const loginRes = await uni.login()
      const jsCode = loginRes.code
      if (!jsCode) {
        throw new Error('获取微信登录凭证失败')
      }

      // 2. 获取支付验签数据
      const vipLevel = selectedVipLevel.value
      // 3. 获取设备类型
      const deviceType = uni.getSystemInfoSync().platform === 'android' ? 'Android' : 'IOS'
      const payRes = await getVirtualPayData(vipLevel, jsCode, deviceType)
      if (payRes.code !== 200) {
        throw new Error(payRes.msg || '获取支付参数失败')
      }

      const payData = payRes.data

      // 3. 调用微信虚拟支付
      await new Promise((resolve, reject) => {
        // @ts-ignore - wx.requestVirtualPayment 仅在微信小程序环境可用
        wx.requestVirtualPayment({
          signData: payData.signData,
          paySig: payData.paySig,
          signature: payData.signature,
          mode: payData.mode,
          success: resolve,
          fail: reject
        })
      })

      // 4. 查询订单状态并续期VIP
      const renewRes = await renewVipAndRecordOrder(payData.outTradeNo, deviceType)
      if (renewRes.code === 200 && renewRes.data) {
        uni.showToast({
          title: '支付成功，已开通VIP',
          icon: 'success'
        })
        // 更新本地 VIP 状态
        if (userInfo.value) {
          const newUserInfo = {
            ...userInfo.value,
            vip: renewRes.data.vip,
            vipExpirationTime: renewRes.data.vipExpirationTime
          }
          setUserInfo(newUserInfo)
          userInfo.value = newUserInfo
        }
      } else {
        throw new Error(renewRes.msg || 'VIP续期失败')
      }
    } catch (error: any) {
      console.error('支付失败:', error)
      if (error.errMsg && error.errMsg.includes('cancel')) {
        uni.showToast({ title: '支付已取消', icon: 'none' })
      } else {
        uni.showToast({
          title: error.message || '支付失败',
          icon: 'none'
        })
      }
    } finally {
      uni.hideLoading()
    }
  }

  onMounted(async () => {
    userInfo.value = getUserInfo()
    try {
      const res = await getVipList()
      vipOptions.value = res.data
      if (res.data.length > 0) {
        selectedVipLevel.value = res.data[0].vipLevel
      }
    } catch (err) {
      console.error('获取VIP列表失败', err)
    }
  })
  // #endregion
</script>

<style scoped lang="scss">
  /* #region 基础样式 */
  .container {
    min-height: 100vh;
    background-color: #f5f7fa;
    display: flex;
    flex-direction: column;
    padding: 30rpx;
  }
  /* #endregion */

  /* #region 用户资料 */
  .user-card {
    // margin: 40rpx;
    background: linear-gradient(135deg, #4a4a6a, #2c2c40);
    border-radius: 24rpx;
    padding: 40rpx 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
    margin-bottom: 24rpx;
  }
  .user-info {
    display: flex;
    align-items: center;
  }
  .avatar-wrapper {
    width: 100rpx;
    height: 100rpx;
    padding: 0;
    margin: 0;
    margin-right: 30rpx;
    border-radius: 50rpx;
    background: none;
    line-height: 1;
  }
  .avatar-wrapper::after {
    border: none;
  }
  .avatar {
    width: 100rpx;
    height: 100rpx;
    border-radius: 50rpx;
  }
  .details {
    display: flex;
    flex-direction: column;
    .vip-status {
      display: flex;
      align-items: center;
      gap: 10rpx;
    }
  }
  .phone {
    font-size: 28rpx;
    font-weight: bold;
    margin-bottom: 10rpx;
  }
  .status {
    font-weight: normal;
    font-size: 20rpx;
    color: #fcffe9;
  }
  .open-btn {
    background-color: #f59e0b;
    color: white;
    font-size: 24rpx;
    padding: 10rpx 30rpx;
    border-radius: 30rpx;
    margin: 0;
  }
  /* #endregion */

  /* #region 会员选项 */
  .options-container {
    background: #ffffff;
    border-radius: 20rpx 20rpx 20rpx 20rpx;
    border: 2rpx solid #eeeeee;
    padding: 30rpx;
  }
  .section-title {
    display: block;
    font-weight: bold;
    font-size: 28rpx;
    color: #333333;
    line-height: 52rpx;
    margin-bottom: 28rpx;
  }
  .option {
    background-color: white;
    border-radius: 24rpx;
    padding: 40rpx 30rpx;
    margin-bottom: 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f9f9f9;
    border-radius: 16rpx 16rpx 16rpx 16rpx;
    border: 3rpx solid #e7e7e7;

    .price-wrapper {
      display: flex;
      align-items: center;
      gap: 4rpx;
      .option-price {
        font-weight: 400;
        font-size: 24rpx;
        color: #7c5013;
        line-height: 24rpx;
        display: flex;
        align-items: center;
      }
      .price-num {
        font-weight: 600;
        font-size: 44rpx;
        color: #7c5013;
        line-height: 28rpx;
      }
    }
  }
  .option.active {
    background: linear-gradient(141deg, #fee1b2 0%, #fef4d9 100%);
    border: 3rpx solid #ddb56f;

    color: #7c5013;
  }
  .option-name {
    font-size: 32rpx;
    color: #333;
  }
  .option-name-wrapper {
    display: flex;
    align-items: center;
  }
  .tag {
    background-color: #ef4444;
    color: white;
    font-size: 20rpx;
    padding: 4rpx 12rpx;
    border-radius: 20rpx;
    margin-left: 16rpx;
  }

  .note {
    font-weight: 400;
    font-size: 24rpx;
    color: #df5a67;
    line-height: 36rpx;
    text-align: left;
    font-style: normal;
  }
  /* #endregion */

  /* #region 底部 */
  .footer {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;

    background: #ffffff;
    box-shadow: 0rpx -1rpx 0rpx 2rpx #e8e8e8;
    border-radius: 0rpx 0rpx 0rpx 0rpx;
    padding: 20rpx 40rpx;
  }
  .agreement {
    display: flex;
    margin-bottom: 30rpx;
    align-items: center;
    justify-content: center;
  }
  .checkbox {
    width: 32rpx;
    height: 32rpx;
    border: 2rpx solid #ccc;
    border-radius: 16rpx;
    margin-right: 16rpx;
    margin-top: 4rpx;
    flex-shrink: 0;
  }
  .checkbox.checked {
    background-color: #f59e0b;
    border-color: #f59e0b;
    position: relative;
  }
  .checkbox.checked::after {
    content: '';
    position: absolute;
    width: 16rpx;
    height: 8rpx;
    border-left: 4rpx solid white;
    border-bottom: 4rpx solid white;
    transform: rotate(-45deg);
    top: 8rpx;
    left: 6rpx;
  }
  .agree-text {
    font-weight: 400;
    font-size: 24rpx;
    line-height: 40rpx;
    text-align: left;
    font-style: normal;
  }
  .link {
    color: #cb9964;
  }
  .pay-btn {
    background: linear-gradient(270deg, #f4bc8d 0%, #f9d09b 100%);
    border-radius: 46rpx 46rpx 46rpx 46rpx;
    font-weight: bold;
    font-size: 32rpx;
    color: #5c1f00;
    line-height: 18rpx;
    font-style: normal;
    padding: 24rpx;
    text-align: center;
    height: 92rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 60rpx;
  }
  /* #endregion */

  /* #region 弹窗样式 */
  .modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }
  .modal-content {
    width: 85%;
    max-height: 80vh;
    background-color: white;
    border-radius: 32rpx;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .modal-header {
    padding: 40rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2rpx solid #eee;
  }
  .modal-title {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
  .close-icon {
    font-size: 48rpx;
    color: #999;
    padding: 0 20rpx;
  }
  .modal-body {
    flex: 1;
    padding: 40rpx;
    // overflow-y: auto;
    height: 800rpx;
  }
  .agreement-text {
    font-size: 28rpx;
    color: #666;
    line-height: 1.8;
    white-space: pre-wrap;
  }
  .modal-footer {
    padding: 40rpx;
    border-top: 2rpx solid #eee;
  }
  .confirm-btn {
    background-color: #f59e0b;
    color: white;
    border-radius: 50rpx;
    font-size: 32rpx;
  }
  /* #endregion */
</style>
