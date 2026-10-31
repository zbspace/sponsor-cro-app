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

  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

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
      <!-- 选项卡 -->
      <view class="tabs">
        <view
          class="tab-item"
          :class="{ active: activeTab === 'stat' }"
          @click="activeTab = 'stat'"
        >
          <text>NDA统计</text>
          <view class="active-line" v-if="activeTab === 'stat'"></view>
        </view>
        <view
          class="tab-item"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          <text>NDA列表</text>
          <view class="active-line" v-if="activeTab === 'list'"></view>
        </view>
      </view>

      <!-- 统计内容 -->
      <view v-if="activeTab === 'stat'" class="stat-content">
        <!-- 近五年NDA申请与获批 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title">近五年NDA申请与获批</view>
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

        <!-- 注册分类 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title">近5年NDA申请注册分类</view>
            <view class="filter-dropdown">
              <picker
                class="filter-picker"
                mode="selector"
                :range="drugTypeOptions"
                range-key="text"
                @change="onDrugTypeChange"
              >
                <view class="filter-trigger">
                  <text>{{ drugTypeText }}</text>
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
              <text v-for="item in registerCategoryList" :key="item.label">{{ item.label }}</text>
            </view>
            <view class="table-body">
              <text v-for="item in registerCategoryList" :key="item.label">{{ item.count }}</text>
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

        <!-- 产品NDA榜单 -->
        <view class="section-card">
          <view class="section-header">
            <view class="section-title">产品NDA榜单</view>
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
              <text class="col-name">产品</text>
              <text class="col-category">注册分类</text>
              <text class="col-count">NDA申请记录</text>
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
                  <text class="col-rank">{{ index + 1 }}</text>
                  <text class="col-name">{{ item.productName }}</text>
                  <view class="col-category">
                    <text class="type-tag" v-if="item.cleanedClassification">
                      {{ item.cleanedClassification }}
                    </text>
                    <text v-else>--</text>
                  </view>
                  <view class="col-count">
                    <view class="count-go">
                      <text>{{ item.applyCount }}</text>
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

      <!-- 详情内容 (复用现有的项目列表样式) -->
      <view v-else class="detail-content">
        <NdaList
          class="trial-list-comp"
          :company-parent-id="companyParentId"
          v-model:product-name="listProductName"
        />
      </view>
    </view>
  </scroll-view>

  <phone-bind-popup />
</template>

<script setup lang="ts">
  // #region 导入与类型定义
  import { ref, computed, onMounted, watch, getCurrentInstance, nextTick } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import NdaList from '@/components/nda-list/nda-list.vue'
  import {
    queryDrugTypeStatistics,
    queryNdaLastYearApplyAndApprove,
    queryNdaLastYearRegisterCategory,
    queryProjectRank
  } from '@/api'
  import type {
    NdaDataStatisticsParam,
    NdaDrugTypeVo,
    NdaLastYearRegisterCategoryVo,
    NdaProductRankVo,
    NdaProjectSumVo
  } from '@/types/api'
  import { DRUG_TYPE_VALUES_INT, createEnumsToOptions } from '@/utils/enums'
  // #endregion

  // #region 基础状态与生命周期
  const instance = getCurrentInstance()
  const activeTab = ref('stat')
  const menu = ref({ top: 0, left: 0, height: 0 })

  // 路由筛选参数（来自搜索页选中的药企）
  const companyName = ref('')
  const companyParentId = ref(0)

  onLoad((options: any) => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    // 读取路由筛选参数（company-detail 传入 companyId 作为药企母公司ID）
    if (options?.companyName) {
      companyName.value = decodeURIComponent(options.companyName)
    }
    if (options?.companyId) {
      companyParentId.value = Number(options.companyId)
    }
    fetchApplyAndApprove()
    fetchRegisterCategory()
    fetchDrugType()
    fetchProductRank()
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

  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  /**
   * 构造 NDA 统计接口通用请求参数
   */
  function buildBaseParams(): NdaDataStatisticsParam {
    return {
      pageNum: 1,
      pageSize: 10,
      parentCompanyId: companyParentId.value || undefined
    }
  }
  // #endregion

  // #region 公共下拉选项
  const yearOptions = computed(() => [
    { value: '', text: '年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年` }
    })
  ])
  // #endregion

  // #region 近五年NDA申请与获批
  const projectSumList = ref<NdaProjectSumVo[]>([])
  const queryTypeOptions = [
    { value: 0, text: '申请' },
    { value: 1, text: '获批' }
  ]
  const queryType = ref(queryTypeOptions[0].value)
  const queryTypeText = computed(
    () => queryTypeOptions.find((o) => o.value === queryType.value)?.text || '申请'
  )

  async function fetchApplyAndApprove() {
    try {
      const res = await queryNdaLastYearApplyAndApprove({
        parentCompanyId: companyParentId.value || undefined,
        queryType: queryType.value
      })
      projectSumList.value = res.data?.projectSumList || []
      drawLineChart()
    } catch {
      // 静默处理
    }
  }

  function onQueryTypeChange(e: any) {
    const idx = Number(e.detail.value)
    const option = queryTypeOptions[idx]
    if (!option) return
    queryType.value = option.value
    fetchApplyAndApprove()
  }
  // #endregion

  // #region 注册分类统计
  const drugTypeOptions = computed(() => createEnumsToOptions(DRUG_TYPE_VALUES_INT))
  const drugTypeCode = ref(drugTypeOptions.value[0].value)
  const drugTypeText = computed(
    () => drugTypeOptions.value.find((o) => o.value === drugTypeCode.value)?.text || '药品类型'
  )
  const registerCategoryList = ref<{ label: string; count: number }[]>([])

  async function fetchRegisterCategory() {
    const res = await queryNdaLastYearRegisterCategory({
      parentCompanyId: companyParentId.value || undefined,
      drugTypeCode: drugTypeCode.value,
      // 清洗后药品类型（枚举文案），如：化药、疫苗、治疗生物药、中药
      cleanedDrugType: drugTypeOptions.value.find((o) => o.value === drugTypeCode.value)?.text
    })
    registerCategoryList.value = buildRegisterCategoryList(res.data)
    drawBarChart()
  }

  function onDrugTypeChange(e: any) {
    const idx = Number(e.detail.value)
    const option = drugTypeOptions.value[idx]
    if (!option) return
    drugTypeCode.value = option.value
    fetchRegisterCategory()
  }

  function buildRegisterCategoryList(data?: NdaLastYearRegisterCategoryVo) {
    if (!data) return []
    return [
      { label: '1类', count: Number(data.registerCategory1) || 0 },
      { label: '2类', count: Number(data.registerCategory2) || 0 },
      { label: '3类', count: Number(data.registerCategory3) || 0 },
      { label: '4类', count: Number(data.registerCategory4) || 0 },
      { label: '5类', count: Number(data.registerCategory5) || 0 },
      { label: '其他', count: Number(data.registerCategoryOther) || 0 }
    ]
  }
  // #endregion

  // #region 药物类型分布 (Donut)
  const drugTypeLegend = ref<{ name: string; count: number; color: string }[]>([])
  const donutGradient = ref('')
  const drugTypeYearFilter = ref('')
  const drugTypeYearText = computed(
    () => yearOptions.value.find((o) => o.value === drugTypeYearFilter.value)?.text || '全部'
  )

  async function fetchDrugType() {
    try {
      const params = buildBaseParams()
      if (drugTypeYearFilter.value) {
        params.year = drugTypeYearFilter.value
      }
      const res = await queryDrugTypeStatistics(params)
      buildDrugTypeLegend(res.data || ({} as NdaDrugTypeVo))
    } catch {
      // 静默处理
    }
  }

  function onDrugTypeYearChange(e: any) {
    const idx = Number(e.detail.value)
    drugTypeYearFilter.value = yearOptions.value[idx]?.value || ''
    fetchDrugType()
  }

  function buildDrugTypeLegend(data: NdaDrugTypeVo) {
    const items: { key: keyof NdaDrugTypeVo; name: string; color: string }[] = [
      { key: 'drugTypeCountHuaYao', name: '化药', color: '#F5A623' },
      { key: 'drugTypeCountZhongYao', name: '中药/天然药物', color: '#9013FE' },
      { key: 'drugTypeCountYfShengWu', name: '预防用生物制品', color: '#499AE6' },
      { key: 'drugTypeCountZlShengWu', name: '治疗用生物制品', color: '#7ED321' },
      { key: 'drugTypeCountOther', name: '其他', color: '#D0021B' }
    ]

    const legend = items
      .filter((item) => (Number(data[item.key]) || 0) > 0)
      .map((item) => ({ name: item.name, count: Number(data[item.key]) || 0, color: item.color }))
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

  // #region 产品NDA榜单
  const productList = ref<NdaProductRankVo[]>([])
  const productYearFilter = ref('')
  const productPageNum = ref(1)
  const productPageSize = 10
  const productLoading = ref(false)
  const listProductName = ref('')
  const productHasMore = ref(false)
  const productYearText = computed(
    () => yearOptions.value.find((o) => o.value === productYearFilter.value)?.text || '全部'
  )

  async function fetchProductRank(refresh = false) {
    if (productLoading.value) return
    if (refresh) {
      productPageNum.value = 1
    }
    productLoading.value = true

    const params = buildBaseParams()
    if (productYearFilter.value) {
      params.year = productYearFilter.value
    }
    const res = await queryProjectRank({
      ...params,
      pageNum: productPageNum.value,
      pageSize: productPageSize
    })
    const list = res.data?.list || []

    productList.value = refresh ? list : [...productList.value, ...list]
    productHasMore.value = list.length >= productPageSize
    productLoading.value = false
  }

  function loadMoreProduct() {
    if (productHasMore.value && !productLoading.value) {
      productPageNum.value++
      fetchProductRank()
    }
  }

  function onProductYearChange(e: any) {
    const idx = Number(e.detail.value)
    productYearFilter.value = yearOptions.value[idx]?.value || ''
    fetchProductRank(true)
  }

  function onProductClick(item: NdaProductRankVo) {
    listProductName.value = item.productName || ''
    activeTab.value = 'list'
  }
  // #endregion

  // #region 图表绘制逻辑
  // #ifdef MP-WEIXIN
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
            if (node.width !== width * dpr || node.height !== height * dpr) {
              node.width = width * dpr
              node.height = height * dpr
            }
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            resolve({ ctx, width, height })
          })
      })
    })
  }

  async function drawLineChart2d() {
    const canvas = await getCanvas2d('lineCanvas')
    if (!canvas) return
    const ctx = canvas.ctx
    const width = canvas.width
    const height = canvas.height
    const padding = 20

    ctx.clearRect(0, 0, width, height)
    const data = projectSumList.value.map((item) => Number(item.projectCount) || 0)
    const years = projectSumList.value.map((item) => {
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

    ctx.strokeStyle = '#499AE6'
    ctx.lineWidth = 2
    ctx.beginPath()
    data.forEach((_, i) => {
      const p = pointAt(i)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    data.forEach((_, i) => {
      const p = pointAt(i)
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.strokeStyle = '#499AE6'
      ctx.stroke()
      const valText = String(data[i])
      ctx.fillStyle = '#499AE6'
      ctx.font = '10px sans-serif'
      ctx.fillText(valText, p.x - valText.length * 3, p.y - 8)
      ctx.fillStyle = '#999999'
      ctx.font = '10px sans-serif'
      ctx.fillText(years[i] || '', p.x - 12, height - 5)
    })
  }

  async function drawBarChart2d() {
    const canvas = await getCanvas2d('barCanvas')
    if (!canvas) return
    const ctx = canvas.ctx
    const width = canvas.width
    const height = canvas.height
    const padding = { top: 20, right: 16, bottom: 30, left: 36 }

    ctx.clearRect(0, 0, width, height)
    const labels = registerCategoryList.value.map((item) => item.label)
    const values = registerCategoryList.value.map((item) => Number(item.count) || 0)

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
  function drawLineChartLegacy() {
    const ctx = uni.createCanvasContext('lineCanvas')
    const width = 300
    const height = 150
    const padding = 20
    ctx.clearRect(0, 0, width, height)
    const data = projectSumList.value.map((item) => Number(item.projectCount) || 0)
    const years = projectSumList.value.map((item) => {
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

    ctx.setStrokeStyle('#499AE6')
    ctx.setLineWidth(2)
    ctx.beginPath()
    data.forEach((_, i) => {
      const p = pointAt(i)
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    data.forEach((_, i) => {
      const p = pointAt(i)
      ctx.setFillStyle('#ffffff')
      ctx.beginPath()
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI)
      ctx.fill()
      ctx.setStrokeStyle('#499AE6')
      ctx.stroke()
      const valText = String(data[i])
      ctx.setFillStyle('#499AE6')
      ctx.setFontSize(10)
      ctx.fillText(valText, p.x - valText.length * 3, p.y - 8)
      ctx.setFillStyle('#999999')
      ctx.setFontSize(10)
      ctx.fillText(years[i] || '', p.x - 12, height - 5)
    })
    ctx.draw()
  }

  function drawBarChartLegacy() {
    const ctx = uni.createCanvasContext('barCanvas')
    const width = 300
    const height = 150
    const padding = { top: 20, right: 16, bottom: 30, left: 36 }
    ctx.clearRect(0, 0, width, height)
    const labels = registerCategoryList.value.map((item) => item.label)
    const values = registerCategoryList.value.map((item) => Number(item.count) || 0)

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
  // #endregion
</script>

<style lang="scss" scoped>
  .container-scroll-view {
    display: flex;
    flex-direction: column;
  }

  .container {
    padding: 30rpx;
    min-height: 100%;
    box-sizing: border-box;
  }

  .detail-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;

    .trial-list-comp {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
  }

  .tabs {
    display: flex;
    justify-content: center;
    gap: 120rpx;
    margin-bottom: 40rpx;

    .tab-item {
      position: relative;
      font-size: 32rpx;
      color: #999;
      padding-bottom: 12rpx;

      &.active {
        color: #499ae6;
        font-weight: bold;
      }

      .active-line {
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 6rpx;
        background: #499ae6;
        border-radius: 3rpx;
      }
    }
  }

  .section-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.02);

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30rpx;
    }

    .section-title {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      position: relative;
      padding-left: 20rpx;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8rpx;
        height: 24rpx;
        background: #499ae6;
        border-radius: 4rpx;
      }
    }

    .filter-dropdown {
      display: flex;
      align-items: center;
      font-size: 24rpx;
      color: #999;

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
        border-top: 10rpx solid #999;
        margin-left: 10rpx;
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

  /* #region 产品NDA榜单表格 */
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

      // 前三名名次高亮
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
      width: 90rpx;
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

    .col-category {
      width: 120rpx;
      flex-shrink: 0;
      text-align: center;
      font-size: 24rpx;
      color: #98a2b1;
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
      width: 160rpx;
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
  /* #endregion */

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
