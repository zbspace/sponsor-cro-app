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

  <scroll-view
    :scroll-y="activeTab === 'stat'"
    class="container-scroll-view"
    :show-scrollbar="false"
    :style="{
      height: `calc(100vh - ${menu.top}px - ${menu.height}px)`
    }"
  >
    <view
      class="container"
      :style="{
        height: activeTab === 'list' ? '100%' : 'auto',
        display: activeTab === 'list' ? 'flex' : 'block',
        flexDirection: 'column'
      }"
    >
      <!-- #region 查询来源：药企 & 研究者 & 医院 -->
      <view class="query-source-bar" v-if="querySourceText">
        <text class="source-label">查询内容：</text>
        <text class="source-value">{{ querySourceText }}</text>
      </view>
      <!-- #endregion -->

      <!-- 选项卡 -->
      <view class="tabs">
        <view
          class="tab-item"
          :class="{ active: activeTab === 'stat' }"
          @click="activeTab = 'stat'"
        >
          <text>统计</text>
          <view class="active-line" v-if="activeTab === 'stat'"></view>
        </view>
        <view
          class="tab-item"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          <text>试验列表</text>
          <view class="active-line" v-if="activeTab === 'list'"></view>
        </view>
      </view>

      <!-- 统计内容 -->
      <view v-if="activeTab === 'stat'" class="stat-content">
        <!-- 汇总统计 -->
        <view class="section-card">
          <view class="section-title" style="margin-bottom: 30rpx">汇总统计</view>
          <view class="summary-cards">
            <view class="summary-card purple">
              <text class="label">合作试验数</text>
              <text class="value">{{ summary.trialCount }}</text>
            </view>
            <view class="summary-card blue">
              <text class="label">合作研究者数</text>
              <text class="value">{{ summary.researcherCount }}</text>
            </view>
            <view class="summary-card cyan">
              <text class="label">合作产品数</text>
              <text class="value">{{ summary.productCount }}</text>
            </view>
          </view>
        </view>

        <!-- 近五年试验合作变化 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title">近五年试验合作变化</view>
            <view class="filter-dropdown">
              <picker
                class="filter-picker"
                mode="selector"
                :range="changeStageOptions"
                range-key="text"
                @change="onChangeStageChange"
              >
                <view class="filter-trigger">
                  <text>{{ changeStageText }}</text>
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
              <text>Ⅰ期</text>
              <text>Ⅱ期</text>
              <text>Ⅲ期</text>
              <text>Ⅳ期</text>
              <text>BE</text>
              <text>其他</text>
            </view>
            <view class="table-body">
              <text>{{ stageCounts.oneClass }}</text>
              <text>{{ stageCounts.twoClass }}</text>
              <text>{{ stageCounts.threeClass }}</text>
              <text>{{ stageCounts.fourClass }}</text>
              <text>{{ stageCounts.beClass }}</text>
              <text>{{ stageCounts.otherClass }}</text>
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
              <view class="legend-item" v-for="(item, index) in statusLegend" :key="index">
                <view class="dot" :style="{ backgroundColor: item.color }"></view>
                <text class="name">{{ item.name }}</text>
                <text class="count">{{ item.count }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 合作产品 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title">合作产品</view>
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
            <view class="table-body">
              <view
                class="table-row"
                v-for="(item, index) in productList"
                :key="index"
                hover-class="row-hover"
                :class="{ zebra: index % 2 === 1 }"
                @click="onProductClick(item)"
              >
                <text class="col-rank">{{ index + 1 }}</text>
                <text class="col-name">{{ item.drugStandardName }}</text>
                <text class="col-count highlight">{{ item.trialCount }}</text>
              </view>
              <view class="empty-tip" v-if="!productList.length">暂无数据</view>
            </view>
          </view>
        </view>

        <!-- 合作研究者情况 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title">合作研究者情况</view>
            <view class="filter-dropdown">
              <picker
                class="filter-picker"
                mode="selector"
                :range="yearOptions"
                range-key="text"
                @change="onResearcherYearChange"
              >
                <view class="filter-trigger">
                  <text>{{ researcherYearText }}</text>
                  <view class="arrow-down"></view>
                </view>
              </picker>
            </view>
          </view>
          <view class="data-table">
            <view class="table-header">
              <text class="col-rank">排名</text>
              <text class="col-name">研究者</text>
              <text class="col-count">临床试验数</text>
            </view>
            <view class="table-body">
              <view
                class="table-row"
                v-for="(item, index) in researcherList"
                :key="index"
                hover-class="row-hover"
                :class="{ zebra: index % 2 === 1 }"
                @click="onResearcherClick(item)"
              >
                <text class="col-rank">{{ index + 1 }}</text>
                <text class="col-name">{{ item.researcherName }}</text>
                <text class="col-count highlight">{{ item.trialCount }}</text>
              </view>
              <view class="empty-tip" v-if="!researcherList.length">暂无数据</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 详情内容 (复用现有的项目列表样式) -->
      <view v-else class="detail-content">
        <TrialList
          class="trial-list-comp"
          :company-parent-id="companyParentId"
          :hospital-id="hospitalId"
          :researcher-id="researcherId"
          :researcher-name="routeListResearcherName"
          :drug-name="selectedDrugName"
          :year="selectedListYear || routeListYear"
          :trial-stage="routeListStage"
          :trial-status="routeListStatus"
        />
      </view>
    </view>
  </scroll-view>

  <phone-bind-popup />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, reactive, computed, onMounted, watch, getCurrentInstance } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import TrialList from '@/components/trial-list/trial-list.vue'

  import {
    queryHospitalStatistics,
    queryHospitalCooperationChange,
    queryHospitalTrialStage,
    queryHospitalTrialStatus,
    queryHospitalCooperationProduct,
    queryHospitalCooperationResearcher
  } from '@/api'
  import type {
    CooperationSumItem,
    DrugStatisticsItem,
    HospitalStatisticsQuery,
    ResearcherStatisticsItem,
    TrialStatusResponse
  } from '@/types/api'
  import { TRIAL_PHASE_VALUES, createEnumsToOptions } from '@/utils/enums'
  import { renderLineChart, renderRadarChart, shortYearLabel } from '@/utils/canvas-chart'

  // #endregion

  // #region 页面基础状态与生命周期
  const instance = getCurrentInstance()
  const activeTab = ref('stat')
  const menu = ref({ top: 0, left: 0, height: 0 })

  // 路由筛选参数（来自搜索页选中的药企/医院/研究者）
  const companyName = ref('')
  const hospitalName = ref('')
  const companyParentId = ref(0)
  const hospitalId = ref(0)
  const researcherId = ref<number>()
  const researcherName = ref('')

  function goBack() {
    // 返回上一页；若无上一页（如直接进入）则回到首页
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  onLoad((options: any) => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    // 读取路由筛选参数
    if (options?.companyName) {
      companyName.value = decodeURIComponent(options.companyName)
    }
    if (options?.hospitalName) {
      hospitalName.value = decodeURIComponent(options.hospitalName)
    }
    if (options?.companyParentId) {
      companyParentId.value = Number(options.companyParentId)
    }
    if (options?.hosStandardId) {
      hospitalId.value = Number(options.hosStandardId)
    }
    if (options?.researcherId) {
      researcherId.value = Number(options.researcherId)
    }
    if (options?.researcherName) {
      researcherName.value = decodeURIComponent(options.researcherName)
      // 同步作为试验列表的研究者筛选条件
      routeListResearcherName.value = researcherName.value
    }
    // 试验列表筛选参数（来源：研究者合作记录页跳转）
    if (options?.year) {
      routeListYear.value = decodeURIComponent(options.year)
    }
    if (options?.trialStage) {
      routeListStage.value = decodeURIComponent(options.trialStage)
    }
    if (options?.trialStatus) {
      routeListStatus.value = decodeURIComponent(options.trialStatus)
    }
    // 支持从其它页面直接跳转到「试验列表」tab
    if (options?.tab === 'list') {
      activeTab.value = 'list'
    }
    fetchSummary()
    fetchChange()
    fetchStage()
    fetchStatus()
    fetchProduct()
    fetchResearcher()
  })

  onMounted(() => {
    // 延迟绘制，确保布局稳定
    setTimeout(() => drawCharts(), 100)
  })

  // 切换到统计 tab 时 canvas 会被重新创建，需要重新绘制
  watch(activeTab, (val) => {
    researcherId.value = undefined
    selectedDrugName.value = ''
    researcherName.value = ''
    if (val === 'stat') {
      // 延迟绘制，给 v-if 重建留出时间
      setTimeout(() => drawCharts(), 100)
    }
  })

  /**
   * 构造统计接口通用请求参数
   */
  function buildBaseParams(): HospitalStatisticsQuery {
    return {
      pageNum: 1,
      pageSize: 10,
      companyParentId: companyParentId.value || undefined,
      hosStandardId: hospitalId.value || undefined,
      researcherId: researcherId.value || undefined,
      researcherName: researcherName.value || undefined
    }
  }
  // #endregion

  // #region 汇总统计模块
  const summary = reactive({ trialCount: 0, researcherCount: 0, productCount: 0 })

  async function fetchSummary() {
    try {
      const res = await queryHospitalStatistics(buildBaseParams())
      if (res.data) {
        summary.trialCount = res.data.coopTrialNum ?? 0
        summary.researcherCount = res.data.coopResearcherNum ?? 0
        summary.productCount = res.data.coopProductNum ?? 0
      }
    } catch {
      // 静默处理
    }
  }
  // #endregion

  // #region 近五年试验合作变化模块
  const changeList = ref<CooperationSumItem[]>([])
  const changeStageFilter = ref('')
  const changeStageOptions = computed(() => [
    { value: '', text: '试验分期' },
    ...createEnumsToOptions(TRIAL_PHASE_VALUES)
  ])
  const changeStageText = computed(
    () => changeStageOptions.value.find((o) => o.value === changeStageFilter.value)?.text || '全部'
  )

  function onChangeStageChange(e: any) {
    const idx = Number(e.detail.value)
    changeStageFilter.value = changeStageOptions.value[idx]?.value || ''
    fetchChange()
  }

  async function fetchChange() {
    try {
      const params = buildBaseParams()
      if (changeStageFilter.value) {
        params.trialStage = changeStageFilter.value
      }
      const res = await queryHospitalCooperationChange(params)
      changeList.value = res.data?.cooperationSumList || []
      drawLineChart()
    } catch {
      // 静默处理
    }
  }
  // #endregion

  // #region 试验分期模块
  const stageCounts = reactive({
    oneClass: 0,
    twoClass: 0,
    threeClass: 0,
    fourClass: 0,
    beClass: 0,
    otherClass: 0
  })
  const stageYearFilter = ref('')
  const stageYearText = computed(
    () => yearOptions.value.find((o) => o.value === stageYearFilter.value)?.text || '全部'
  )

  function onStageYearChange(e: any) {
    const idx = Number(e.detail.value)
    stageYearFilter.value = yearOptions.value[idx]?.value || ''
    fetchStage()
  }

  async function fetchStage() {
    try {
      const params = buildBaseParams()
      if (stageYearFilter.value) {
        params.year = stageYearFilter.value
      }
      const res = await queryHospitalTrialStage(params)
      if (res.data) {
        stageCounts.oneClass = res.data.oneClassCount ?? 0
        stageCounts.twoClass = res.data.twoClassCount ?? 0
        stageCounts.threeClass = res.data.threeClassCount ?? 0
        stageCounts.fourClass = res.data.fourClassCount ?? 0
        stageCounts.beClass = res.data.beClassCount ?? 0
        stageCounts.otherClass = res.data.otherClassCount ?? 0
      }
      drawRadarChart()
    } catch {
      // 静默处理
    }
  }
  // #endregion

  // #region 试验状态模块
  const statusLegend = ref<{ name: string; count: number; color: string }[]>([])
  const donutGradient = ref('')
  const statusYearFilter = ref('')
  const statusYearText = computed(
    () => yearOptions.value.find((o) => o.value === statusYearFilter.value)?.text || '全部'
  )

  function onStatusYearChange(e: any) {
    const idx = Number(e.detail.value)
    statusYearFilter.value = yearOptions.value[idx]?.value || ''
    fetchStatus()
  }

  async function fetchStatus() {
    try {
      const params = buildBaseParams()
      if (statusYearFilter.value) {
        params.year = statusYearFilter.value
      }
      const res = await queryHospitalTrialStatus(params)
      buildStatusLegend(res.data || ({} as TrialStatusResponse))
    } catch {
      // 静默处理
    }
  }

  /**
   * 试验状态：根据接口数据生成环形渐变与图例
   */
  function buildStatusLegend(data: TrialStatusResponse) {
    const items: { key: keyof TrialStatusResponse; name: string; color: string }[] = [
      { key: 'trialingRecruiting', name: '进行中-招募中', color: '#499AE6' },
      { key: 'trialingRecruited', name: '进行中-招募完成', color: '#7ED321' },
      { key: 'trialing', name: '进行中-尚未招募', color: '#F5A623' },
      { key: 'completed', name: '已完成', color: '#9013FE' },
      { key: 'trialingTerminated', name: '主动暂停', color: '#D0021B' },
      { key: 'trialingIecTerminated', name: '被叫停', color: '#50E3C2' }
    ]

    const legend = items
      .filter((item) => (data[item.key] || 0) > 0)
      .map((item) => ({ name: item.name, count: data[item.key] || 0, color: item.color }))
    statusLegend.value = legend

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

  // #region 合作产品模块
  const productList = ref<DrugStatisticsItem[]>([])
  const productYearFilter = ref('')
  const productYearText = computed(
    () => yearOptions.value.find((o) => o.value === productYearFilter.value)?.text || '全部'
  )

  function onProductYearChange(e: any) {
    const idx = Number(e.detail.value)
    productYearFilter.value = yearOptions.value[idx]?.value || ''
    fetchProduct()
  }

  async function fetchProduct() {
    try {
      const params = buildBaseParams()
      if (productYearFilter.value) {
        params.year = productYearFilter.value
      }
      const res = await queryHospitalCooperationProduct(params)
      productList.value = res.data?.list || []
    } catch {
      // 静默处理
    }
  }

  /**
   * 点击合作产品行：切换到试验列表 tab，并携带产品名称、年份（若已选）筛选
   */
  function onProductClick(item: DrugStatisticsItem) {
    selectedDrugName.value = item.drugStandardName
    selectedListYear.value = productYearFilter.value
    activeTab.value = 'list'
  }
  // #endregion

  // #region 合作研究者情况模块
  const researcherList = ref<ResearcherStatisticsItem[]>([])
  const researcherYearFilter = ref('')
  const researcherYearText = computed(
    () => yearOptions.value.find((o) => o.value === researcherYearFilter.value)?.text || '全部'
  )

  function onResearcherYearChange(e: any) {
    const idx = Number(e.detail.value)
    researcherYearFilter.value = yearOptions.value[idx]?.value || ''
    fetchResearcher()
  }

  async function fetchResearcher() {
    try {
      const params = buildBaseParams()
      if (researcherYearFilter.value) {
        params.year = researcherYearFilter.value
      }
      const res = await queryHospitalCooperationResearcher(params)
      researcherList.value = res.data?.list || []
    } catch {
      // 静默处理
    }
  }

  /**
   * 点击研究者行：切换到试验列表 tab，并携带年份（若已选）筛选
   */
  function onResearcherClick(item: ResearcherStatisticsItem) {
    researcherId.value = item.researcherId || 0
    selectedDrugName.value = ''
    selectedListYear.value = researcherYearFilter.value
    activeTab.value = 'list'
  }
  // #endregion

  // #region 通用辅助逻辑
  const yearOptions = computed(() => [
    { value: '', text: '年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年` }
    })
  ])

  // 点击产品/研究者行进入试验列表时携带的产品名称筛选
  const selectedDrugName = ref('')
  // 点击产品/研究者行进入试验列表时携带的年份筛选
  const selectedListYear = ref('')

  // #region 路由跳转带入的试验列表筛选条件
  // 来源：研究者/医院合作记录页点击行跳转到「试验列表」tab
  const routeListResearcherName = ref('')
  const routeListYear = ref('')
  const routeListStage = ref('')
  const routeListStatus = ref('')
  // #endregion

  // #region 查询内容展示文案：药企 & 研究者（医生） 医院（医院）
  const querySourceText = computed(() => {
    const parts: string[] = []
    if (companyName.value) parts.push(companyName.value)
    // 读取路由变量：切 Tab 会清空 researcherName，不能直接用它
    if (routeListResearcherName.value) parts.push(`${routeListResearcherName.value}`)
    let text = parts.join('&')
    if (hospitalName.value) {
      // 与研究者成对出现时标注医院身份，单独出现时保持原有展示
      const hospital = routeListResearcherName.value ? `${hospitalName.value}` : hospitalName.value
      text = text ? `${text} ${hospital}` : hospital
    }
    return text
  })
  // #endregion
  // #endregion

  // #region 图表绘制逻辑
  // 画布适配与绘制细节统一在 utils/canvas-chart 维护，这里只负责准备数据
  function drawCharts() {
    drawLineChart()
    drawRadarChart()
  }

  function drawLineChart() {
    return renderLineChart(
      'lineCanvas',
      {
        values: changeList.value.map((item) => Number(item.cooperationCount) || 0),
        labels: changeList.value.map((item) => shortYearLabel(item.year))
      },
      { instance }
    )
  }

  function drawRadarChart() {
    return renderRadarChart(
      'radarCanvas',
      {
        values: [
          stageCounts.oneClass,
          stageCounts.twoClass,
          stageCounts.threeClass,
          stageCounts.fourClass,
          stageCounts.beClass,
          stageCounts.otherClass
        ],
        labels: ['Ⅰ期', 'Ⅱ期', 'Ⅲ期', 'Ⅳ期', 'BE', '其他']
      },
      { instance }
    )
  }
  // #endregion
</script>

<style lang="scss" scoped src="./index.scss"></style>
