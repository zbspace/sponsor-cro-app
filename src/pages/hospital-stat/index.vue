<template>
  <view class="page-wrapper">
    <!-- 头部导航 -->
    <view class="header" :style="{ paddingTop: `${menu.top}px` }">
      <view class="nav-left" @click="goBack">
        <view class="back-icon">
          <view class="arrow"></view>
        </view>
      </view>
      <text class="title">合作情况统计</text>
      <view class="nav-right"></view>
    </view>

    <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

    <scroll-view
      scroll-y
      class="container-scroll-view"
      :show-scrollbar="false"
      enhanced
      :style="{
        height: `calc(100vh - ${menu.top}px - ${menu.height}px)`
      }"
    >
      <view class="container">
        <!-- 选项卡 -->
        <view class="tabs">
          <view
            class="tab-item"
            :class="{ active: activeTab === 'stat' }"
            @click="activeTab = 'stat'"
          >
            <text>统计</text>
            <view class="active-line" v-if="activeTab === 'stat'"></view>
          </view>
          <view
            class="tab-item"
            :class="{ active: activeTab === 'detail' }"
            @click="activeTab = 'detail'"
          >
            <text>详情</text>
            <view class="active-line" v-if="activeTab === 'detail'"></view>
          </view>
        </view>

        <!-- 统计内容 -->
        <view v-if="activeTab === 'stat'" class="stat-content">
          <!-- 汇总统计 -->
          <view class="section-card">
            <view class="section-title">汇总统计</view>
            <view class="summary-cards">
              <view class="summary-card purple">
                <text class="label">合作试验数</text>
                <text class="value">23</text>
                <image class="icon" src="/static/icons/time.png" mode="aspectFit" />
              </view>
              <view class="summary-card blue">
                <text class="label">合作研究者数</text>
                <text class="value">23</text>
                <image class="icon" src="/static/icons/sponsor.png" mode="aspectFit" />
              </view>
              <view class="summary-card cyan">
                <text class="label">合作产品数</text>
                <text class="value">23</text>
                <image class="icon" src="/static/icons/cro.png" mode="aspectFit" />
              </view>
            </view>
          </view>

          <!-- 近五年试验合作变化 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">近五年试验合作变化</view>
              <view class="filter-dropdown">
                <text>注册分类</text>
                <view class="arrow-down"></view>
              </view>
            </view>
            <view class="chart-container line-chart">
              <canvas canvas-id="lineCanvas" id="lineCanvas" class="canvas"></canvas>
            </view>
          </view>

          <!-- 试验分期 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">试验分期</view>
              <view class="filter-dropdown">
                <text>年份</text>
                <view class="arrow-down"></view>
              </view>
            </view>
            <view class="chart-container radar-chart">
              <canvas canvas-id="radarCanvas" id="radarCanvas" class="canvas"></canvas>
            </view>
            <view class="phase-table">
              <view class="table-header">
                <text>1类</text><text>2类</text><text>3类</text><text>4类</text><text>5类</text><text>其他</text>
              </view>
              <view class="table-body">
                <text>1</text><text>4</text><text>12</text><text>12</text><text>4</text><text>0</text>
              </view>
            </view>
          </view>

          <!-- 试验状态 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">试验状态</view>
              <view class="filter-dropdown">
                <text>年份</text>
                <view class="arrow-down"></view>
              </view>
            </view>
            <view class="donut-chart-wrapper">
              <view class="donut-chart" :style="{ background: donutGradient }"></view>
              <view class="legend-grid">
                <view class="legend-item" v-for="(item, index) in statusLegend" :key="index">
                  <view class="dot" :style="{ backgroundColor: item.color }"></view>
                  <text class="name">{{ item.name }}</text>
                  <text class="count">{{ item.count }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 合作产品 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">合作产品</view>
              <view class="filter-dropdown">
                <text>年份</text>
                <view class="arrow-down"></view>
              </view>
            </view>
            <view class="data-table">
              <view class="table-header">
                <text class="col-rank">排名</text>
                <text class="col-name">研究者</text>
                <text class="col-count">临床试验数</text>
              </view>
              <view class="table-body">
                <view class="table-row" v-for="i in 6" :key="i" :class="{ zebra: i % 2 === 0 }">
                  <text class="col-rank">{{ i }}</text>
                  <text class="col-name">研究者</text>
                  <text class="col-count">2</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 合作研究者情况 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">合作研究者情况</view>
            </view>
            <view class="data-table">
              <view class="table-header">
                <text class="col-rank">排名</text>
                <text class="col-name">研究者</text>
                <text class="col-count">临床试验数</text>
              </view>
              <view class="table-body">
                <view class="table-row" v-for="i in 6" :key="i" :class="{ zebra: i % 2 === 0 }">
                  <text class="col-rank">{{ i }}</text>
                  <text class="col-name">研究者</text>
                  <text class="col-count">2</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 详情内容 (复用现有的项目列表样式) -->
        <view v-else class="detail-content">
          <view class="project-card" v-for="i in 5" :key="i">
            <view class="project-title">这是一项关于某种新药的临床试验项目详情标题...</view>
            <view class="info-list">
              <view class="info-item">
                <view class="info-icon time"><image src="../../static/icons/time.png" mode="aspectFit" /></view>
                <text class="info-text">批入时间：2025-07-01</text>
              </view>
              <view class="info-item">
                <view class="info-icon sponsor"><image src="../../static/icons/sponsor.png" mode="aspectFit" /></view>
                <text class="info-text">合作申办方：某某制药有限公司</text>
              </view>
            </view>
            <view class="action-btn">国合审批</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <phone-bind-popup />
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, onMounted } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  // #endregion

  // #region 状态
  const activeTab = ref('stat')
  const menu = ref({ top: 0, left: 0, height: 0 })

  const donutGradient = ref('conic-gradient(#499AE6 0% 12.5%, #7ED321 12.5% 25%, #F5A623 25% 37.5%, #9013FE 37.5% 50%, #F8E71C 50% 62.5%, #D0021B 62.5% 75%, #499AE6 75% 100%)')

  const statusLegend = [
    { name: '进行中-尚未招募', count: 4, color: '#499AE6' },
    { name: '已完成', count: 4, color: '#9013FE' },
    { name: '进行中-招募完成', count: 4, color: '#7ED321' },
    { name: '主动暂停', count: 4, color: '#F8E71C' },
    { name: '进行中-尚未招募', count: 4, color: '#F5A623' },
    { name: '被叫停', count: 4, color: '#D0021B' }
  ]
  // #endregion

  // #region 生命周期
  onLoad(() => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
  })

  onMounted(() => {
    drawCharts()
  })
  // #endregion

  // #region 方法
  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  function drawCharts() {
    // 绘制折线图
    const lineCtx = uni.createCanvasContext('lineCanvas')
    drawLineChart(lineCtx)

    // 绘制雷达图
    const radarCtx = uni.createCanvasContext('radarCanvas')
    drawRadarChart(radarCtx)
  }

  function drawLineChart(ctx: any) {
    const data = [1, 2, 1, 3, 2]
    const years = ['21年', '22年', '23年', '24年', '25年']
    const width = 300
    const height = 150
    const padding = 20

    ctx.setStrokeStyle('#499AE6')
    ctx.setLineWidth(2)
    ctx.beginPath()

    data.forEach((val, i) => {
      const x = padding + (i * (width - 2 * padding)) / (data.length - 1)
      const y = height - padding - (val / 7) * (height - 2 * padding)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.stroke()

    // 绘制渐变区域
    ctx.lineTo(width - padding, height - padding)
    ctx.lineTo(padding, height - padding)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding)
    gradient.addColorStop(0, 'rgba(73, 154, 230, 0.2)')
    gradient.addColorStop(1, 'rgba(73, 154, 230, 0)')
    ctx.setFillStyle(gradient)
    ctx.fill()

    // 绘制点
    data.forEach((val, i) => {
      const x = padding + (i * (width - 2 * padding)) / (data.length - 1)
      const y = height - padding - (val / 7) * (height - 2 * padding)
      ctx.setFillStyle('#ffffff')
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.setStrokeStyle('#499AE6')
      ctx.stroke()
      
      // 绘制年份文字
      ctx.setFillStyle('#999999')
      ctx.setFontSize(10)
      ctx.fillText(years[i], x - 10, height - 5)
    })
    
    // 绘制网格线
    ctx.setStrokeStyle('#eeeeee')
    ctx.setLineWidth(0.5)
    for(let i=0; i<=7; i++) {
        const y = height - padding - (i/7) * (height - 2 * padding)
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(width - padding, y)
        ctx.stroke()
        ctx.fillText(i, 5, y + 5)
    }

    ctx.draw()
  }

  function drawRadarChart(ctx: any) {
    const center = { x: 150, y: 75 }
    const radius = 60
    const sides = 6
    const data = [0.8, 0.9, 0.7, 0.6, 0.8, 0.7]

    // 绘制背景网格
    ctx.setStrokeStyle('#eeeeee')
    for (let r = 1; r <= 5; r++) {
      ctx.beginPath()
      const currentRadius = (radius / 5) * r
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
        const x = center.x + Math.cos(angle) * currentRadius
        const y = center.y + Math.sin(angle) * currentRadius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }

    // 绘制数据区域
    ctx.setFillStyle('rgba(245, 166, 35, 0.3)')
    ctx.setStrokeStyle('#F5A623')
    ctx.beginPath()
    data.forEach((val, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
      const x = center.x + Math.cos(angle) * radius * val
      const y = center.y + Math.sin(angle) * radius * val
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.draw()
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .page-wrapper {
    background: #f8f9fb;
    min-height: 100vh;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx;
    height: 88rpx;
    position: relative;
    z-index: 10;

    .nav-left {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      .back-icon {
        width: 40rpx;
        height: 40rpx;
        .arrow {
          width: 20rpx;
          height: 20rpx;
          border-top: 4rpx solid #333;
          border-left: 4rpx solid #333;
          transform: rotate(-45deg);
        }
      }
    }

    .title {
      font-size: 34rpx;
      font-weight: 500;
      color: #333;
    }

    .nav-right {
      width: 60rpx;
    }
  }

  .bg-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 300rpx;
    z-index: 1;
  }

  .container {
    padding: 30rpx;
    position: relative;
    z-index: 2;
  }

  .tabs {
    display: flex;
    justify-content: center;
    gap: 120rpx;
    margin-bottom: 40rpx;

    .tab-item {
      position: relative;
      font-size: 32rpx;
      color: #999;
      padding-bottom: 12rpx;

      &.active {
        color: #499ae6;
        font-weight: bold;
      }

      .active-line {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 6rpx;
        background: #499ae6;
        border-radius: 3rpx;
      }
    }
  }

  .section-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30rpx;
    }

    .section-title {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      position: relative;
      padding-left: 20rpx;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8rpx;
        height: 24rpx;
        background: #499ae6;
        border-radius: 4rpx;
      }
    }

    .filter-dropdown {
      display: flex;
      align-items: center;
      font-size: 24rpx;
      color: #999;

      .arrow-down {
        width: 0;
        height: 0;
        border-left: 8rpx solid transparent;
        border-right: 8rpx solid transparent;
        border-top: 10rpx solid #999;
        margin-left: 10rpx;
      }
    }
  }

  .summary-cards {
    display: flex;
    justify-content: space-between;
    gap: 20rpx;

    .summary-card {
      flex: 1;
      height: 160rpx;
      border-radius: 20rpx;
      padding: 20rpx;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .label {
        font-size: 22rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 10rpx;
      }

      .value {
        font-size: 40rpx;
        color: #ffffff;
        font-weight: bold;
      }

      .icon {
        position: absolute;
        right: 10rpx;
        bottom: 10rpx;
        width: 60rpx;
        height: 60rpx;
        opacity: 0.2;
      }

      &.purple { background: linear-gradient(135deg, #9013FE, #B86BFF); }
      &.blue { background: linear-gradient(135deg, #499AE6, #79B8F2); }
      &.cyan { background: linear-gradient(135deg, #50E3C2, #85F1DA); }
    }
  }

  .chart-container {
    width: 100%;
    height: 300rpx;
    display: flex;
    justify-content: center;
    align-items: center;

    .canvas {
      width: 100%;
      height: 100%;
    }
  }

  .phase-table {
    margin-top: 20rpx;
    border: 1rpx solid #f0f0f0;
    border-radius: 12rpx;
    overflow: hidden;

    .table-header, .table-body {
      display: flex;
      text-align: center;
      font-size: 24rpx;

      text {
        flex: 1;
        padding: 16rpx 0;
        border-right: 1rpx solid #f0f0f0;
        &:last-child { border-right: none; }
      }
    }

    .table-header {
      background: #f8f9fb;
      color: #999;
    }

    .table-body {
      color: #333;
    }
  }

  .donut-chart-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 40rpx;
    padding: 20rpx 0;

    .donut-chart {
      width: 200rpx;
      height: 200rpx;
      border-radius: 50%;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120rpx;
        height: 120rpx;
        background: #ffffff;
        border-radius: 50%;
      }
    }

    .legend-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16rpx;

      .legend-item {
        display: flex;
        align-items: center;
        font-size: 22rpx;

        .dot {
          width: 16rpx;
          height: 16rpx;
          border-radius: 4rpx;
          margin-right: 12rpx;
        }

        .name {
          color: #999;
          flex: 1;
        }

        .count {
          color: #333;
          margin-left: 20rpx;
        }
      }
    }
  }

  .data-table {
    .table-header {
      display: flex;
      padding: 20rpx 0;
      font-size: 26rpx;
      color: #999;
      border-bottom: 1rpx solid #f8f8f8;
    }

    .table-row {
      display: flex;
      padding: 24rpx 0;
      font-size: 28rpx;
      color: #333;

      &.zebra {
        background: #fafbfc;
      }
    }

    .col-rank { width: 100rpx; text-align: center; }
    .col-name { flex: 1; text-align: center; }
    .col-count { width: 200rpx; text-align: center; }
  }

  .project-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
    position: relative;

    .project-title {
      font-size: 30rpx;
      color: #333;
      font-weight: 500;
      margin-bottom: 30rpx;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 20rpx;

      .info-item {
        display: flex;
        align-items: center;
        gap: 16rpx;
        .info-icon {
          width: 32rpx;
          height: 32rpx;
          image { width: 100%; height: 100%; }
        }
        .info-text { font-size: 26rpx; color: #999; }
      }
    }

    .action-btn {
      position: absolute;
      right: 30rpx;
      bottom: 30rpx;
      background: #499ae6;
      color: #ffffff;
      font-size: 24rpx;
      padding: 8rpx 24rpx;
      border-radius: 30rpx;
    }
  }
</style>
