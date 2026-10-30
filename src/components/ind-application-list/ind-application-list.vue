<template>
  <view class="ind-application-wrapper">
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
        <view class="time-filter-wrapper product-filter-wrapper">
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

      <!-- 榜单点击带入的药品名称过滤 -->
      <!-- <view class="product-filter" v-if="productName" @click="clearProductFilter">
        <text class="product-name">{{ productName }}</text>
        <text class="close-icon">×</text>
      </view> -->
    </view>

    <!-- 列表区域 -->
    <scroll-view
      scroll-y
      class="list-scroll"
      @scrolltolower="loadMore"
      :show-scrollbar="false"
      enhanced
    >
      <view class="ind-card" v-for="(item, index) in list" :key="index">
        <view class="card-header">
          <view class="title-row">
            <view class="icon-wrap" :class="getColorClass(index)">
              <text>{{ item.drugStandardName ? item.drugStandardName.charAt(0) : 'I' }}</text>
            </view>
            <text class="title">{{ item.drugStandardName }}</text>
            <text class="date">{{ item.undertakeDate }}</text>
          </view>
          <view class="tag-row">
            <view class="tag stage" v-if="item.cleanedDrugType">
              {{ item.cleanedDrugType }}
            </view>
            <view class="tag classify" v-if="item.cleanedClassification">
              {{ item.cleanedClassification }}
            </view>
          </view>
        </view>

        <view class="card-body">
          <view class="info-row">
            <text class="label">申请人</text>
            <text class="value">{{ item.applicationCompany || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">申请状态</text>
            <text class="value">
              {{ item.applicationStatus || '未知' }}
            </text>
          </view>
          <view class="info-row">
            <text class="label">适应症</text>
            <text class="value">{{ item.indication || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">受理号</text>
            <text class="value">{{ item.acceptanceNo || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">通过时间</text>
            <text class="value">{{ item.approvalTime || '--' }}</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="loading-status" v-if="list.length > 0">
        <view class="spinner" v-if="loading"></view>
        <text>{{ hasMore ? (loading ? '正在加载...' : '上拉加载更多') : '没有更多了' }}</text>
      </view>
      <!-- 初始/筛选加载中 -->
      <view class="loading-status empty" v-if="list.length === 0 && loading">
        <view class="spinner"></view>
        <text>加载中...</text>
      </view>
      <view class="empty-status" v-if="list.length === 0 && !loading">
        <image src="/static/icons/no.png" mode="aspectFit" />
        <text>暂无IND申请记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed, onMounted, watch, nextTick } from 'vue'
  import { getIndApplicationList, queryCleanedDrug } from '@/api'
  import type { IndApplicationItem, IndApplicationListReq, CleanedDrugItem } from '@/types/api'
  import { REGISTER_TYPE, DRUG_TYPE_VALUES, createEnumsToOptions } from '@/utils/enums'
  // #endregion

  // #region 组件属性
  const props = defineProps<{
    /** 母公司ID */
    companyParentId?: number
    /** 药品名称（榜单点击带入，支持 v-model:product-name） */
    productName?: string
    /** 注册分类（榜单点击带入，支持 v-model:classification） */
    classification?: string
  }>()

  const emit = defineEmits<{
    (e: 'update:productName', value: string): void
    (e: 'update:classification', value: string): void
  }>()
  // #endregion

  // #region 筛选状态
  const yearOptions = computed(() => [
    { value: '', text: '年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年度` }
    })
  ])

  const drugTypeOptions = [
    { value: '', text: '药品类型' },
    ...createEnumsToOptions(DRUG_TYPE_VALUES)
  ]

  const classificationOptions = [
    { value: '', text: '注册分类' },
    ...createEnumsToOptions(REGISTER_TYPE)
  ]

  const currentYearFilter = ref('')
  const drugTypeFilter = ref('')

  /** 注册分类与 classification 属性双向绑定，保证榜单带入与下拉选择共用同一数据源 */
  const cleanedClassification = computed({
    get: () => props.classification || '',
    set: (value: string) => emit('update:classification', value)
  })

  // #region 产品筛选（queryCleanedDrug 模糊搜索）
  interface ProductOption {
    value: string
    text: string
  }

  const productOptions = ref<ProductOption[]>([])
  const productKeyword = ref(props.productName || '')
  const productLoading = ref(false)
  const showProductDropdown = ref(false)
  let productSearchTimer: ReturnType<typeof setTimeout> | null = null
  // 请求序号，用于丢弃过期的联想结果
  let productRequestId = 0

  /** 产品筛选与 productName 属性双向绑定，保证榜单带入与下拉选择共用同一数据源 */
  const productFilter = computed({
    get: () => props.productName || '',
    set: (value: string) => emit('update:productName', value)
  })

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
    if (!productKeyword.value.trim() && productFilter.value) {
      productFilter.value = ''
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
    productFilter.value = value
    showProductDropdown.value = false
  }

  function clearProduct() {
    productKeyword.value = ''
    productFilter.value = ''
    showProductDropdown.value = false
  }
  // #endregion

  // #region 列表数据
  const list = ref<IndApplicationItem[]>([])
  const pageNum = ref(1)
  const pageSize = 10
  const total = ref(0)
  const loading = ref(false)
  // 是否已加载完所有数据，避免 total 与实际返回不一致时反复触发加载
  const finished = ref(false)
  // 请求进行中被挂起的刷新标记（如榜单带入的筛选参数晚于首次请求到达）
  let pendingRefresh = false

  const hasMore = computed(() => !finished.value && list.value.length < total.value)

  async function fetchList(refresh = false) {
    if (loading.value) {
      // 请求进行中：刷新请求需等当前请求结束后补发，否则榜单带入的筛选条件会被丢弃
      if (refresh) pendingRefresh = true
      return
    }
    // 仅在请求成功后推进页码，避免失败时跳页导致数据缺失、无法加载到底
    const targetPage = refresh ? 1 : pageNum.value + 1
    loading.value = true
    if (refresh) {
      finished.value = false
    }

    const params: IndApplicationListReq = {
      parentCompanyId: props.companyParentId || undefined,
      drugStandardName: props.productName || undefined,
      cleanedDrugType: drugTypeFilter.value || undefined,
      cleanedClassification: cleanedClassification.value || undefined,
      queryYear: currentYearFilter.value ? Number(currentYearFilter.value) : undefined,
      pageNum: targetPage,
      pageSize
    }

    try {
      const res = await getIndApplicationList(params)
      const newList = res.data?.list || []
      list.value = refresh ? newList : [...list.value, ...newList]
      total.value = res.data?.total || 0
      pageNum.value = targetPage
      // 返回空页说明已无更多数据，直接结束加载状态
      if (!newList.length) {
        finished.value = true
      }
    } catch (e) {
      console.error('获取IND列表失败', e)
    } finally {
      loading.value = false
      // 补发请求过程中被挂起的刷新，确保最新筛选条件生效
      if (pendingRefresh) {
        pendingRefresh = false
        fetchList(true)
      }
    }
  }

  function loadMore() {
    if (hasMore.value && !loading.value) {
      fetchList()
    }
  }
  // #endregion

  // #region 筛选联动
  watch(currentYearFilter, () => {
    fetchList(true)
  })
  watch(drugTypeFilter, () => {
    fetchList(true)
  })
  watch(cleanedClassification, () => {
    fetchList(true)
  })
  // #endregion

  // #region 辅助函数
  function getColorClass(index: number) {
    const classes = ['blue', 'green', 'purple', 'orange']
    return classes[index % classes.length]
  }

  /**
   * 申请状态样式（接口取值：审核中/备案通过/备案未通过）
   * @param status 申请状态
   */
  function getStatusClass(status: string) {
    if (status === '备案通过') return 'passed'
    if (status === '备案未通过') return 'rejected'
    return 'pending'
  }
  // #endregion

  // #region 生命周期
  onMounted(() => {
    // 小程序端组件属性可能在挂载后才同步到子组件，延后一拍发起首次请求，避免丢失榜单带入的筛选参数
    nextTick(() => {
      fetchList(true)
      fetchProductOptions()
    })
  })

  // 外部参数变化时重新加载列表
  watch(
    () => [props.companyParentId, props.productName, props.classification],
    () => {
      fetchList(true)
    }
  )

  // 榜单带入的药品名同步到产品输入框
  watch(
    () => props.productName,
    (val) => {
      productKeyword.value = val || ''
    }
  )
  // #endregion
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
  .ind-application-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    height: 100%;

    .filter-container {
      flex-shrink: 0;
      width: 100%;
    }

    .filter-wrapper {
      display: flex;
      align-items: center;
      gap: 20rpx;
      width: 100%;
      flex-shrink: 0;
    }

    /* 筛选下拉 */
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

    /* 产品模糊搜索 */
    .product-filter-wrapper {
      position: relative;
      overflow: visible;

      input {
        flex: 1;
        font-size: 28rpx;
        color: #333;
      }

      .clear-icon {
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

    /* 榜单带入的药品名称过滤 */
    .product-filter {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      background: #e9f4ff;
      border-radius: 30rpx;
      padding: 10rpx 24rpx;
      margin-bottom: 24rpx;

      .product-name {
        font-size: 26rpx;
        color: #499ae6;
        max-width: 420rpx;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .close-icon {
        font-size: 28rpx;
        color: #499ae6;
        margin-left: 16rpx;
        line-height: 1;
      }
    }

    .list-scroll {
      flex: 1;
      height: 0; // 必须设置高度 0，配合 flex:1 才能正确工作
      min-height: 0;
      box-sizing: border-box;
    }

    .ind-card {
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
          flex-wrap: wrap;
          gap: 16rpx;

          .tag {
            font-size: 22rpx;
            padding: 4rpx 16rpx;
            border-radius: 8rpx;

            &.stage {
              background: #f3e9ff;
              color: #9013fe;
            }
            &.classify {
              background: #fff7e6;
              color: #f5a623;
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
            width: 160rpx;
          }

          .value {
            color: #333;
            flex: 1;

            // 申请状态颜色
            &.pending {
              color: #499ae6;
            }
            &.passed {
              color: #52c41a;
            }
            &.rejected {
              color: #f5222d;
            }
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
      animation: ind-application-spin 0.8s linear infinite;
    }

    @keyframes ind-application-spin {
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
