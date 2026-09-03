<template>
  <view class="trial-popup-mask" v-if="visible" @click="close" @touchmove.stop.prevent>
    <view class="trial-popup-content" @click.stop>
      <view class="popup-header">
        <text class="popup-title">申请试用</text>
        <view class="close-btn" @click="close">
          <image class="close-icon" src="../../static/icons/close.png" mode="aspectFit" />
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

      <view class="pending-tip" v-if="applicationStatus === 1">
        <text>您已提交申请，请耐心等待审核</text>
      </view>
      <view class="pending-tip" v-else-if="applicationStatus === 2">
        <text>您的试用申请已通过，请直接使用</text>
      </view>
      <view class="submit-btn" v-else @click="handleSubmit">
        <text>申请</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { reactive, ref, watch } from 'vue'
  import { applyVip } from '@/api'
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
  // 申请状态：0-无记录/可申请，1-待审批，2-审批通过，3-审批不通过
  const applicationStatus = ref(0)
  // #endregion

  // #region 监听
  watch(
    () => props.visible,
    (val) => {
      if (val) {
        // 打开时查询申请状态，决定是否显示申请按钮
      } else {
        // 关闭时重置表单
        formData.name = ''
        formData.phone = ''
        formData.company = ''
        formData.position = ''
        applicationStatus.value = 0
      }
    }
  )
  // #endregion

  // #region 方法
  function close() {
    emit('update:visible', false)
  }

  async function handleSubmit() {
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

    // 调用申请试用接口
    uni.showLoading({ title: '提交中...' })
    try {
      await applyVip({
        userName: formData.name.trim(),
        userPhone: formData.phone.trim(),
        userCompany: formData.company.trim(),
        userPosition: formData.position.trim()
      })
      uni.hideLoading()
      uni.showToast({
        title: '申请已提交，请等待审核',
        icon: 'success'
      })
      close()
    } catch {
      // 请求失败时接口层已弹出错误提示，这里只需关闭加载框
      uni.hideLoading()
    }
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
        font-weight: bold;
        font-size: 28rpx;
        color: #293959;
        line-height: 52rpx;
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
      width: 266rpx;
      height: 100rpx;
      background: linear-gradient(90deg, #4295f3 0%, #2b66ef 100%);
      border-radius: 20rpx 20rpx 20rpx 20rpx;
      display: flex;
      justify-content: center;
      align-items: center;
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

    .pending-tip {
      width: 280rpx;
      min-height: 88rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto;

      text {
        font-size: 26rpx;
        color: #999999;
        line-height: 1.5;
        text-align: center;
      }
    }
  }
</style>
