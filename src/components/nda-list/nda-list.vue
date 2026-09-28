<template>
  <view class="trial-list-wrapper">
    <!-- 筛选区域 -->
    <view class="filter-container">
      <view class="filter-wrapper">
        <view class="time-filter-wrapper">
          <uni-data-select
            v-model="currentYearFilter"
            :localdata="yearOptions"
            :clear="false"
            placeholder="请选择"
          ></uni-data-select>
        </view>
        <view class="time-filter-wrapper">
          <uni-data-select
            v-model="drugTypeFilter"
            :localdata="drugTypeOptions"
            :clear="false"
            placeholder="请选择"
          ></uni-data-select>
        </view>
      </view>

      <!-- 榜单点击带入的药品名称过滤 -->
      <!-- <view class="product-filter" v-if="productName" @click="clearProductFilter">
        <text class="product-name">{{ productName }}</text>
        <text class="close-icon">×</text>
      </view> -->
    </view>

    <view class="filter-container">
      <view class="filter-wrapper">
        <view class="time-filter-wrapper">
          <uni-data-select
            v-model="cleanedClassification"
            :localdata="classificationOptions"
            :clear="false"
            placeholder="请选择"
          ></uni-data-select>
        </view>
        <view class="time-filter-wrapper">
          <uni-data-select
            v-model="productFilter"
            :localdata="productOptions"
            :clear="false"
            placeholder="请选择"
          ></uni-data-select>
        </view>
      </view>
    </view>

    <!-- 列表区域 -->
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
              <text>{{ item.productName ? item.productName.charAt(0) : 'N' }}</text>
            </view>
            <text class="title">{{ item.productName }}</text>
            <text class="date">{{ item.undertakeDate }}</text>
          </view>
          <view class="tag-row">
            <view class="tag status">{{ item.applyStatusStr || '未知' }}</view>
            <view class="tag stage">{{ item.cleanedDrugType || '未知' }}</view>
          </view>
        </view>

        <view class="card-body">
          <view class="info-row">
            <text class="label">注册分类</text>
            <text class="value">{{ item.cleanedClassification || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">申请日期</text>
            <text class="value">{{ item.undertakeDate || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">批准日期</text>
            <text class="value">{{ item.approveDate || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">企业名称</text>
            <text class="value">{{ item.standardCompanyName || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">受理号</text>
            <text class="value">{{ item.acceptanceNo || '--' }}</text>
          </view>
        </view>
      </view>

      <view class="loading-status" v-if="list.length > 0">
        <text>{{ hasMore ? '正在加载...' : '没有更多了' }}</text>
      </view>
      <view class="empty-status" v-if="list.length === 0 && !loading">
        <image src="/static/icons/no.png" mode="aspectFit" />
        <text>暂无相关记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { queryNdaProductList, queryStandardDrug } from '@/api'
  import type { NdaDataStatisticsParam, NdaProductDataVo, DrugShortItem } from '@/types/api'

  const props = defineProps<{
    /** 母公司ID */
    companyParentId?: number
    /** 药品名称（榜单点击带入，支持 v-model:product-name） */
    productName?: string
  }>()

  const emit = defineEmits<{
    (e: 'update:productName', value: string): void
  }>()

  // #region 筛选状态
  // 药品类型取值与 IND 接口保持一致
  const DRUG_TYPE_VALUES = ['中药', '化药', '治疗生物药', '疫苗']

  const yearOptions = computed(() => [
    { value: '', text: '年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年度` }
    })
  ])

  const drugTypeOptions = [
    { value: '', text: '药品类型' },
    ...DRUG_TYPE_VALUES.map((text) => ({ value: text, text }))
  ]

  // 注册分类
  const DRUG_TYPE_OPTIONS = [
    { value: 1, text: '化药' },
    { value: 2, text: '预防用生物制品' },
    { value: 3, text: '治疗用生物制品' },
    { value: 4, text: '中药/天然药物' }
  ]
  const classificationOptions = [{ value: '', text: '注册分类' }, ...DRUG_TYPE_OPTIONS]

  // #region 产品下拉（数据来源于 queryStandardDrug 接口）
  const productList = ref<DrugShortItem[]>([])
  const productOptions = computed(() => {
    const options = [
      { value: '', text: '产品' },
      ...productList.value.map((item) => ({
        value: item.drugStandardName,
        text: item.drugStandardName
      }))
    ]
    // 父组件带入的药品名可能不在下拉数据中，补一条选项，保证下拉框能找到并回显选中项
    const current = props.productName
    if (current && !options.some((option) => option.value === current)) {
      options.push({ value: current, text: current })
    }
    return options
  })

  /** 产品筛选与 productName 属性双向绑定，保证榜单带入与下拉选择共用同一数据源 */
  const productFilter = computed({
    get: () => props.productName || '',
    set: (value: string) => emit('update:productName', value)
  })

  const currentYearFilter = ref('')
  const drugTypeFilter = ref('')
  const cleanedClassification = ref('')
  // #endregion

  // #region 列表数据
  const list = ref<NdaProductDataVo[]>([])
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

    const params: NdaDataStatisticsParam = {
      parentCompanyId: props.companyParentId || undefined,
      productName: props.productName || undefined,
      cleanedDrugType: drugTypeFilter.value || undefined,
      cleanedClassification: cleanedClassification.value || undefined,
      year: currentYearFilter.value || undefined,
      pageNum: pageNum.value,
      pageSize: pageSize
    }

    try {
      const res = await queryNdaProductList(params)
      if (res.data) {
        const items = res.data?.list || []
        if (refresh) {
          list.value = items
        } else {
          list.value = [...list.value, ...items]
        }
        total.value = res.data.total || 0
      }
    } catch (e) {
      console.error('获取NDA列表失败', e)
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

  // 筛选变化时自动重新请求列表数据
  watch(currentYearFilter, () => {
    fetchList(true)
  })
  watch(drugTypeFilter, () => {
    fetchList(true)
  })

  watch(cleanedClassification, () => {
    fetchList(true)
  })

  watch(productFilter, () => {
    fetchList(true)
  })

  // #region 辅助函数
  function getRandomColorClass(index: number) {
    const classes = ['blue', 'green', 'purple', 'orange']
    return classes[index % classes.length]
  }

  /** 查询产品下拉选项 */
  async function fetchProductOptions() {
    try {
      const res = await queryStandardDrug({ pageNum: 1, pageSize: 100 })
      productList.value = res.data?.list || []
    } catch (e) {
      console.error('获取产品下拉选项失败', e)
    }
  }
  // #endregion

  onMounted(() => {
    fetchList(true)
    fetchProductOptions()
  })

  // 监听 props 变化重新加载
  watch(
    () => props.companyParentId,
    () => {
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
    height: 100%;

    .filter-wrapper {
      display: flex;
      align-items: center;
      gap: 20rpx;
      width: 100%;
    }
    /* 时间筛选 */
    .time-filter-wrapper {
      margin-bottom: 40rpx;
      background: #ffffff;
      height: 90rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      padding: 0 30rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
      margin-bottom: 24rpx;
      flex: 1;

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
