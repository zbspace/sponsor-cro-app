<template>
  <view
    v-if="visible"
    class="sheet-mask"
    :style="{ zIndex: zIndex }"
    @click="handleMaskClick"
    @touchmove.stop.prevent
  >
    <view class="sheet-panel" @click.stop>
      <view class="sheet-handle"></view>
      <slot />
    </view>
  </view>
</template>

<script setup lang="ts">
  // 暂时关闭与小键盘的联动，相关依赖一并注释
  // import { ref, watch } from 'vue'

  // #region 属性与事件
  const props = withDefaults(
    defineProps<{
      /** 是否显示弹层 */
      visible: boolean
      /** 弹层层级 */
      zIndex?: number
      /** 点击遮罩是否关闭 */
      maskClosable?: boolean
    }>(),
    {
      zIndex: 1000,
      maskClosable: true
    }
  )

  const emit = defineEmits<{ (e: 'close'): void }>()
  // #endregion

  // #region 键盘避让（暂时关闭与小键盘的联动）
  // 弹层为 fixed 定位，键盘弹起时会遮挡底部内容，原逻辑会整体上推键盘的高度。
  // 现暂时注释掉该联动，仅保留 setKeyboardHeight 供子组件调用（空实现），避免子组件调用报错。
  // import { ref, watch } from 'vue'
  // const keyboardHeight = ref(0)

  // /** 由子组件（input 的 keyboardheightchange）上报键盘高度，单位 px，收起时传 0 */
  // function setKeyboardHeight(height: number) {
  //   keyboardHeight.value = height > 0 ? height : 0
  // }

  // // 关闭弹层时重置，避免下次打开时残留偏移
  // watch(
  //   () => props.visible,
  //   (val) => {
  //     if (!val) keyboardHeight.value = 0
  //   }
  // )

  function setKeyboardHeight(_height: number) {}

  defineExpose({ setKeyboardHeight })
  // #endregion

  // #region 方法
  function handleMaskClick() {
    if (props.maskClosable) {
      emit('close')
    }
  }
  // #endregion
</script>

<style lang="scss" scoped>
  /* #region 遮罩与面板 */
  .sheet-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.52);
    display: flex;
    align-items: flex-end;
    animation: sheet-fade-in 0.22s ease;
    // 暂时关闭与小键盘的联动
    // transition: padding-bottom 0.2s ease;
  }

  .sheet-panel {
    position: relative;
    width: 100%;
    animation: sheet-slide-up 0.26s cubic-bezier(0.32, 0.72, 0.24, 1);
  }

  .sheet-handle {
    position: absolute;
    top: 20rpx;
    left: 50%;
    width: 72rpx;
    height: 8rpx;
    margin-left: -36rpx;
    border-radius: 4rpx;
    background: #e3e7ec;
    z-index: 2;
  }
  /* #endregion */

  /* #region 动画 */
  @keyframes sheet-fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes sheet-slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
  /* #endregion */
</style>
