<template>
  <!-- 顶部背景与导航 -->
  <view class="header-bg" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-bar" :style="{ height: `${menu.height}px` }">
      <view class="back-btn" @click="goBack">
        <view class="back-icon"></view>
      </view>
    </view>
  </view>

  <image class="bg-img" src="../../static/icons/rank-bg.png" mode="aspectFit" />

  <view class="content-body">
    <!-- 筛选下拉框 -->
    <view class="filter-card">
      <uni-data-select
        v-model="timeFilter"
        :localdata="timeOptions"
        :clear="false"
      ></uni-data-select>
    </view>

    <!-- 榜单表格 -->
    <view class="rank-table-card">
      <view class="table-header">
        <text class="col-rank">排序</text>
        <text class="col-name">CRO公司</text>
        <text class="col-exp">项目经验</text>
        <text class="col-pharma">合作药企</text>
      </view>

      <view class="table-body">
        <view
          class="table-row"
          v-for="(item, index) in rankList"
          :key="index"
          :class="{ zebra: index % 2 === 1 }"
        >
          <text class="col-rank">{{ index + 1 }}</text>
          <text class="col-name highlight">{{ item.name }}</text>
          <text class="col-exp">{{ item.experience }}</text>
          <text class="col-pharma">{{ item.partners }}</text>
        </view>

        <!-- 加载状态 -->
        <view class="load-more">
          <text v-if="loading">加载中...</text>
          <text v-else-if="noMore">没有更多了</text>
          <text v-else>上滑加载更多</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 底部按钮 -->
  <view class="footer">
    <view class="share-btn">分享</view>
  </view>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { onReachBottom, onLoad } from '@dcloudio/uni-app'

  const timeFilter = ref('全部历史')
  const timeOptions = [
    { value: '全部历史', text: '全部历史' },
    { value: '2024', text: '2024年度' },
    { value: '2023', text: '2023年度' }
  ]

  const rankList = ref<any[]>([])
  const loading = ref(false)
  const noMore = ref(false)
  const page = ref(1)

  // 模拟获取数据
  const fetchRankData = async () => {
    if (loading.value || noMore.value) return

    loading.value = true
    // 模拟网络请求
    setTimeout(() => {
      const newData = Array.from({ length: 10 }, (_, i) => ({
        name: '圣方医药',
        experience: Math.floor(Math.random() * 100),
        partners: Math.floor(Math.random() * 100)
      }))

      rankList.value = [...rankList.value, ...newData]
      loading.value = false

      if (rankList.value.length >= 40) {
        noMore.value = true
      }
      page.value++
    }, 1000)
  }

  onReachBottom(() => {
    fetchRankData()
  })

  const goBack = () => {
    uni.navigateBack()
  }

  // 胶囊位置
  const menu = ref({ top: 44, height: 32 })
  onLoad(() => {
    // #ifdef MP-WEIXIN
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    // #endif
    fetchRankData()
  })
</script>

<style lang="scss" scoped>
  .header-bg {
    padding-top: 400rpx;
    position: relative;
    overflow: hidden;

    .nav-bar {
      padding-left: 30rpx;
      display: flex;
      align-items: center;

      .back-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;

        .back-icon {
          width: 20rpx;
          height: 20rpx;
          border-left: 4rpx solid #333;
          border-bottom: 4rpx solid #333;
          transform: rotate(45deg);
        }
      }
    }

    .header-content {
      padding: 40rpx 40rpx 20rpx;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: relative;
      z-index: 1;

      .title-section {
        flex: 1;
        .main-title {
          font-size: 44rpx;
          font-weight: bold;
          color: #003087;
          font-style: italic;
          display: block;
          margin-bottom: 16rpx;
        }
        .sub-title {
          font-size: 22rpx;
          color: #f38a8a;
          line-height: 1.4;
        }
      }
    }
  }

  .content-body {
    padding: 0 30rpx;
    margin-top: -10rpx;

    .filter-card {
      background: #ffffff;
      height: 90rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      padding: 0 30rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
      margin-bottom: 30rpx;

      :deep(.uni-select) {
        border: none;
        flex: 1;
        .uni-select__input-text {
          font-size: 28rpx;
          color: #adadad;
        }
      }
    }

    .rank-table-card {
      background: #ffffff;
      border-radius: 24rpx;
      padding: 20rpx;
      box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

      .table-header {
        display: flex;
        padding: 30rpx 0;
        border-bottom: 2rpx solid #f8f8f8;

        text {
          font-size: 26rpx;
          color: #666;
          text-align: center;
        }
      }

      .table-row {
        display: flex;
        padding: 30rpx 0;
        align-items: center;

        &.zebra {
          background-color: #fcfdfe;
        }

        text {
          font-size: 28rpx;
          color: #333;
          text-align: center;
        }

        .highlight {
          color: #499ae6;
        }
      }

      .col-rank {
        width: 100rpx;
      }
      .col-name {
        flex: 2;
        text-align: left !important;
        padding-left: 20rpx;
      }
      .col-exp {
        flex: 1;
      }
      .col-pharma {
        flex: 1;
      }

      .load-more {
        padding: 40rpx 0;
        text-align: center;
        text {
          font-size: 24rpx;
          color: #999;
        }
      }
    }
  }

  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 30rpx 40rpx 60rpx;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #fff 40%);
    z-index: 10;

    .share-btn {
      background: #499ae6;
      color: #ffffff;
      height: 90rpx;
      border-radius: 45rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      box-shadow: 0 8rpx 20rpx rgba(73, 154, 230, 0.3);
    }
  }
</style>
