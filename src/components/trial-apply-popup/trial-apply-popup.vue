<template>
  <bottom-sheet ref="sheetRef" :visible="visible" @close="close">
    <view class="trial-popup-content">
      <view class="modal-head-row">
        <view class="modal-title-wrap">
          <text class="modal-title">申请试用</text>
          <text class="modal-sub">填写信息，提交后工作人员将尽快与您联系</text>
        </view>
        <view class="modal-close" @click="close">
          <text>×</text>
        </view>
      </view>

      <view class="mform">
        <view class="mform-item">
          <text class="mform-label">
            姓名
            <text class="req">*</text>
          </text>
          <input
            class="mform-input"
            type="text"
            v-model="formData.name"
            placeholder="请输入姓名"
            placeholder-style="color: #9CA3AF"
            @keyboardheightchange="onKeyboardHeightChange"
          />
        </view>
        <view class="mform-item">
          <text class="mform-label">
            电话
            <text class="req">*</text>
          </text>
          <input
            class="mform-input"
            type="number"
            maxlength="11"
            v-model="formData.phone"
            placeholder="请输入手机号"
            placeholder-style="color: #9CA3AF"
            @keyboardheightchange="onKeyboardHeightChange"
          />
        </view>
        <view class="mform-item">
          <text class="mform-label">
            公司
            <text class="req">*</text>
          </text>
          <input
            class="mform-input"
            type="text"
            v-model="formData.company"
            placeholder="请输入公司名称"
            placeholder-style="color: #9CA3AF"
            @keyboardheightchange="onKeyboardHeightChange"
          />
        </view>
        <view class="mform-item">
          <text class="mform-label">
            职位
            <text class="req">*</text>
          </text>
          <input
            class="mform-input"
            type="text"
            v-model="formData.position"
            placeholder="请输入职位"
            placeholder-style="color: #9CA3AF"
            @keyboardheightchange="onKeyboardHeightChange"
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
  </bottom-sheet>
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

  const emit = defineEmits(['update:visible', 'success'])
  // #endregion

  // #region 键盘避让
  // 弹层容器引用：input 的 keyboardheightchange 事件拿到键盘高度后上报给 bottom-sheet
  const sheetRef = ref<{ setKeyboardHeight: (height: number) => void } | null>(null)

  function onKeyboardHeightChange(e: { detail: { height: number } }) {
    sheetRef.value?.setKeyboardHeight(e.detail?.height || 0)
  }
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
      emit('success')
      close()
    } catch {
      // 请求失败时接口层已弹出错误提示，这里只需关闭加载框
      uni.hideLoading()
    }
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .trial-popup-content {
    width: 100%;
    min-height: 35vh;
    max-height: 80vh;
    background: #ffffff;
    border-radius: 40rpx 40rpx 0 0;
    padding: 56rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
    position: relative;
    box-sizing: border-box;
  }

  /* #region 头部 */
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
  /* #endregion */

  /* #region 表单 */
  .mform {
    padding-top: 4rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;

    .mform-item {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
    }

    .mform-label {
      font-size: 26rpx;
      color: #6b7280;
      font-weight: 500;

      .req {
        color: #f0483e;
        margin-left: 4rpx;
      }
    }

    .mform-input {
      height: 88rpx;
      border: 2rpx solid #e3e7ec;
      border-radius: 20rpx;
      padding: 0 24rpx;
      font-size: 28rpx;
      color: #1f2329;
      background: #ffffff;
      box-sizing: border-box;
    }
  }
  /* #endregion */

  .submit-btn {
    width: 100%;
    height: 92rpx;
    margin-top: 24rpx;
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
</style>
