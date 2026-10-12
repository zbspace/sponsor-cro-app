<!-- 中国附条件获批上市药品清单 -->
<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">中国附条件获批上市药品清单</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/home/head-bg.png" mode="aspectFit" />

  <view class="container">
    <!-- 筛选区域 -->
    <view class="filter-wrapper">
      <view class="time-filter-wrapper">
        <uni-data-select
          v-model="currentYearFilter"
          :localdata="yearOptions"
          :clear="false"
          placeholder="请选择"
        ></uni-data-select>
      </view>
    </view>

    <!-- 列表区域 -->
    <scroll-view
      class="container-scroll-view"
      :show-scrollbar="false"
      lower-threshold="100"
      :style="{
        height: `calc(100vh - ${menu.top}px - ${menu.height}px - 100px)`
      }"
      @scrolltolower="loadMore"
    >
      <view class="drug-card" v-for="(item, index) in list" :key="item.acceptanceNo || index">
        <text class="drug-name">{{ item.productName || '--' }}</text>

        <view class="tag-row">
          <view class="tag type" v-if="item.cleanedDrugType">{{ item.cleanedDrugType }}</view>
          <view class="tag class" v-if="item.cleanedClassification">
            {{ item.cleanedClassification }}
          </view>
        </view>

        <view class="card-body">
          <view class="info-row">
            <text class="label">持有人</text>
            <text class="value">{{ item.standardCompanyName || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">本次附条件批准时间</text>
            <text class="value">{{ item.approveDate || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">获附条件研究时限(年)</text>
            <text class="value">--</text>
          </view>
          <view class="info-row">
            <text class="label">获批记录</text>
            <text class="value">--</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="loading-status" v-if="list.length > 0">
        <text>{{ hasMore ? '正在加载...' : '没有更多了' }}</text>
      </view>
      <!-- 初始/筛选加载中 -->
      <view class="loading-status" v-if="list.length === 0 && loading">
        <text>加载中...</text>
      </view>
      <view class="empty-status" v-if="list.length === 0 && !loading">
        <text>暂无相关记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { queryNdaProductList } from '@/api'
  import type { NdaDataStatisticsParam, NdaProductDataVo } from '@/types/api'
  import { onLoad } from '@dcloudio/uni-app'

  // #region 筛选状态
  const currentYearFilter = ref('')
  const yearOptions = computed(() => [
    { value: '', text: '获批年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年度` }
    })
  ])
  // #endregion

  // #region 列表数据
  const list = ref<NdaProductDataVo[]>([])
  const pageNum = ref(1)
  const pageSize = 10
  const total = ref(0)
  const loading = ref(false)
  const hasMore = computed(() => list.value.length < total.value)

  async function fetchList(refresh = false) {
    if (loading.value) return
    if (refresh) {
      pageNum.value = 1
    }
    loading.value = true

    const params: NdaDataStatisticsParam = {
      year: currentYearFilter.value || undefined,
      pageNum: pageNum.value,
      pageSize
    }

    try {
      const res = await queryNdaProductList(params)
      if (res.data) {
        if (refresh) {
          list.value = res.data.list || []
        } else {
          list.value = [...list.value, ...(res.data.list || [])]
        }
        total.value = res.data.total || 0
      }
    } catch (e) {
      console.error('获取附条件获批药品清单失败', e)
    } finally {
      loading.value = false
    }
  }

  function loadMore() {
    if (hasMore.value && !loading.value) {
      pageNum.value++
      fetchList()
    }
  }
  // #endregion

  // 年份筛选变化时自动重新请求列表数据
  watch(currentYearFilter, () => {
    fetchList(true)
  })

  // #region 辅助函数
  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }
  // #endregion

  const menu = ref({ top: 0, left: 0, height: 0 })

  onLoad(() => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
  })

  onMounted(() => {
    fetchList(true)
  })
</script>

<script lang="ts">
  export default {
    options: {
      // 微信小程序默认样式隔离，需设为 shared 才能让 :deep() 样式穿透到 uni-data-select 等子组件内部
      styleIsolation: 'shared'
    }
  }
</script>

<style lang="scss" scoped>
  .container {
    padding: 30rpx;
  }

  .header {
    margin-bottom: 50rpx;
  }

  .filter-wrapper {
    display: flex;
    align-items: center;
    gap: 20rpx;
    width: 100%;
    flex-shrink: 0;
  }

  /* 年份筛选 */
  .time-filter-wrapper {
    background: #ffffff;
    height: 90rpx;
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
    margin-bottom: 24rpx;
    flex: 1;
    min-width: 0;

    :deep(.uni-select) {
      border: none;
      padding: 0;

      .uni-select__input-text {
        font-size: 28rpx;
        color: #333;
      }
      .uni-select__selector {
        width: 220rpx;
        left: -30rpx;
      }
    }
  }

  .drug-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);

    .drug-name {
      display: block;
      font-size: 32rpx;
      color: #333;
      font-weight: bold;
    }

    .tag-row {
      display: flex;
      gap: 16rpx;
      margin: 20rpx 0 24rpx;

      .tag {
        font-size: 24rpx;
        padding: 8rpx 20rpx;
        border-radius: 10rpx;

        &.type {
          background: #f3e9ff;
          color: #9013fe;
        }
        &.class {
          background: #e9f4ff;
          color: #499ae6;
        }
      }
    }

    .card-body {
      background: #f8f9fb;
      border-radius: 16rpx;
      padding: 24rpx;
      display: flex;
      flex-direction: column;
      gap: 20rpx;

      .info-row {
        display: flex;
        font-size: 26rpx;
        line-height: 1.5;

        .label {
          color: #999;
          width: 280rpx;
          flex-shrink: 0;
        }

        .value {
          color: #333;
          flex: 1;
          word-break: break-all;
        }
      }
    }
  }

  .loading-status,
  .empty-status {
    padding: 40rpx 0;
    text-align: center;
    font-size: 24rpx;
    color: #999;
  }
</style>
