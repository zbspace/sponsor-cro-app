<template>
  <view class="trial-popup-mask" v-if="visible" @click="close" @touchmove.stop.prevent>
    <view class="trial-popup-content" @click.stop>
      <view class="popup-header">
        <text class="popup-title">申请试用</text>
        <view class="close-btn" @click="close">
          <icon type="clear" size="20" color="#D8D8D8" />
        </view>
      </view>

      <view class="form-section">
        <view class="input-item">
          <input
            type="text"
            v-model="formData.name"
            placeholder="请输入姓名"
            placeholder-style="color: #B2B2B2"
          />
        </view>
        <view class="input-item">
          <input
            type="number"
            v-model="formData.phone"
            placeholder="请输入手机号"
            placeholder-style="color: #B2B2B2"
            maxlength="11"
          />
        </view>
        <view class="input-item">
          <input
            type="text"
            v-model="formData.company"
            placeholder="请输入公司"
            placeholder-style="color: #B2B2B2"
          />
        </view>
        <view class="input-item">
          <input
            type="text"
            v-model="formData.position"
            placeholder="请输入职位"
            placeholder-style="color: #B2B2B2"
          />
        </view>
      </view>

      <view class="submit-btn" @click="handleSubmit">
        <text>搜索</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { reactive, watch } from 'vue'
  // #endregion

  // #region 属性与事件
  const props = defineProps<{
    visible: boolean
  }>()

  const emit = defineEmits(['update:visible'])
  // #endregion

  // #region 状态
  const formData = reactive({
    name: '',
    phone: '',
    company: '',
    position: ''
  })
  // #endregion

  // #region 监听
  watch(
    () => props.visible,
    (val) => {
      if (!val) {
        // 关闭时重置表单
        formData.name = ''
        formData.phone = ''
        formData.company = ''
        formData.position = ''
      }
    }
  )
  // #endregion

  // #region 方法
  function close() {
    emit('update:visible', false)
  }

  function handleSubmit() {
    if (!formData.name.trim()) {
      uni.showToast({ title: '请输入姓名', icon: 'none' })
      return
    }
    if (!formData.phone.trim()) {
      uni.showToast({ title: '请输入手机号', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }
    if (!formData.company.trim()) {
      uni.showToast({ title: '请输入公司', icon: 'none' })
      return
    }
    if (!formData.position.trim()) {
      uni.showToast({ title: '请输入职位', icon: 'none' })
      return
    }

    // 模拟提交逻辑
    uni.showLoading({ title: '提交中...' })
    setTimeout(() => {
      uni.hideLoading()
      uni.showToast({
        title: '申请已提交，请等待审核',
        icon: 'success'
      })
      close()
    }, 1500)
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .trial-popup-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }

  .trial-popup-content {
    width: 600rpx;
    background: #ffffff;
    border-radius: 32rpx;
    padding: 40rpx;
    position: relative;

    .popup-header {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 50rpx;
      position: relative;

      .popup-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }

      .close-btn {
        position: absolute;
        right: -10rpx;
        top: -10rpx;
        padding: 10rpx;
      }
    }

    .form-section {
      margin-bottom: 60rpx;

      .input-item {
        background: #f7f8fa;
        border-radius: 16rpx;
        height: 88rpx;
        padding: 0 30rpx;
        display: flex;
        align-items: center;
        margin-bottom: 30rpx;

        &:last-child {
          margin-bottom: 0;
        }

        input {
          flex: 1;
          font-size: 28rpx;
          color: #333333;
        }
      }
    }

    .submit-btn {
      width: 280rpx;
      height: 88rpx;
      background: linear-gradient(135deg, #60a8ff 0%, #499ae6 100%);
      border-radius: 16rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 8rpx 16rpx rgba(73, 154, 230, 0.3);
      margin: 0 auto;

      text {
        color: #ffffff;
        font-size: 32rpx;
        font-weight: bold;
      }

      &:active {
        opacity: 0.9;
      }
    }
  }
</style>
