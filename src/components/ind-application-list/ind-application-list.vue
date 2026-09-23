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
      <view class="product-filter" v-if="productName" @click="clearProductFilter">
        <text class="product-name">{{ productName }}</text>
        <text class="close-icon">×</text>
      </view>
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
            v-model="drugTypeFilter"
            :localdata="drugTypeOptions"
            :clear="false"
            placeholder="请选择"
          ></uni-data-select>
        </view>
      </view>

      <!-- 榜单点击带入的药品名称过滤 -->
      <view class="product-filter" v-if="productName" @click="clearProductFilter">
        <text class="product-name">{{ productName }}</text>
        <text class="close-icon">×</text>
      </view>
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
            <view class="tag status" :class="getStatusClass(item.applicationStatus)">
              {{ item.applicationStatus || '未知' }}
            </view>
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
            <text class="label">适应症</text>
            <text class="value">{{ item.indication || '--' }}</text>
          </view>
          <view class="info-row">
            <text class="label">申请人</text>
            <text class="value">{{ item.applicationCompany || '--' }}</text>
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
        <text>暂无IND申请记录</text>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed, onMounted, watch } from 'vue'
  import { getIndApplicationList } from '@/api'
  import type { IndApplicationItem, IndApplicationListReq } from '@/types/api'
  // #endregion

  // #region 组件属性
  const props = defineProps<{
    /** 母公司ID */
    companyParentId?: number
    /** 药品名称（榜单点击带入，支持 v-model:product-name） */
    productName?: string
  }>()

  const emit = defineEmits<{
    (e: 'update:productName', value: string): void
  }>()
  // #endregion

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

  const currentYearFilter = ref('')
  const drugTypeFilter = ref('')
  const cleanedClassification = ref('')

  /** 清空榜单带入的药品名称过滤 */
  function clearProductFilter() {
    emit('update:productName', '')
  }
  // #endregion

  // #region 列表数据
  const list = ref<IndApplicationItem[]>([])
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

    const params: IndApplicationListReq = {
      parentCompanyId: props.companyParentId || undefined,
      drugStandardName: props.productName || undefined,
      cleanedDrugType: drugTypeFilter.value || undefined,
      queryYear: currentYearFilter.value ? Number(currentYearFilter.value) : undefined,
      pageNum: pageNum.value,
      pageSize
    }

    try {
      const res = await getIndApplicationList(params)
      if (res.data) {
        if (refresh) {
          list.value = res.data.list || []
        } else {
          list.value = [...list.value, ...(res.data.list || [])]
        }
        total.value = res.data.total || 0
      }
    } catch (e) {
      console.error('获取IND列表失败', e)
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

  // #region 筛选联动
  watch(currentYearFilter, () => {
    fetchList(true)
  })
  watch(drugTypeFilter, () => {
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
    fetchList(true)
  })

  // 外部参数变化时重新加载列表
  watch(
    () => [props.companyParentId, props.productName],
    () => {
      fetchList(true)
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

            &.pending {
              background: #e9f4ff;
              color: #499ae6;
            }
            &.passed {
              background: #eaf7ea;
              color: #52c41a;
            }
            &.rejected {
              background: #fdecec;
              color: #f5222d;
            }
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
