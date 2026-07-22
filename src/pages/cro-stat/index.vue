<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">百济神州</text>
    <view class="nav-right"></view>
  </view>

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
      <!-- 顶部筛选栏 -->
      <view class="top-filter-bar">
        <view class="filter-input-card">
          <text class="label">相关公司</text>
          <view class="divider"></view>
          <view class="value-wrapper">
            <uni-data-select
              v-model="currentCompany"
              :localdata="companyOptions"
              :clear="false"
              placeholder="请选择"
            ></uni-data-select>
          </view>
        </view>
        <view class="star-btn" :class="{ active: isStarred }" @click="toggleStar">
          <view class="star-icon" :class="{ filled: isStarred }"></view>
        </view>
      </view>

      <!-- 选项卡 -->
      <view class="tabs">
        <view
          class="tab-item"
          :class="{ active: activeTab === 'stat' }"
          @click="activeTab = 'stat'"
        >
          <text>合作CRO统计</text>
          <view class="active-line" v-if="activeTab === 'stat'"></view>
        </view>
        <view
          class="tab-item"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          <text>项目列表</text>
          <view class="active-line" v-if="activeTab === 'list'"></view>
        </view>
      </view>

      <!-- 时间筛选 -->
      <view class="time-filter-wrapper">
        <uni-data-select
          v-model="currentTimeFilter"
          :localdata="timeOptions"
          :clear="false"
          placeholder="请选择"
        ></uni-data-select>
      </view>

      <!-- 外包比例卡片 -->
      <view class="card ratio-card">
        <view class="card-title">外包比例</view>
        <view class="ratio-content">
          <view class="pie-chart-wrapper">
            <view
              class="pie-chart"
              :style="{
                background: `conic-gradient(#499AE6 0% ${outsourceRate.cro}%, #7ED321 ${outsourceRate.cro}% 100%)`
              }"
            ></view>
          </view>
          <view class="ratio-legend">
            <view class="legend-item">
              <view class="dot blue"></view>
              <view class="legend-info">
                <text class="label">外包CRO</text>
                <text class="value">{{ outsourceRate.cro }}%</text>
              </view>
            </view>
            <view class="legend-item">
              <view class="dot green"></view>
              <view class="legend-info">
                <text class="label">自己申报</text>
                <text class="value">{{ outsourceRate.self }}%</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- CRO合作名单卡片 -->
      <view class="card list-card">
        <view class="card-title">CRO合作名单</view>
        <view class="table-header">
          <text class="col-rank">排序</text>
          <text class="col-name">CRO公司</text>
          <text class="col-count">合作项目数</text>
        </view>
        <view class="table-body">
          <view class="table-row" v-for="(item, index) in croList" :key="index">
            <text class="col-rank">{{ index + 1 }}</text>
            <text class="col-name">{{ item.name }}</text>
            <text class="col-count highlight">{{ item.count }}</text>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'

  const activeTab = ref('stat')
  const currentCompany = ref('全部')
  const currentTimeFilter = ref('历史所有')
  const isStarred = ref(false)
  const showCompanySelect = ref(false)
  const showTimeSelect = ref(false)

  const companyOptions = ref([
    { value: '全部', text: '全部' },
    { value: '百济神州', text: '百济神州' },
    { value: '恒瑞医药', text: '恒瑞医药' }
  ])

  const timeOptions = ref([
    { value: '历史所有', text: '历史所有' },
    { value: '近一年', text: '近一年' },
    { value: '近三年', text: '近三年' }
  ])

  const outsourceRate = reactive({
    cro: 13,
    self: 87
  })

  const croList = ref([
    { name: '圣方医药', count: 5 },
    { name: '易启医药', count: 6 },
    { name: '圣方医药', count: 7 },
    { name: '圣方医药', count: 4 },
    { name: '圣方医药', count: 5 },
    { name: '圣方医药', count: 6 }
  ])

  const toggleStar = () => {
    isStarred.value = !isStarred.value
    uni.showToast({
      title: isStarred.value ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  }

  const goBack = () => {
    uni.navigateBack({
      delta: 1,
      fail: () => {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    })
  }

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  onLoad(() => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
  })
</script>

<style lang="scss" scoped>
  .container {
    padding: 50rpx;
  }

  /* 顶部筛选栏 */
  .top-filter-bar {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 40rpx;

    .filter-input-card {
      flex: 1;
      background: #ffffff;
      height: 100rpx;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      padding: 0 30rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);

      .label {
        font-size: 28rpx;
        color: #999;
      }

      .divider {
        width: 2rpx;
        height: 30rpx;
        background-color: #eee;
        margin: 0 20rpx;
      }

      .value-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;

        :deep(.uni-select) {
          border: none;
          padding: 0;

          .uni-select__input-text {
            font-size: 28rpx;
            color: #333;
          }
        }
      }
    }

    .star-btn {
      width: 100rpx;
      height: 100rpx;
      background: #ffffff;
      border-radius: 20rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);
      border: 2rpx dashed #ccc;

      .star-icon {
        width: 40rpx;
        height: 40rpx;
        background-image: url('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=star+icon+line+art+gray&image_size=square');
        background-size: contain;
        background-repeat: no-repeat;
      }

      &.active {
        border-style: solid;
        border-color: #499ae6;
      }
    }
  }

  /* 选项卡 */
  .tabs {
    display: flex;
    justify-content: space-around;
    margin-bottom: 40rpx;

    .tab-item {
      position: relative;
      padding: 20rpx 0;
      font-size: 30rpx;
      color: #666;

      &.active {
        color: #333;
        font-weight: 500;
      }

      .active-line {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 6rpx;
        background-color: #499ae6;
        border-radius: 3rpx;
      }
    }
  }

  /* 时间筛选 */
  .time-filter-wrapper {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 30rpx;
    width: 220rpx;

    :deep(.uni-select) {
      border: none;
      background: #ffffff;
      height: 60rpx;
      border-radius: 12rpx;
      padding: 0 20rpx;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.02);

      .uni-select__input-text {
        font-size: 26rpx;
        color: #999;
      }

      .uni-select__selector {
        z-index: 999;
      }
    }
  }

  /* 卡片通用样式 */
  .card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

    .card-title {
      font-size: 30rpx;
      font-weight: 500;
      color: #333;
      margin-bottom: 30rpx;
    }
  }

  /* 外包比例 */
  .ratio-card {
    .ratio-content {
      display: flex;
      align-items: center;
      gap: 60rpx;
      padding: 20rpx 0;

      .pie-chart-wrapper {
        .pie-chart {
          width: 200rpx;
          height: 200rpx;
          border-radius: 50%;
        }
      }

      .ratio-legend {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 30rpx;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 20rpx;

          .dot {
            width: 16rpx;
            height: 16rpx;
            border-radius: 4rpx;

            &.blue {
              background-color: #499ae6;
            }
            &.green {
              background-color: #7ed321;
            }
          }

          .legend-info {
            display: flex;
            flex-direction: column;

            .label {
              font-size: 24rpx;
              color: #999;
              margin-bottom: 4rpx;
            }

            .value {
              font-size: 28rpx;
              font-weight: bold;
              color: #333;
            }
          }
        }
      }
    }
  }

  /* 合作名单列表 */
  .list-card {
    .table-header {
      display: flex;
      padding: 20rpx 0;
      border-bottom: 2rpx solid #f8f8f8;
      font-size: 26rpx;
      color: #999;
    }

    .table-row {
      display: flex;
      padding: 30rpx 0;
      border-bottom: 2rpx solid #f8f8f8;
      font-size: 28rpx;
      color: #333;

      &:last-child {
        border-bottom: none;
      }
    }

    .col-rank {
      width: 120rpx;
      text-align: center;
    }

    .col-name {
      flex: 1;
      text-align: center;
    }

    .col-count {
      width: 200rpx;
      text-align: center;

      &.highlight {
        color: #499ae6;
      }
    }
  }
</style>
