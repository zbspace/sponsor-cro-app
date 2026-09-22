<!-- 医院合作记录 -->
<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">{{ '合作情况统计' }}</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/home/head-bg.png" mode="aspectFit" />

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
    <view class="trial-card" v-for="(item, index) in list" :key="index">
      <view class="card-header">
        <view class="title-row">
          <view class="icon-wrap" :class="getRandomColorClass(index)">
            <text>{{ item.drugStandardName ? item.drugStandardName.charAt(0) : 'C' }}</text>
          </view>
          <text class="title">{{ item.drugStandardName }}</text>
          <text class="date">{{ item.firstPublicityDate }}</text>
        </view>
        <view class="tag-row">
          <view class="tag status">
            {{ item.cleanedTrialStages }}
          </view>
          <view class="tag stage">
            {{ item.trialStatus || '未知' }}
          </view>
        </view>
      </view>

      <view class="card-body">
        <view class="info-row">
          <text class="label">排名</text>
          <text class="value">{{ item.indication || '--' }}</text>
        </view>
        <view class="info-row">
          <text class="label">医院</text>
          <text class="value">{{ item.applicationCompany || '--' }}</text>
        </view>
        <view class="info-row">
          <text class="label">临床试验数</text>
          <text class="value">{{ item.acceptanceNo || '--' }}</text>
        </view>
      </view>
    </view>

    <!-- 加载更多 -->
    <view class="loading-status" v-if="list.length > 0">
      <view class="spinner" v-if="hasMore"></view>
      <text>{{ hasMore ? '正在加载...' : '没有更多了' }}</text>
    </view>
    <!-- 初始/筛选加载中 -->
    <view class="loading-status empty" v-if="list.length === 0 && loading">
      <view class="spinner"></view>
      <text>加载中...</text>
    </view>
    <view class="empty-status" v-if="list.length === 0 && !loading">
      <text>暂无相关合作记录</text>
    </view>
  </scroll-view>

  <!-- 中心及研究者弹窗 -->
  <CdeCenterResearcherPopup
    v-model:visible="popupVisible"
    :acceptance-no="currentTrial?.acceptanceNo || ''"
  />
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { getCdeTrailList } from '@/api'
  import type { CdeTrialItem, CdeTrailListReq } from '@/types/api'
  import CdeCenterResearcherPopup from '../../components/cde-center-researcher-popup/cde-center-researcher-popup.vue'
  import { onLoad } from '@dcloudio/uni-app'

  const props = defineProps<{
    /** 母公司ID */
    companyParentId?: number
    /** 药品名称（榜单点击带入） */
    drugName?: string
    /** 年份（榜单年份带入） */
    year?: string
  }>()

  // #region 弹窗状态
  const popupVisible = ref(false)
  const currentTrial = ref<CdeTrialItem | null>(null)

  function showResearcherPopup(item: CdeTrialItem) {
    currentTrial.value = item
    popupVisible.value = true
  }
  // #endregion

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
  const list = ref<CdeTrialItem[]>([])
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

    const params: CdeTrailListReq = {
      parentCompanyId: props.companyParentId || undefined,
      drugStandardName: props.drugName || undefined,
      queryYear: Number(currentTimeFilter.value) || Number(props.year) || undefined,
      cleanedTrialStages: stageFilter.value || undefined,
      trialStatus: statusFilter.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize
    }

    try {
      const res = await getCdeTrailList(params)
      if (res.data) {
        if (refresh) {
          list.value = res.data.list || []
        } else {
          list.value = [...list.value, ...(res.data.list || [])]
        }
        total.value = res.data.total || 0
      }
    } catch (e) {
      console.error('获取试验列表失败', e)
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
  function getRandomColorClass(index: number) {
    const classes = ['blue', 'green', 'purple', 'orange']
    return classes[index % classes.length]
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
    // 外部传入年份时，同步到年份下拉框（由年份 watch 触发首次加载，避免重复请求）
    if (props.year) {
      currentTimeFilter.value = props.year
    } else {
      fetchList(true)
    }
  })

  // 监听 props 变化重新加载
  watch(
    () => [props.companyParentId, props.drugName, props.year],
    () => {
      // 外部年份变化时同步到年份下拉框
      currentTimeFilter.value = props.year || ''
      fetchList(true)
    }
  )
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

  .trial-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);

    .card-header {
      margin-bottom: 24rpx;

      .title-row {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;

        .icon-wrap {
          width: 50rpx;
          height: 50rpx;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24rpx;
          color: #ffffff;
          font-weight: bold;
          margin-right: 20rpx;

          &.blue {
            background: #499ae6;
          }
          &.green {
            background: #50e3c2;
          }
          &.purple {
            background: #9013fe;
          }
          &.orange {
            background: #f5a623;
          }
        }

        .title {
          flex: 1;
          font-size: 30rpx;
          color: #333;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .date {
          font-size: 24rpx;
          color: #cccccc;
          margin-left: 20rpx;
        }
      }

      .tag-row {
        display: flex;
        gap: 16rpx;

        .tag {
          font-size: 22rpx;
          padding: 4rpx 16rpx;
          border-radius: 8rpx;

          &.status {
            background: #f3e9ff;
            color: #9013fe;
          }
          &.stage {
            background: #e9f4ff;
            color: #499ae6;
          }
        }
      }
    }

    .card-body {
      background: #f8f9fb;
      border-radius: 16rpx;
      padding: 24rpx;
      display: flex;
      flex-direction: column;
      gap: 16rpx;

      .info-row {
        display: flex;
        font-size: 26rpx;

        .label {
          color: #999;
          width: 200rpx;
        }

        .value {
          color: #333;
          flex: 1;
        }
      }
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24rpx;
      padding-top: 20rpx;

      .footer-label {
        font-size: 26rpx;
        color: #999;
      }

      .footer-right {
        display: flex;
        align-items: center;

        .count {
          font-size: 28rpx;
          color: #333;
          margin-right: 10rpx;
        }

        .arrow-right {
          width: 12rpx;
          height: 12rpx;
          border-top: 2rpx solid #cccccc;
          border-right: 2rpx solid #cccccc;
          transform: rotate(45deg);
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

  .loading-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12rpx;

    &.empty {
      padding: 80rpx 0;
    }
  }

  .spinner {
    width: 32rpx;
    height: 32rpx;
    border: 4rpx solid #e5e5e5;
    border-top-color: #499ae6;
    border-radius: 50%;
    animation: trial-list-spin 0.8s linear infinite;
  }

  @keyframes trial-list-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .empty-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
    image {
      width: 200rpx;
      height: 200rpx;
    }
  }
</style>
