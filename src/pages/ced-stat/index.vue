<template>
  <view class="page-container">
    <!-- 头部导航 -->
    <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
      <view class="nav-left" @click="goBack">
        <view class="back-icon">
          <view class="arrow"></view>
        </view>
      </view>
      <text class="title">{{ companyName || '合作情况统计' }}</text>
      <view class="nav-right"></view>
    </view>

    <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

    <!-- 选项卡 -->
    <view class="tabs">
      <view class="tab-item" :class="{ active: activeTab === 'stat' }" @click="activeTab = 'stat'">
        <text>统计</text>
        <view class="active-line" v-if="activeTab === 'stat'"></view>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
        <text>试验列表</text>
        <view class="active-line" v-if="activeTab === 'list'"></view>
      </view>
    </view>

    <scroll-view
      :scroll-y="activeTab === 'stat'"
      class="container-scroll-view"
      :show-scrollbar="false"
    >
      <view
        class="container"
        :style="{
          height: activeTab === 'list' ? '100%' : 'auto',
          display: activeTab === 'list' ? 'flex' : 'block',
          flexDirection: 'column'
        }"
      >
        <!-- 统计内容 -->
        <view v-if="activeTab === 'stat'" class="stat-content">
          <!-- 近五年临床试验公示 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">近五年临床试验公示</view>
              <view class="filter-dropdown">
                <picker
                  class="filter-picker"
                  mode="selector"
                  :range="trialStageOptions"
                  range-key="text"
                  @change="onTrialStageChange"
                >
                  <view class="filter-trigger">
                    <text>{{ trialStageText }}</text>
                    <view class="arrow-down"></view>
                  </view>
                </picker>
              </view>
            </view>
            <view class="chart-container line-chart">
              <!-- #ifdef MP-WEIXIN -->
              <canvas id="lineCanvas" type="2d" class="canvas"></canvas>
              <!-- #endif -->
              <!-- #ifndef MP-WEIXIN -->
              <canvas canvas-id="lineCanvas" class="canvas"></canvas>
              <!-- #endif -->
            </view>
          </view>

          <!-- 试验分期 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">试验分期</view>
              <view class="filter-dropdown">
                <picker
                  class="filter-picker"
                  mode="selector"
                  :range="yearOptions"
                  range-key="text"
                  @change="onStageYearChange"
                >
                  <view class="filter-trigger">
                    <text>{{ stageYearText }}</text>
                    <view class="arrow-down"></view>
                  </view>
                </picker>
              </view>
            </view>
            <view class="chart-container radar-chart">
              <!-- #ifdef MP-WEIXIN -->
              <canvas id="radarCanvas" type="2d" class="canvas"></canvas>
              <!-- #endif -->
              <!-- #ifndef MP-WEIXIN -->
              <canvas canvas-id="radarCanvas" class="canvas"></canvas>
              <!-- #endif -->
            </view>
            <view class="phase-table">
              <view class="table-header">
                <text v-for="(item, index) in trialStageList" :key="index">
                  {{ item.cleanedTrialStages }}
                </text>
                <text v-if="!trialStageList.length">暂无数据</text>
              </view>
              <view class="table-body">
                <text v-for="(item, index) in trialStageList" :key="index">{{ item.number }}</text>
                <text v-if="!trialStageList.length">-</text>
              </view>
            </view>
          </view>

          <!-- 试验状态 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">试验状态</view>
              <view class="filter-dropdown">
                <picker
                  class="filter-picker"
                  mode="selector"
                  :range="yearOptions"
                  range-key="text"
                  @change="onStatusYearChange"
                >
                  <view class="filter-trigger">
                    <text>{{ statusYearText }}</text>
                    <view class="arrow-down"></view>
                  </view>
                </picker>
              </view>
            </view>
            <view class="donut-chart-wrapper">
              <view class="donut-chart" :style="{ background: donutGradient }"></view>
              <view class="legend-grid">
                <view class="legend-item" v-for="(item, index) in trialStatusLegend" :key="index">
                  <view class="dot" :style="{ backgroundColor: item.color }"></view>
                  <text class="name">{{ item.name }}</text>
                  <text class="count">{{ item.count }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 产品试验榜单 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">产品试验榜单</view>
              <view class="filter-dropdown">
                <picker
                  class="filter-picker"
                  mode="selector"
                  :range="yearOptions"
                  range-key="text"
                  @change="onProductYearChange"
                >
                  <view class="filter-trigger">
                    <text>{{ productYearText }}</text>
                    <view class="arrow-down"></view>
                  </view>
                </picker>
              </view>
            </view>
            <view class="data-table">
              <view class="table-header">
                <text class="col-rank">排名</text>
                <text class="col-name">产品名称</text>
                <text class="col-count">临床试验数</text>
              </view>
              <!-- #region 产品榜单滚动加载 -->
              <scroll-view
                scroll-y
                class="table-scroll"
                show-scrollbar
                enhanced
                @scrolltolower="loadMoreProduct"
              >
                <view class="table-body">
                  <view
                    class="table-row"
                    v-for="(item, index) in productList"
                    :key="index"
                    hover-class="row-hover"
                    :class="[index % 2 === 1 ? 'zebra' : '', index < 3 ? 'top' + (index + 1) : '']"
                    @click="onProductClick(item)"
                  >
                    <text class="col-rank">{{ item.rankNo || index + 1 }}</text>
                    <text class="col-name">{{ item.drugStandardName }}</text>
                    <view class="col-count">
                      <view class="count-go">
                        <text>{{ item.cdeTrialNum }}</text>
                        <view class="go-arrow"></view>
                      </view>
                    </view>
                  </view>
                  <view class="empty-tip" v-if="!productList.length && !productLoading">
                    暂无数据
                  </view>
                  <view class="loading-tip" v-if="productList.length">
                    <text>{{ productHasMore ? '正在加载...' : '没有更多了' }}</text>
                  </view>
                </view>
              </scroll-view>
              <!-- #endregion -->
            </view>
          </view>
        </view>

        <!-- cde试验列表 -->
        <view v-else class="detail-content">
          <CdeTrialList
            class="trial-list-comp"
            :company-parent-id="companyParentId"
            v-model:drug-name="selectedDrugName"
            :year="selectedListYear"
          />
        </view>
      </view>
    </scroll-view>
  </view>

  <phone-bind-popup />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import CdeTrialList from '@/components/cde-trial-list/cde-trial-list.vue'

  import {
    getCdeApplicationNum,
    getCdeTrialStagesNum,
    getCdeTrialStatusNum,
    getCdeProductRank
  } from '@/api'
  import type {
    CdeApplicationNumItem,
    CdeTrialStageItem,
    CdeTrialStatusItem,
    CdeProductRankItem,
    PipelineCompanyQuery
  } from '@/types/api'
  import { renderLineChart, renderRadarChart, shortYearLabel } from '@/utils/canvas-chart'

  // #endregion

  // #region 页面状态
  const instance = getCurrentInstance()
  const activeTab = ref('stat')
  const menu = ref({ top: 0, left: 0, height: 0 })

  // 路由筛选参数（来自药企详情页）
  const companyName = ref('')
  const companyParentId = ref(0)
  // #endregion

  // #region 近五年临床试验公示
  // 试验分期取值与 CDE 接口文档保持一致
  const CDE_TRIAL_STAGES = ['Ⅰ期', 'Ⅱ期', 'Ⅲ期', 'Ⅳ期', 'BE', '其他']
  const trialStageOptions = [
    { value: '', text: '试验分期' },
    ...CDE_TRIAL_STAGES.map((text) => ({ value: text, text }))
  ]
  const applicationList = ref<CdeApplicationNumItem[]>([])
  const trialStageFilter = ref('')
  const trialStageText = computed(
    () => trialStageOptions.find((o) => o.value === trialStageFilter.value)?.text || '试验分期'
  )
  // #endregion

  // #region 试验分期
  const trialStageList = ref<CdeTrialStageItem[]>([])
  const stageYearFilter = ref('')
  // #endregion

  // #region 试验状态
  // 试验状态取值与 CDE 接口文档保持一致
  const CDE_TRIAL_STATUS_COLORS: Record<string, string> = {
    进行中: '#499AE6',
    已完成: '#7ED321',
    主动暂停: '#D0021B',
    被叫停: '#50E3C2'
  }
  // 未匹配到颜色时的兜底配色
  const DONUT_COLORS = ['#F5A623', '#9013FE', '#499AE6', '#7ED321', '#D0021B', '#50E3C2']
  const trialStatusLegend = ref<{ name: string; count: number; color: string }[]>([])
  const donutGradient = ref('')
  const statusYearFilter = ref('')
  // #endregion

  // #region 产品试验榜单
  const productList = ref<CdeProductRankItem[]>([])
  const productYearFilter = ref('')
  const productPageNum = ref(1)
  const productPageSize = 10
  const productTotal = ref(0)
  const productLoading = ref(false)
  const productHasMore = computed(() => productList.value.length < productTotal.value)
  // 点击产品行进入试验列表时携带的产品名称筛选
  const selectedDrugName = ref('')
  // 点击产品行进入试验列表时携带的年份筛选
  const selectedListYear = ref('')
  // #endregion

  // #region 年份选项
  const yearOptions = computed(() => [
    { value: '', text: '年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年` }
    })
  ])
  const stageYearText = computed(
    () => yearOptions.value.find((o) => o.value === stageYearFilter.value)?.text || '年份'
  )
  const statusYearText = computed(
    () => yearOptions.value.find((o) => o.value === statusYearFilter.value)?.text || '年份'
  )
  const productYearText = computed(
    () => yearOptions.value.find((o) => o.value === productYearFilter.value)?.text || '年份'
  )
  // #endregion

  // #region 请求参数构造
  /**
   * 构造研发管线接口通用请求参数（母公司维度）
   */
  function buildCompanyParams(): PipelineCompanyQuery {
    return {
      parentCompanyId: companyParentId.value || undefined
    }
  }
  // #endregion

  // #region 数据请求
  /** 近5年临床试验公示数量 */
  async function fetchApplicationNum() {
    try {
      const res = await getCdeApplicationNum({
        ...buildCompanyParams(),
        cleanedTrialStages: trialStageFilter.value || undefined
      })
      applicationList.value = res.data || []
      drawLineChart()
    } catch {
      // 静默处理
    }
  }

  /** 试验分期数量 */
  async function fetchStage() {
    try {
      const res = await getCdeTrialStagesNum({
        ...buildCompanyParams(),
        queryYear: Number(stageYearFilter.value) || undefined
      })
      trialStageList.value = res.data || []
      drawRadarChart()
    } catch {
      // 静默处理
    }
  }

  /** 试验状态数量 */
  async function fetchStatus() {
    try {
      const res = await getCdeTrialStatusNum({
        ...buildCompanyParams(),
        queryYear: Number(statusYearFilter.value) || undefined
      })
      buildTrialStatusLegend(res.data || [])
    } catch {
      // 静默处理
    }
  }

  /** 产品试验榜单 */
  async function fetchProduct(refresh = false) {
    if (productLoading.value) return
    if (refresh) {
      productPageNum.value = 1
    }
    productLoading.value = true

    try {
      const res = await getCdeProductRank({
        ...buildCompanyParams(),
        pageNum: productPageNum.value,
        pageSize: productPageSize,
        queryYear: Number(productYearFilter.value) || undefined
      })
      const list = res.data?.list || []
      productList.value = refresh ? list : [...productList.value, ...list]
      productTotal.value = res.data?.total || 0
    } catch {
      // 静默处理
    } finally {
      productLoading.value = false
    }
  }

  /** 产品榜单滚动到底部加载更多 */
  function loadMoreProduct() {
    if (productHasMore.value && !productLoading.value) {
      productPageNum.value++
      fetchProduct()
    }
  }
  // #endregion

  // #region 筛选联动
  function onTrialStageChange(e: any) {
    trialStageFilter.value = trialStageOptions[Number(e.detail.value)]?.value || ''
    fetchApplicationNum()
  }

  function onStageYearChange(e: any) {
    stageYearFilter.value = yearOptions.value[Number(e.detail.value)]?.value || ''
    fetchStage()
  }

  function onStatusYearChange(e: any) {
    statusYearFilter.value = yearOptions.value[Number(e.detail.value)]?.value || ''
    fetchStatus()
  }

  function onProductYearChange(e: any) {
    productYearFilter.value = yearOptions.value[Number(e.detail.value)]?.value || ''
    fetchProduct(true)
  }
  // #endregion

  // #region 图表绘制
  // 画布适配与绘制细节统一在 utils/canvas-chart 维护，这里只负责准备数据
  function drawCharts() {
    drawLineChart()
    drawRadarChart()
  }

  function drawLineChart() {
    return renderLineChart(
      'lineCanvas',
      {
        values: applicationList.value.map((item) => Number(item.number) || 0),
        labels: applicationList.value.map((item) => shortYearLabel(item.year))
      },
      { instance }
    )
  }

  function drawRadarChart() {
    return renderRadarChart(
      'radarCanvas',
      {
        values: trialStageList.value.map((item) => Number(item.number) || 0),
        labels: trialStageList.value.map((item) => item.cleanedTrialStages)
      },
      { instance, minSides: 3 }
    )
  }
  // #endregion

  /**
   * 试验状态：根据接口数据生成环形渐变与图例
   */
  function buildTrialStatusLegend(data: CdeTrialStatusItem[]) {
    const list = data.filter((item) => (Number(item.number) || 0) > 0)
    const legend = list.map((item, index) => ({
      name: item.trialStatus,
      count: Number(item.number) || 0,
      color: CDE_TRIAL_STATUS_COLORS[item.trialStatus] || DONUT_COLORS[index % DONUT_COLORS.length]
    }))
    trialStatusLegend.value = legend

    const total = legend.reduce((sum, item) => sum + item.count, 0)
    if (!total) {
      donutGradient.value = 'conic-gradient(#eeeeee 0% 100%)'
      return
    }
    let acc = 0
    const segments = legend.map((item) => {
      const start = acc
      acc += (item.count / total) * 100
      return `${item.color} ${start}% ${acc}%`
    })
    donutGradient.value = `conic-gradient(${segments.join(', ')})`
  }
  // #endregion

  // #region 生命周期
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
    fetchApplicationNum()
    fetchStage()
    fetchStatus()
    fetchProduct()
  })

  onMounted(() => {
    // 延迟绘制，确保布局稳定
    setTimeout(() => drawCharts(), 100)
  })

  // 切换到统计 tab 时 canvas 会被重新创建，需要重新绘制
  watch(activeTab, (val) => {
    if (val === 'stat') {
      // 延迟绘制，给 v-if 重建留出时间
      setTimeout(() => drawCharts(), 100)
    }
  })
  // #endregion

  // #region 方法
  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  /**
   * 点击产品试验榜单行：切换到试验列表 tab，并携带产品名称、年份（若已选）筛选
   */
  function onProductClick(item: CdeProductRankItem) {
    selectedDrugName.value = item.drugStandardName
    selectedListYear.value = productYearFilter.value
    activeTab.value = 'list'
  }
  // #endregion
</script>

<style lang="scss" scoped src="./index.scss"></style>
