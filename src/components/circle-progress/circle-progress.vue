<template>
  <view
    class="circle-container"
    :style="{
      width: size + 'px',
      height: size + 'px',
      marginBottom: marginBottom + 'px'
    }"
  >
    <canvas
      type="2d"
      :id="canvasId"
      class="progress-canvas"
      :style="{ width: size + 'px', height: size + 'px' }"
    ></canvas>
    <view
      class="circle-text"
      :style="{ color: textColor, width: size + 'px', height: size + 'px' }"
    >
      <slot>{{ text }}</slot>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { onMounted, getCurrentInstance, watch, nextTick } from 'vue'

  const props = defineProps({
    canvasId: {
      type: String,
      required: true
    },
    percent: {
      type: Number,
      default: 0
    },
    color: {
      type: String,
      default: '#499AE6'
    },
    text: {
      type: String,
      default: ''
    },
    textColor: {
      type: String,
      default: '#333'
    },
    size: {
      type: Number,
      default: 56
    },
    lineWidth: {
      type: Number,
      default: 4
    },
    marginBottom: {
      type: Number,
      default: 8
    }
  })

  const instance = getCurrentInstance()
  let canvas: any = null
  let ctx: any = null

  const initCanvas = () => {
    return new Promise((resolve) => {
      const query = uni.createSelectorQuery().in(instance?.proxy)
      query
        .select('#' + props.canvasId)
        .fields({ node: true, size: true }, () => {})
        .exec((res) => {
          if (!res[0] || !res[0].node) {
            resolve(false)
            return
          }
          canvas = res[0].node
          ctx = canvas.getContext('2d')

          // 处理高清屏适配
          const dpr = uni.getSystemInfoSync().pixelRatio
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)
          resolve(true)
        })
    })
  }

  const drawProgress = async () => {
    if (!ctx) {
      const success = await initCanvas()
      if (!success) return
    }

    const center = props.size / 2
    const radius = center - props.lineWidth / 2

    // 清空画布
    ctx.clearRect(0, 0, props.size, props.size)

    // 绘制背景圆环
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = '#eeeeee'
    ctx.lineWidth = props.lineWidth
    ctx.stroke()

    // 绘制进度圆环
    if (props.percent > 0) {
      ctx.beginPath()
      ctx.arc(
        center,
        center,
        radius,
        -0.5 * Math.PI,
        (2 * Math.PI * props.percent) / 100 - 0.5 * Math.PI
      )
      ctx.strokeStyle = props.color
      ctx.lineWidth = props.lineWidth
      ctx.lineCap = 'round'
      ctx.stroke()
    }
  }

  onMounted(() => {
    nextTick(() => {
      // 加一点延时确保 canvas 已经渲染在页面上
      setTimeout(async () => {
        await drawProgress()
      }, 100)
    })
  })

  watch(
    () => props.percent,
    () => {
      drawProgress()
    }
  )
</script>

<style scoped>
  .circle-container {
    position: relative;
  }
  .circle-text {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: bold;
  }
</style>
