<template>
  <view class="trial-list-wrapper">
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

    <!-- 产品筛选（独立一行，支持输入联想） -->
    <view class="product-filter-row">
      <view class="product-filter-card">
        <input
          type="text"
          v-model="productKeyword"
          placeholder="产品"
          placeholder-style="color: #999999"
          @input="onProductInput"
          @focus="onProductFocus"
        />
        <text class="clear-icon" v-if="productKeyword" @click="clearProduct">×</text>

        <!-- 产品模糊搜索下拉 -->
        <view
          class="dropdown-mask"
          v-if="showProductDropdown"
          @click="showProductDropdown = false"
        />
        <view class="product-dropdown" v-if="showProductDropdown">
          <view class="dropdown-loading" v-if="productLoading">
            <text>加载中...</text>
          </view>
          <template v-else>
            <scroll-view scroll-y class="dropdown-list" v-if="productOptions.length > 0">
              <view
                class="dropdown-item"
                v-for="item in productOptions"
                :key="item.value"
                @click="selectProduct(item.value)"
              >
                <text>{{ item.text }}</text>
              </view>
            </scroll-view>
            <view class="dropdown-empty" v-else>
              <text>未找到相关产品</text>
            </view>
          </template>
        </view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="list-scroll"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view class="trial-card" v-for="(item, index) in list" :key="index">
        <view class="card-header">
          <view class="title-row">
            <view class="icon-wrap" :class="getRandomColorClass(index)">
              <text>{{ item.drugName ? item.drugName.charAt(0).toUpperCase() : 'Z' }}</text>
            </view>
            <text class="title">{{ item.drugName }}</text>
            <text class="date">{{ item.publishDate }}</text>
          </view>
          <view class="tag-row">
            <view class="tag status">
              {{ item.trialStageStr }}
            </view>
            <view class="tag stage">
              {{ item.trialStatusStr || '未知' }}
            </view>
          </view>
        </view>

        <view class="card-body">
          <view class="info-row">
            <text class="label">适应症</text>
            <text class="value">{{ item.indication }}</text>
          </view>
          <view class="info-row">
            <text class="label">申办方</text>
            <text class="value">{{ item.sponsorName }}</text>
          </view>
          <view class="info-row">
            <text class="label">申请人(申办方)</text>
            <text class="value">{{ item.sponsorContacts }}</text>
          </view>
          <view class="info-row">
            <text class="label">登记号</text>
            <text class="value">{{ item.acceptanceNo }}</text>
          </view>
        </view>

        <view class="card-footer" @click="showResearcherPopup(item)">
          <text class="footer-label">中心及研究者</text>
          <view class="footer-right">
            <text class="count">{{ item.centerAndResearcherCount }}</text>
            <view class="arrow-right"></view>
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
        <image src="/static/icons/no.png" mode="aspectFit" />
        <text>暂无相关试验</text>
      </view>
    </scroll-view>

    <!-- 中心及研究者弹窗 -->
    <CenterResearcherPopup
      v-model:visible="popupVisible"
      :acceptance-no="currentTrial?.acceptanceNo || ''"
      :company-parent-id="companyParentId"
      :year="yearFilter"
      :trial-stage="stageFilter"
      :trial-status="statusFilter"
    />
  </view>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { queryHospitalTrialList, queryCleanedDrug } from '@/api'
  import { TRIAL_STATUS_VALUES, TRIAL_PHASE_VALUES, createEnumsToOptions } from '@/utils/enums'
  import type { TrialItem, HospitalStatisticsQuery, CleanedDrugItem } from '@/types/api'
  import CenterResearcherPopup from '../center-researcher-popup/center-researcher-popup.vue'

  const props = defineProps<{
    companyParentId?: number
    hospitalId?: number
    researcherId?: number
    researcherName?: string
    year?: string
    trialStage?: string
    trialStatus?: string
  }>()

  // #region 弹窗状态
  const popupVisible = ref(false)
  const currentTrial = ref<TrialItem | null>(null)

  function showResearcherPopup(item: TrialItem) {
    currentTrial.value = item
    popupVisible.value = true
  }
  // #endregion

  // #region 筛选状态
  const yearFilter = ref('')
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
    ...createEnumsToOptions(TRIAL_PHASE_VALUES)
  ])

  const statusOptions = computed(() => [
    { value: '', text: '试验状态' },
    ...createEnumsToOptions(TRIAL_STATUS_VALUES)
  ])

  // #region 产品筛选（清洗后药品名，支持输入联想）
  // 已生效的产品筛选值，空值表示全部
  const drugFilter = ref('')
  const productKeyword = ref('')
  const productOptions = ref<{ value: string; text: string }[]>([])
  const productLoading = ref(false)
  const showProductDropdown = ref(false)
  let productSearchTimer: ReturnType<typeof setTimeout> | null = null
  // 请求序号，用于丢弃过期的联想结果
  let productRequestId = 0

  /** 按 searchKey 模糊查询清洗后的药品 */
  async function fetchProductOptions(searchKey = '') {
    const currentRequestId = ++productRequestId
    productLoading.value = true
    try {
      const res = await queryCleanedDrug({
        pageNum: 1,
        pageSize: 50,
        searchKey: searchKey || undefined
      })
      if (currentRequestId !== productRequestId) return
      const rows = (res.data?.list || []) as unknown as Array<CleanedDrugItem | string>
      productOptions.value = rows
        .map((item) => (typeof item === 'string' ? item : item?.cleanedDrugName))
        .filter((name): name is string => !!name)
        .map((name) => ({ value: name, text: name }))
    } catch (e) {
      if (currentRequestId === productRequestId) productOptions.value = []
      console.error('获取产品选项失败', e)
    } finally {
      if (currentRequestId === productRequestId) productLoading.value = false
    }
  }

  /** 输入时防抖模糊查询 */
  function onProductInput() {
    if (productSearchTimer) clearTimeout(productSearchTimer)
    showProductDropdown.value = true
    // 清空输入时同步清空筛选条件
    if (!productKeyword.value.trim() && drugFilter.value) {
      drugFilter.value = ''
    }
    productSearchTimer = setTimeout(() => {
      fetchProductOptions(productKeyword.value.trim())
    }, 300)
  }

  function onProductFocus() {
    showProductDropdown.value = true
    fetchProductOptions(productKeyword.value.trim())
  }

  function selectProduct(value: string) {
    productKeyword.value = value
    drugFilter.value = value
    showProductDropdown.value = false
  }

  function clearProduct() {
    productKeyword.value = ''
    drugFilter.value = ''
    showProductDropdown.value = false
  }
  // #endregion

  // #endregion

  // #region 列表数据
  const list = ref<TrialItem[]>([])
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

    const params: HospitalStatisticsQuery = {
      companyParentId: props.companyParentId || undefined,
      hosStandardId: props.hospitalId || undefined,
      researcherId: props.researcherId || undefined,
      researcherName: props.researcherName || undefined,
      cleanedDrugName: drugFilter.value || undefined,
      year: currentTimeFilter.value || undefined,
      trialStage: stageFilter.value || undefined,
      trialStatus: statusFilter.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize
    }

    try {
      const res = await queryHospitalTrialList(params)
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
  watch(drugFilter, () => {
    fetchList(true)
  })
  // #endregion

  // #region 辅助函数
  function getRandomColorClass(index: number) {
    const classes = ['blue', 'green', 'purple', 'orange']
    return classes[index % classes.length]
  }
  // #endregion

  // #region 外部筛选条件同步
  /** 外部（父组件/路由）传入的筛选条件同步到下拉框 */
  function syncExternalFilters() {
    if (props.year) {
      currentTimeFilter.value = props.year
    }
    if (props.trialStage) {
      stageFilter.value = props.trialStage
    }
    if (props.trialStatus) {
      statusFilter.value = props.trialStatus
    }
  }
  // #endregion

  onMounted(() => {
    // 外部传入筛选条件时，同步到下拉框
    syncExternalFilters()
    fetchList(true)
  })

  // 监听 props 变化重新加载
  watch(
    () => [
      props.companyParentId,
      props.hospitalId,
      props.researcherId,
      props.researcherName,
      props.year,
      props.trialStage,
      props.trialStatus
    ],
    () => {
      syncExternalFilters()
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
  .trial-list-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    overflow: hidden;
    min-height: 0;

    .filter-wrapper {
      display: flex;
      align-items: center;
      gap: 20rpx;
      width: 100%;
      flex-shrink: 0;
    }

    /* #region 产品筛选（独立一行，支持输入联想） */
    .product-filter-row {
      width: 100%;
      flex-shrink: 0;

      .product-filter-card {
        position: relative;
        overflow: visible;
        background: #ffffff;
        height: 90rpx;
        border-radius: 16rpx;
        display: flex;
        align-items: center;
        padding: 0 30rpx;
        box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
        margin-bottom: 24rpx;

        input {
          flex: 1;
          font-size: 28rpx;
          color: #333;
        }

        .clear-icon {
          /* 下拉遮罩层级为 95，需提升清除按钮层级，否则点击会被遮罩拦截 */
          position: relative;
          z-index: 97;
          font-size: 32rpx;
          color: #cccccc;
          padding-left: 10rpx;
          line-height: 1;
        }

        .dropdown-mask {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 95;
        }

        .product-dropdown {
          position: absolute;
          top: 100rpx;
          left: 0;
          right: 0;
          background: #ffffff;
          border-radius: 12rpx;
          box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
          z-index: 96;
          max-height: 400rpx;
          overflow: hidden;

          .dropdown-list {
            max-height: 400rpx;
          }

          .dropdown-item {
            padding: 24rpx 30rpx;
            border-bottom: 1rpx solid #f5f5f5;

            &:last-child {
              border-bottom: none;
            }

            &:active {
              background: #f7f8fa;
            }

            text {
              font-size: 28rpx;
              color: #333333;
            }
          }

          .dropdown-loading,
          .dropdown-empty {
            padding: 30rpx 0;
            text-align: center;
            font-size: 26rpx;
            color: #999999;
          }
        }
      }
    }
    /* #endregion */

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
  }
</style>
