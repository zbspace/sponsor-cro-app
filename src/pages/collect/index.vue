<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">我的收藏</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <view class="container">
    <!-- 内容卡片 -->
    <view class="rank-table-card">
      <view class="table-header">
        <text class="col-rank">序号</text>
        <text class="col-name">公司</text>
        <text class="col-exp">公司类型</text>
        <text class="col-pharma">状态</text>
      </view>

      <scroll-view
        scroll-y
        class="scroll-view"
        @scrolltolower="onScrollToLower"
        :show-scrollbar="false"
        :style="{
          height: `calc(100vh - ${menu.top}px - ${menu.height}px - 150px)`
        }"
      >
        <view
          class="table-row"
          v-for="(item, index) in rankList"
          :key="index"
          :class="{ zebra: index % 2 === 1 }"
        >
          <text class="col-rank">{{ index + 1 }}</text>
          <text class="col-name">{{ item.name }}</text>
          <text class="col-exp">{{ item.type }}</text>
          <text class="col-pharma status-text">{{ item.status }}</text>
        </view>

        <view class="loading-status" v-if="loading || noMore">
          <text>{{ loading ? '加载中...' : '没有更多了' }}</text>
        </view>
        <view class="empty-tip" v-if="rankList.length === 0 && !loading">暂无数据</view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'

  const rankList = ref<any[]>([])
  const loading = ref(false)
  const noMore = ref(false)
  const page = ref(1)

  const goBack = () => {
    uni.navigateBack({
      delta: 1,
      fail: () => {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    })
  }

  // 模拟获取数据
  const fetchRankData = async () => {
    if (loading.value || noMore.value) return

    loading.value = true
    // 模拟网络请求
    setTimeout(() => {
      const newData = Array.from({ length: 20 }, (_, i) => ({
        name: i % 2 === 0 ? '圣方医药' : '易启医药',
        type: '申办方',
        status: '已收藏'
      }))

      rankList.value = [...rankList.value, ...newData]
      loading.value = false

      if (rankList.value.length >= 40) {
        noMore.value = true
      }
      page.value++
    }, 1000)
  }

  // #region 滚动加载逻辑
  const onScrollToLower = () => {
    fetchRankData()
  }
  // #endregion

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  onLoad(async (options: any) => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    fetchRankData()
  })
</script>

<style lang="scss" scoped>
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

      .col-rank {
        width: 100rpx;
      }
      .col-name {
        flex: 2;
      }
      .col-exp {
        flex: 1;
      }
      .col-pharma {
        flex: 1;
      }

      .status-text {
        color: #0097d9;
      }
    }

    // #region 滚动列表样式
    .scroll-view {
      width: 100%;
    }

    .loading-status,
    .empty-tip {
      padding: 40rpx 0;
      text-align: center;
      text {
        font-size: 24rpx;
        color: #999;
      }
    }
    // #endregion
  }
</style>
