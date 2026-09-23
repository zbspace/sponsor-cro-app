<!-- 医院合作记录 -->
<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">{{ companyName }}</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/home/head-bg.png" mode="aspectFit" />

  <view class="container">
    <!-- 筛选区域 -->
    <view class="filter-wrapper">
      <view class="time-filter-wrapper">
        <uni-data-select
          v-model="currentTimeFilter"
          :localdata="timeOptions"
          :clear="false"
          placeholder="请选择"
        ></uni-data-select>
      </view>
      <view class="time-filter-wrapper">
        <uni-data-select
          v-model="statusFilter"
          :localdata="statusOptions"
          :clear="false"
          placeholder="请选择"
        ></uni-data-select>
      </view>
      <view class="time-filter-wrapper">
        <uni-data-select
          v-model="stageFilter"
          :localdata="stageOptions"
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
      <!-- 医院合作名单表格 -->
      <view class="card list-card">
        <view class="table-header">
          <text class="col-rank">排序</text>
          <text class="col-name">医院名称</text>
          <text class="col-count">临床试验数</text>
        </view>
        <view class="table-body">
          <view
            class="table-row"
            v-for="(item, index) in list"
            :key="item.hosStandardId"
            hover-class="row-hover"
            @click="onHospitalClick(item)"
          >
            <text class="col-rank">{{ index + 1 }}</text>
            <text class="col-name">{{ item.hosStandardName || '--' }}</text>
            <text class="col-count highlight">{{ item.trialCnt ?? '--' }}</text>
          </view>
        </view>

        <!-- 加载状态提示 -->
        <view class="load-status" v-if="loading && list.length > 0">
          <text>加载中...</text>
        </view>
        <view class="load-status" v-else-if="!hasMore && list.length > 0">
          <text>没有更多了</text>
        </view>
        <view class="load-status" v-if="!loading && list.length === 0">
          <text>暂无数据</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { hospitalTrialStatistic } from '@/api'
  import type { HospitalTrialStatisticItem, HospitalTrialStatisticParam } from '@/types/api'
  import { onLoad } from '@dcloudio/uni-app'

  // #region 筛选状态
  // 试验分期/试验状态取值与 CDE 接口文档保持一致
  const CDE_TRIAL_STAGES = ['Ⅰ期', 'Ⅱ期', 'Ⅲ期', 'Ⅳ期', 'BE', '其他']
  const CDE_TRIAL_STATUS = ['进行中', '已完成', '主动暂停', '被叫停']

  const stageFilter = ref('')
  const statusFilter = ref('')
  const currentTimeFilter = ref('')
  const timeOptions = computed(() => [
    { value: '', text: '年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年度` }
    })
  ])

  const stageOptions = computed(() => [
    { value: '', text: '试验分期' },
    ...CDE_TRIAL_STAGES.map((text) => ({ value: text, text }))
  ])

  const statusOptions = computed(() => [
    { value: '', text: '试验状态' },
    ...CDE_TRIAL_STATUS.map((text) => ({ value: text, text }))
  ])

  // #endregion

  // #region 列表数据
  const list = ref<HospitalTrialStatisticItem[]>([])
  const pageNum = ref(1)
  const pageSize = 10
  const total = ref(0)
  const loading = ref(false)
  const isRefreshing = ref(false)
  const hasMore = computed(() => list.value.length < total.value)

  async function fetchList(refresh = false) {
    if (loading.value) return
    if (refresh) {
      pageNum.value = 1
    }
    loading.value = true

    const params: HospitalTrialStatisticParam = {
      parentCompanyId: companyParentId.value || undefined,
      year: currentTimeFilter.value || undefined,
      trialStage: stageFilter.value || undefined,
      trialStatus: statusFilter.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize
    }

    try {
      const res = await hospitalTrialStatistic(params)
      if (res.data) {
        if (refresh) {
          list.value = res.data.list || []
        } else {
          list.value = [...list.value, ...(res.data.list || [])]
        }
        total.value = res.data.total || 0
      }
    } catch (e) {
      console.error('获取医院合作记录失败', e)
    } finally {
      loading.value = false
      isRefreshing.value = false
    }
  }

  function loadMore() {
    if (hasMore.value && !loading.value) {
      pageNum.value++
      fetchList()
    }
  }

  function onRefresh() {
    isRefreshing.value = true
    fetchList(true)
  }

  // #endregion

  // 时间筛选变化时自动重新请求列表数据
  watch(currentTimeFilter, () => {
    fetchList(true)
  })
  watch(stageFilter, () => {
    fetchList(true)
  })
  watch(statusFilter, () => {
    fetchList(true)
  })

  // #region 辅助函数
  /** 点击医院行，跳转到合作情况统计页的「试验列表」tab */
  function onHospitalClick(item: HospitalTrialStatisticItem) {
    uni.navigateTo({
      url: `/pages/hospital-stat/index?companyParentId=${companyParentId.value || ''}&hosStandardId=${
        item.hosStandardId
      }&tab=list`
    })
  }

  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }
  // #endregion

  const menu = ref({ top: 0, left: 0, height: 0 })
  // 路由筛选参数（来自药企详情页）
  const companyName = ref('')
  const companyParentId = ref(0)

  onLoad((options: any) => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    // 读取路由筛选参数
    if (options?.companyName) {
      companyName.value = decodeURIComponent(options.companyName)
    }
    if (options?.companyId) {
      companyParentId.value = Number(options.companyId)
    }
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
  /* 时间筛选 */
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

    &:nth-child(2) {
      :deep(.uni-select) {
        .uni-select__selector {
          width: max-content;
        }
      }
    }

    .filter-tip {
      font-size: 24rpx;
      color: #f38a8a; /* 更柔和的红色 */
      line-height: 1.4;
      padding: 0 10rpx;
    }
  }

  /* 时间筛选提示 */
  .time-filter-tip {
    font-size: 24rpx;
    color: #f38a8a; /* 更柔和的红色 */
    line-height: 1.4;
    padding: 0 10rpx;
    margin-bottom: 30rpx;
  }

  .filter-bar {
    display: flex;
    justify-content: space-between;
    padding: 20rpx 0;
    gap: 20rpx;

    .filter-item {
      flex: 1;
      background: #ffffff;
      border-radius: 16rpx;
      height: 72rpx;
      box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.02);

      .filter-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 100%;
        padding: 0 24rpx;
        font-size: 26rpx;
        color: #666;

        .arrow-down {
          width: 0;
          height: 0;
          border-left: 8rpx solid transparent;
          border-right: 8rpx solid transparent;
          border-top: 10rpx solid #cccccc;
          margin-left: 10rpx;
        }
      }
    }
  }

  .list-scroll {
    flex: 1;
    height: 0; // 必须设置高度 0，配合 flex:1 才能正确工作
    min-height: 0;
    box-sizing: border-box;
  }

  // #region 卡片与表格
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

      // 点击反馈
      &.row-hover {
        background-color: #f2f7fc;
      }
    }

    .col-rank {
      width: 120rpx;
      text-align: center;
    }

    .col-name {
      flex: 1;
      text-align: center;
      word-break: break-all;
    }

    .col-count {
      width: 200rpx;
      text-align: center;

      &.highlight {
        color: #499ae6;
      }
    }

    // #region 加载状态
    .load-status {
      padding: 40rpx 0;
      text-align: center;

      text {
        font-size: 24rpx;
        color: #999;
      }
    }
    // #endregion
  }
  // #endregion
</style>
