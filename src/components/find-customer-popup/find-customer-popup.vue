<template>
  <view class="find-popup-mask" v-if="visible" @click="close" @touchmove.stop.prevent>
    <view class="find-popup-content" @click.stop>
      <view class="popup-header">
        <text class="popup-title">找客户</text>
        <view class="close-btn" @click="close">
          <image class="close-icon" src="../../static/icons/close.png" mode="aspectFit" />
        </view>
      </view>

      <view class="form-section">
        <view class="input-item">
          <input
            type="text"
            v-model="formData.indication"
            placeholder="输入适应症"
            placeholder-style="color: #B2B2B2"
          />
        </view>
        <view class="input-item">
          <input
            type="text"
            v-model="formData.drugName"
            placeholder="输入及选择药品名称"
            placeholder-style="color: #B2B2B2"
          />
        </view>
      </view>

      <view class="search-btn" @click="handleSearch">
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
    indication: '',
    drugName: ''
  })
  // #endregion

  // #region 监听
  watch(
    () => props.visible,
    (val) => {
      if (!val) {
        // 关闭时重置表单
        formData.indication = ''
        formData.drugName = ''
      }
    }
  )
  // #endregion

  // #region 方法
  function close() {
    emit('update:visible', false)
  }

  function handleSearch() {
    if (!formData.indication && !formData.drugName) {
      uni.showToast({ title: '请填写搜索条件', icon: 'none' })
      return
    }

    const query = `indication=${encodeURIComponent(formData.indication)}&drugName=${encodeURIComponent(formData.drugName)}`
    uni.navigateTo({
      url: `/pages/customer/matching-degree?${query}`
    })
    close()
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .find-popup-mask {
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

  .find-popup-content {
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

    .search-btn {
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
  }
</style>
