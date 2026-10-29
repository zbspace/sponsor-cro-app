<template>
  <view class="page-container">
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
    <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

    <!-- 选项卡 -->
    <view class="tabs">
      <view class="tab-item" :class="{ active: activeTab === 'stat' }" @click="activeTab = 'stat'">
        <text>IND统计</text>
        <view class="active-line" v-if="activeTab === 'stat'"></view>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
        <text>IND列表</text>
        <view class="active-line" v-if="activeTab === 'list'"></view>
      </view>
    </view>

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
        <!-- 统计内容 -->
        <view v-if="activeTab === 'stat'" class="stat-content">
          <!-- 近五年IND申请与获批 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">近五年IND申请与获批</view>
              <view class="filter-dropdown">
                <picker
                  class="filter-picker"
                  mode="selector"
                  :range="queryTypeOptions"
                  range-key="text"
                  @change="onQueryTypeChange"
                >
                  <view class="filter-trigger">
                    <text>{{ queryTypeText }}</text>
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

          <!-- 近五年来IND注册分类 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">近五年来IND注册分类</view>
              <view class="filter-dropdown">
                <picker
                  class="filter-picker"
                  mode="selector"
                  :range="categoryDrugTypeOptions"
                  range-key="text"
                  @change="onCategoryDrugTypeChange"
                >
                  <view class="filter-trigger">
                    <text>{{ categoryDrugTypeText }}</text>
                    <view class="arrow-down"></view>
                  </view>
                </picker>
              </view>
            </view>
            <view class="chart-container bar-chart">
              <!-- #ifdef MP-WEIXIN -->
              <canvas id="barCanvas" type="2d" class="canvas"></canvas>
              <!-- #endif -->
              <!-- #ifndef MP-WEIXIN -->
              <canvas canvas-id="barCanvas" class="canvas"></canvas>
              <!-- #endif -->
            </view>
            <view class="phase-table">
              <view class="table-header">
                <text v-for="(item, index) in categoryList" :key="index">{{ item.category }}</text>
                <text v-if="!categoryList.length">暂无数据</text>
              </view>
              <view class="table-body">
                <text v-for="(item, index) in categoryList" :key="index">{{ item.number }}</text>
                <text v-if="!categoryList.length">-</text>
              </view>
            </view>
          </view>

          <!-- 药物类型 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">药物类型</view>
              <view class="filter-dropdown">
                <picker
                  class="filter-picker"
                  mode="selector"
                  :range="yearOptions"
                  range-key="text"
                  @change="onDrugTypeYearChange"
                >
                  <view class="filter-trigger">
                    <text>{{ drugTypeYearText }}</text>
                    <view class="arrow-down"></view>
                  </view>
                </picker>
              </view>
            </view>
            <view class="donut-chart-wrapper">
              <view class="donut-chart" :style="{ background: donutGradient }"></view>
              <view class="legend-grid">
                <view class="legend-item" v-for="(item, index) in drugTypeLegend" :key="index">
                  <view class="dot" :style="{ backgroundColor: item.color }"></view>
                  <text class="name">{{ item.name }}</text>
                  <text class="count">{{ item.count }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 产品IND榜单 -->
          <view class="section-card">
            <view class="section-header">
              <view class="section-title">产品IND榜单</view>
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
                <text class="col-rank">#</text>
                <text class="col-name">产品</text>
                <text class="col-type">分类</text>
                <text class="col-count">条数</text>
              </view>
              <!-- #region 产品榜单滚动加载 -->
              <scroll-view
                scroll-y
                class="table-scroll"
                :show-scrollbar="false"
                enhanced
                @scrolltolower="loadMoreProduct"
              >
                <view class="table-body">
                  <view
                    class="table-row"
                    v-for="(item, index) in productList"
                    :key="index"
                    :class="[index % 2 === 1 ? 'zebra' : '', index < 3 ? 'top' + (index + 1) : '']"
                    @click="onProductClick(item)"
                  >
                    <text class="col-rank">{{ item.rankNo || index + 1 }}</text>
                    <text class="col-name">{{ item.drugStandardName }}</text>
                    <view class="col-type">
                      <text class="type-tag" v-if="item.cleanedClassification">
                        {{ item.cleanedClassification }}
                      </text>
                    </view>
                    <view class="col-count">
                      <view class="count-go">
                        <text>{{ item.indApplicationNum }}</text>
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

        <!-- 详情内容 (IND列表) -->
        <view v-else class="detail-content">
          <IndApplicationList
            class="ind-list-comp"
            :company-parent-id="companyParentId"
            v-model:product-name="listProductName"
            v-model:classification="listClassification"
          />
        </view>
      </view>
    </scroll-view>
  </view>
  <phone-bind-popup />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed, onMounted, watch, getCurrentInstance, nextTick } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import IndApplicationList from '@/components/ind-application-list/ind-application-list.vue'

  import {
    getIndApplicationNum,
    getIndRegistrationCategoryNum,
    getDrugTypeNum,
    getIndProductRank
  } from '@/api'
  import type {
    IndApplicationNumItem,
    RegistrationCategoryItem,
    DrugTypeNumItem,
    IndProductRankItem,
    PipelineCompanyQuery
  } from '@/types/api'
  import { DRUG_TYPE_VALUES, createEnumsToOptions } from '@/utils/enums'

  // #endregion

  // #region 页面状态
  const instance = getCurrentInstance()
  const activeTab = ref('stat')
  const menu = ref({ top: 0, left: 0, height: 0 })

  // 路由筛选参数（来自药企详情页）
  const companyName = ref('')
  const companyParentId = ref(0)
  // #endregion

  // #region 近五年IND申请与获批
  // 查询类型(1:申请,2:获批)
  const queryTypeOptions = [
    { value: 1, text: '申请' },
    { value: 2, text: '获批' }
  ]
  const applicationList = ref<IndApplicationNumItem[]>([])
  const queryTypeFilter = ref(1)
  const queryTypeText = computed(
    () => queryTypeOptions.find((o) => o.value === queryTypeFilter.value)?.text || '申请'
  )
  // #endregion

  // #region 近五年IND注册分类
  // 药品类型（注册分类接口筛选条件）
  const categoryDrugTypeOptions = [
    { value: '', text: '药品类型' },
    ...createEnumsToOptions(DRUG_TYPE_VALUES)
  ]
  const categoryList = ref<RegistrationCategoryItem[]>([])
  const categoryDrugTypeFilter = ref('')
  const categoryDrugTypeText = computed(
    () =>
      categoryDrugTypeOptions.find((o) => o.value === categoryDrugTypeFilter.value)?.text ||
      '药品类型'
  )
  // #endregion

  // #region 药物类型
  const drugTypeList = ref<DrugTypeNumItem[]>([])
  const drugTypeLegend = ref<{ name: string; count: number; color: string }[]>([])
  const donutGradient = ref('')
  const drugTypeYearFilter = ref(0)
  // #endregion

  // #region 产品IND榜单
  const productList = ref<IndProductRankItem[]>([])
  const productYearFilter = ref(0)
  const productPageNum = ref(1)
  const productPageSize = 10
  const productTotal = ref(0)
  const productLoading = ref(false)
  const productHasMore = computed(() => productList.value.length < productTotal.value)
  // 榜单点击后带入 IND 列表的药品名称
  const listProductName = ref('')
  // 榜单点击后带入 IND 列表的注册分类
  const listClassification = ref('')
  // #endregion

  // #region 年份选项
  // 环形图配色
  const DONUT_COLORS = ['#499AE6', '#7ED321', '#F5A623', '#9013FE', '#D0021B', '#50E3C2']
  const yearOptions = computed(() => [
    { value: 0, text: '年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: year, text: `${year}年` }
    })
  ])
  const drugTypeYearText = computed(
    () => yearOptions.value.find((o) => o.value === drugTypeYearFilter.value)?.text || '年份'
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
  /** 近五年IND申请/获批数量 */
  async function fetchApplicationNum() {
    try {
      const res = await getIndApplicationNum({
        ...buildCompanyParams(),
        queryType: queryTypeFilter.value
      })
      applicationList.value = res.data || []
      drawLineChart()
    } catch {
      // 静默处理
    }
  }

  /** 近五年IND注册分类数量 */
  async function fetchCategory() {
    try {
      const res = await getIndRegistrationCategoryNum({
        ...buildCompanyParams(),
        drugType: categoryDrugTypeFilter.value || undefined
      })
      categoryList.value = res.data || []
      drawBarChart()
    } catch {
      // 静默处理
    }
  }

  /** IND药品类型数量 */
  async function fetchDrugType() {
    try {
      const res = await getDrugTypeNum({
        ...buildCompanyParams(),
        queryYear: drugTypeYearFilter.value || undefined
      })
      drugTypeList.value = res.data || []
      buildDrugTypeLegend()
    } catch {
      // 静默处理
    }
  }

  /** 产品IND榜单 */
  async function fetchProduct(refresh = false) {
    if (productLoading.value) return
    if (refresh) {
      productPageNum.value = 1
    }
    productLoading.value = true

    try {
      const res = await getIndProductRank({
        ...buildCompanyParams(),
        pageNum: productPageNum.value,
        pageSize: productPageSize,
        queryYear: productYearFilter.value || undefined
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
  function onQueryTypeChange(e: any) {
    queryTypeFilter.value = queryTypeOptions[Number(e.detail.value)]?.value ?? 1
    fetchApplicationNum()
  }

  function onCategoryDrugTypeChange(e: any) {
    categoryDrugTypeFilter.value = categoryDrugTypeOptions[Number(e.detail.value)]?.value || ''
    fetchCategory()
  }

  function onDrugTypeYearChange(e: any) {
    drugTypeYearFilter.value = yearOptions.value[Number(e.detail.value)]?.value || 0
    fetchDrugType()
  }

  function onProductYearChange(e: any) {
    productYearFilter.value = yearOptions.value[Number(e.detail.value)]?.value || 0
    fetchProduct(true)
  }

  /**
   * 点击榜单产品：切到IND列表并按该产品名称过滤
   * @param item 榜单条目
   */
  function onProductClick(item: IndProductRankItem) {
    listProductName.value = item.drugStandardName || ''
    listClassification.value = item.cleanedClassification || ''
    activeTab.value = 'list'
  }
  // #endregion

  // #region 图表绘制
  // #ifdef MP-WEIXIN
  /**
   * 获取 canvas 2d 节点与上下文（同层渲染，解决原生组件层级盖住其他元素的问题）
   * @param canvasId 画布节点 id
   * @param retry 内部重试计数
   */
  function getCanvas2d(
    canvasId: string,
    retry = 0
  ): Promise<{ ctx: any; width: number; height: number } | null> {
    return new Promise((resolve) => {
      nextTick(() => {
        uni
          .createSelectorQuery()
          .in(instance?.proxy)
          .select(`#${canvasId}`)
          .fields({ node: true, size: true }, () => {})
          .exec((res) => {
            const node = res?.[0]?.node
            const width = res?.[0]?.width
            const height = res?.[0]?.height
            // v-if 重建后节点/尺寸可能未就绪，延迟重试避免绘制偏移
            if (!node || !width || !height) {
              if (retry < 12) {
                setTimeout(() => resolve(getCanvas2d(canvasId, retry + 1)), 80)
              } else {
                resolve(null)
              }
              return
            }
            const ctx = node.getContext('2d')
            const dpr = uni.getSystemInfoSync().pixelRatio || 1
            // 按设备像素比设置画布物理尺寸，避免模糊
            if (node.width !== width * dpr || node.height !== height * dpr) {
              node.width = width * dpr
              node.height = height * dpr
            }
            // 重置变换矩阵，避免重复调用导致累加缩放引起偏移和错位
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            resolve({ ctx, width, height })
          })
      })
    })
  }

  /**
   * 绘制近五年试验合作变化折线图（canvas 2d 版本）
   */
  async function drawLineChart2d() {
    const canvas = await getCanvas2d('lineCanvas')
    if (!canvas) return
    const ctx = canvas.ctx
    const width = canvas.width
    const height = canvas.height
    const padding = 20

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    const data = applicationList.value.map((item) => Number(item.number) || 0)
    const years = applicationList.value.map((item) => {
      const y = String(item.year)
      return y.length >= 4 ? `${y.slice(2)}年` : y
    })

    if (!data.length) {
      ctx.fillStyle = '#999999'
      ctx.font = '12px sans-serif'
      ctx.fillText('暂无数据', width / 2 - 24, height / 2)
      return
    }

    const maxVal = Math.max(...data, 1)
    const stepX = data.length > 1 ? (width - 2 * padding) / (data.length - 1) : 0
    const pointAt = (i: number) => ({
      x: padding + i * stepX,
      y: height - padding - (data[i] / maxVal) * (height - 2 * padding)
    })

    // 网格线
    ctx.strokeStyle = '#eeeeee'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const y = height - padding - (i / 4) * (height - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
      ctx.fillStyle = '#999999'
      ctx.font = '9px sans-serif'
      ctx.fillText(String(Math.round((maxVal * i) / 4)), 4, y + 3)
    }

    // 绘制渐变区域
    ctx.beginPath()
    data.forEach((_, i) => {
      const p = pointAt(i)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.lineTo(padding + (data.length - 1) * stepX, height - padding)
    ctx.lineTo(padding, height - padding)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding)
    gradient.addColorStop(0, 'rgba(73, 154, 230, 0.2)')
    gradient.addColorStop(1, 'rgba(73, 154, 230, 0)')
    ctx.fillStyle = gradient
    ctx.fill()

    // 绘制折线
    ctx.strokeStyle = '#499AE6'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((_, i) => {
      const p = pointAt(i)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    // 绘制数据点和年份
    data.forEach((_, i) => {
      const p = pointAt(i)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.strokeStyle = '#499AE6'
      ctx.stroke()

      ctx.fillStyle = '#999999'
      ctx.font = '10px sans-serif'
      ctx.fillText(years[i] || '', p.x - 12, height - 5)
    })
  }

  /**
   * 绘制近五年IND注册分类柱状图（canvas 2d 版本）
   */
  async function drawBarChart2d() {
    const canvas = await getCanvas2d('barCanvas')
    if (!canvas) return
    const ctx = canvas.ctx
    const width = canvas.width
    const height = canvas.height
    const padding = { top: 20, right: 16, bottom: 30, left: 36 }

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // x轴：注册分类；y轴：数量
    const labels = categoryList.value.map((item) => item.category)
    const values = categoryList.value.map((item) => Number(item.number) || 0)

    // 无数据时展示占位提示
    if (!labels.length) {
      ctx.fillStyle = '#999999'
      ctx.font = '12px sans-serif'
      ctx.fillText('暂无数据', width / 2 - 24, height / 2)
      return
    }

    const maxVal = Math.max(...values, 1)
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom
    const baseY = height - padding.bottom

    // 绘制背景网格与 y 轴刻度
    ctx.strokeStyle = '#eeeeee'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 4; i++) {
      const y = baseY - (i / 4) * chartH
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
      ctx.fillStyle = '#999999'
      ctx.font = '9px sans-serif'
      ctx.fillText(String(Math.round((maxVal * i) / 4)), 4, y + 3)
    }

    // 绘制柱体、数值与 x 轴标签
    const slot = chartW / labels.length
    const barW = Math.min(slot * 0.5, 28)
    values.forEach((val, i) => {
      const barH = (val / maxVal) * chartH
      const x = padding.left + slot * i + (slot - barW) / 2
      const y = baseY - barH
      const gradient = ctx.createLinearGradient(0, y, 0, baseY)
      gradient.addColorStop(0, '#499AE6')
      gradient.addColorStop(1, 'rgba(73, 154, 230, 0.4)')
      ctx.fillStyle = gradient
      ctx.fillRect(x, y, barW, barH)

      ctx.fillStyle = '#333333'
      ctx.font = '9px sans-serif'
      ctx.fillText(String(val), x + barW / 2 - 4, y - 4)

      const display = labels[i]?.length > 4 ? `${labels[i].slice(0, 4)}…` : labels[i] || ''
      ctx.fillStyle = '#999999'
      ctx.font = '9px sans-serif'
      ctx.fillText(display, x + barW / 2 - display.length * 4, height - 8)
    })
  }
  // #endif

  // #ifndef MP-WEIXIN
  /**
   * 绘制近五年试验合作变化折线图（旧版 canvas 接口）
   */
  function drawLineChartLegacy() {
    const ctx = uni.createCanvasContext('lineCanvas')
    const width = 300
    const height = 150
    const padding = 20

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    const data = applicationList.value.map((item) => Number(item.number) || 0)
    const years = applicationList.value.map((item) => {
      const y = String(item.year)
      return y.length >= 4 ? `${y.slice(2)}年` : y
    })

    if (!data.length) {
      ctx.setFillStyle('#999999')
      ctx.setFontSize(12)
      ctx.fillText('暂无数据', width / 2 - 24, height / 2)
      ctx.draw()
      return
    }

    const maxVal = Math.max(...data, 1)
    const stepX = data.length > 1 ? (width - 2 * padding) / (data.length - 1) : 0
    const pointAt = (i: number) => ({
      x: padding + i * stepX,
      y: height - padding - (data[i] / maxVal) * (height - 2 * padding)
    })

    // 网格线
    ctx.setStrokeStyle('#eeeeee')
    ctx.setLineWidth(0.5)
    for (let i = 0; i <= 4; i++) {
      const y = height - padding - (i / 4) * (height - 2 * padding)
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
      ctx.setFillStyle('#999999')
      ctx.setFontSize(9)
      ctx.fillText(String(Math.round((maxVal * i) / 4)), 4, y + 3)
    }

    // 绘制渐变区域
    ctx.beginPath()
    data.forEach((_, i) => {
      const p = pointAt(i)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.lineTo(padding + (data.length - 1) * stepX, height - padding)
    ctx.lineTo(padding, height - padding)
    ctx.closePath()
    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding)
    gradient.addColorStop(0, 'rgba(73, 154, 230, 0.2)')
    gradient.addColorStop(1, 'rgba(73, 154, 230, 0)')
    ctx.setFillStyle(gradient)
    ctx.fill()

    // 绘制折线
    ctx.setStrokeStyle('#499AE6')
    ctx.setLineWidth(2)
    ctx.beginPath()
    data.forEach((_, i) => {
      const p = pointAt(i)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    // 绘制数据点和年份
    data.forEach((_, i) => {
      const p = pointAt(i)
      ctx.setFillStyle('#ffffff')
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.setStrokeStyle('#499AE6')
      ctx.stroke()

      ctx.setFillStyle('#999999')
      ctx.setFontSize(10)
      ctx.fillText(years[i] || '', p.x - 12, height - 5)
    })

    ctx.draw()
  }

  /**
   * 绘制近五年IND注册分类柱状图（旧版 canvas 接口）
   */
  function drawBarChartLegacy() {
    const ctx = uni.createCanvasContext('barCanvas')
    const width = 300
    const height = 150
    const padding = { top: 20, right: 16, bottom: 30, left: 36 }

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // x轴：注册分类；y轴：数量
    const labels = categoryList.value.map((item) => item.category)
    const values = categoryList.value.map((item) => Number(item.number) || 0)

    // 无数据时展示占位提示
    if (!labels.length) {
      ctx.setFillStyle('#999999')
      ctx.setFontSize(12)
      ctx.fillText('暂无数据', width / 2 - 24, height / 2)
      ctx.draw()
      return
    }

    const maxVal = Math.max(...values, 1)
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom
    const baseY = height - padding.bottom

    // 绘制背景网格与 y 轴刻度
    ctx.setStrokeStyle('#eeeeee')
    ctx.setLineWidth(0.5)
    for (let i = 0; i <= 4; i++) {
      const y = baseY - (i / 4) * chartH
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
      ctx.setFillStyle('#999999')
      ctx.setFontSize(9)
      ctx.fillText(String(Math.round((maxVal * i) / 4)), 4, y + 3)
    }

    // 绘制柱体、数值与 x 轴标签
    const slot = chartW / labels.length
    const barW = Math.min(slot * 0.5, 28)
    values.forEach((val, i) => {
      const barH = (val / maxVal) * chartH
      const x = padding.left + slot * i + (slot - barW) / 2
      const y = baseY - barH
      const gradient = ctx.createLinearGradient(0, y, 0, baseY)
      gradient.addColorStop(0, '#499AE6')
      gradient.addColorStop(1, 'rgba(73, 154, 230, 0.4)')
      ctx.setFillStyle(gradient)
      ctx.fillRect(x, y, barW, barH)

      ctx.setFillStyle('#333333')
      ctx.setFontSize(9)
      ctx.fillText(String(val), x + barW / 2 - 4, y - 4)

      const display = labels[i]?.length > 4 ? `${labels[i].slice(0, 4)}…` : labels[i] || ''
      ctx.setFillStyle('#999999')
      ctx.setFontSize(9)
      ctx.fillText(display, x + barW / 2 - display.length * 4, height - 8)
    })

    ctx.draw()
  }
  // #endif

  function drawLineChart() {
    let p: void | Promise<void>
    // #ifdef MP-WEIXIN
    p = drawLineChart2d()
    // #endif
    // #ifndef MP-WEIXIN
    p = drawLineChartLegacy()
    // #endif
    return p
  }

  function drawBarChart() {
    let p: void | Promise<void>
    // #ifdef MP-WEIXIN
    p = drawBarChart2d()
    // #endif
    // #ifndef MP-WEIXIN
    p = drawBarChartLegacy()
    // #endif
    return p
  }

  function drawCharts() {
    drawLineChart()
    drawBarChart()
  }

  /**
   * 药物类型：根据接口数据生成环形渐变与图例
   */
  function buildDrugTypeLegend() {
    const legend = drugTypeList.value
      .filter((item) => (Number(item.number) || 0) > 0)
      .map((item, index) => ({
        name: item.drugType,
        count: Number(item.number) || 0,
        color: DONUT_COLORS[index % DONUT_COLORS.length]
      }))
    drugTypeLegend.value = legend

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
    fetchCategory()
    fetchDrugType()
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
  // #endregion
</script>

<style lang="scss" scoped>
  .page-container {
    height: calc(100vh);
    display: flex;
    flex-direction: column;
    .header,
    .tabs {
      flex: 0;
    }
    .container-scroll-view {
      flex: 1;
    }
  }

  .container-scroll-view {
    display: flex;
    flex-direction: column;
  }

  .container {
    padding: 0 30rpx 30rpx 30rpx;
    min-height: 100%;
    box-sizing: border-box;
  }

  .detail-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .ind-list-comp {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
  }

  /* 选项卡 */
  .tabs {
    display: flex;
    justify-content: space-around;
    margin-bottom: 30rpx;

    .tab-item {
      position: relative;
      padding: 20rpx 0;
      font-size: 28rpx;
      color: #999;

      &.active {
        color: #333;
        font-weight: bold;
      }

      .active-line {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 6rpx;
        background-color: #499ae6;
        border-radius: 3rpx;
      }
    }
  }

  .section-card {
    background: #ffffff;
    border-radius: 28rpx;
    padding: 28rpx 28rpx 24rpx;
    margin-bottom: 24rpx;
    box-shadow:
      0 2rpx 6rpx rgba(15, 23, 42, 0.06),
      0 2rpx 4rpx rgba(15, 23, 42, 0.04);

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20rpx;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 14rpx;
      font-size: 28rpx;
      font-weight: 600;
      color: #1f2329;

      &::before {
        content: '';
        flex-shrink: 0;
        width: 6rpx;
        height: 26rpx;
        background: #3d8bff;
        border-radius: 4rpx;
      }
    }

    .filter-dropdown {
      display: flex;
      align-items: center;
      font-size: 24rpx;
      color: #9ca3af;

      .filter-picker {
        display: flex;
      }

      .filter-trigger {
        display: flex;
        align-items: center;
      }

      .arrow-down {
        width: 0;
        height: 0;
        border-left: 8rpx solid transparent;
        border-right: 8rpx solid transparent;
        border-top: 8rpx solid #a9b4c4;
        margin-left: 8rpx;
      }
    }
  }

  .chart-container {
    width: 100%;
    height: 300rpx;
    position: relative;

    .canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  }

  .phase-table {
    margin-top: 20rpx;
    border: 1rpx solid #f0f0f0;
    border-radius: 12rpx;
    overflow: hidden;

    .table-header,
    .table-body {
      display: flex;
      text-align: center;
      font-size: 24rpx;

      text {
        flex: 1;
        padding: 16rpx 0;
        border-right: 1rpx solid #f0f0f0;
        &:last-child {
          border-right: none;
        }
      }
    }

    .table-header {
      background: #f8f9fb;
      color: #999;
    }

    .table-body {
      color: #333;
    }
  }

  .donut-chart-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 40rpx;
    padding: 20rpx 0;

    .donut-chart {
      width: 200rpx;
      height: 200rpx;
      border-radius: 50%;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120rpx;
        height: 120rpx;
        background: #ffffff;
        border-radius: 50%;
      }
    }

    .legend-grid {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16rpx;

      .legend-item {
        display: flex;
        align-items: center;
        font-size: 22rpx;

        .dot {
          width: 16rpx;
          height: 16rpx;
          border-radius: 4rpx;
          margin-right: 12rpx;
        }

        .name {
          color: #999;
          flex: 1;
        }

        .count {
          color: #333;
          margin-left: 20rpx;
        }
      }
    }
  }

  .data-table {
    border: 2rpx solid #edf0f5;
    border-radius: 20rpx;
    overflow: hidden;
    background: #ffffff;

    .table-header {
      display: flex;
      align-items: center;
      height: 64rpx;
      background: #f7f8fa;
      border-bottom: 2rpx solid #f1f4f8;
      font-size: 22rpx;
      font-weight: 500;
      color: #98a2b1;
    }

    /* #region 产品榜单滚动区域 */
    .table-scroll {
      height: 600rpx;
      box-sizing: border-box;
    }
    /* #endregion */

    .table-row {
      display: flex;
      align-items: center;
      height: 84rpx;
      font-size: 26rpx;
      color: #1f2329;

      & + .table-row {
        border-top: 2rpx solid #f1f4f8;
      }

      &.zebra {
        background: #fbfcfd;
      }

      &.top1 .col-rank {
        color: #f59e0b;
      }
      &.top2 .col-rank {
        color: #94a3b8;
      }
      &.top3 .col-rank {
        color: #c0834b;
      }
    }

    .col-rank {
      width: 100rpx;
      flex-shrink: 0;
      text-align: center;
      font-size: 24rpx;
      font-weight: 600;
      color: #98a2b1;
    }

    .col-name {
      flex: 1;
      min-width: 0;
      padding-right: 12rpx;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .col-type {
      width: 90rpx;
      flex-shrink: 0;
      text-align: center;
    }

    // 注册分类：浅橙标签
    .type-tag {
      display: inline-block;
      padding: 2rpx 12rpx;
      border-radius: 8rpx;
      background: #fff3df;
      color: #bc8218;
      font-size: 20rpx;
      font-weight: 500;
      line-height: 1.6;
    }

    .col-count {
      width: 90rpx;
      flex-shrink: 0;
      box-sizing: border-box;
      padding-right: 16rpx;
      text-align: right;
    }

    // 条数：浅蓝胶囊入口样式
    .count-go {
      display: inline-flex;
      align-items: center;
      gap: 2rpx;
      height: 48rpx;
      padding: 0 8rpx 0 16rpx;
      border-radius: 14rpx;
      background: #eff4ff;
      color: #2c6fdb;
      font-size: 26rpx;
      font-weight: 600;
    }

    .go-arrow {
      width: 12rpx;
      height: 12rpx;
      flex-shrink: 0;
      border-top: 4rpx solid rgba(44, 111, 219, 0.7);
      border-right: 4rpx solid rgba(44, 111, 219, 0.7);
      transform: rotate(45deg);
    }

    .empty-tip {
      padding: 40rpx 0;
      text-align: center;
      font-size: 24rpx;
      color: #999;
    }

    .loading-tip {
      padding: 24rpx 0;
      text-align: center;
      font-size: 24rpx;
      color: #999;
    }
  }

  .project-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
    position: relative;

    .project-title {
      font-size: 30rpx;
      color: #333;
      font-weight: 500;
      margin-bottom: 30rpx;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 20rpx;

      .info-item {
        display: flex;
        align-items: center;
        gap: 16rpx;
        .info-icon {
          width: 32rpx;
          height: 32rpx;
          image {
            width: 100%;
            height: 100%;
          }
        }
        .info-text {
          font-size: 26rpx;
          color: #999;
        }
      }
    }

    .action-btn {
      position: absolute;
      right: 30rpx;
      bottom: 30rpx;
      background: #499ae6;
      color: #ffffff;
      font-size: 24rpx;
      padding: 8rpx 24rpx;
      border-radius: 30rpx;
    }
  }
</style>
