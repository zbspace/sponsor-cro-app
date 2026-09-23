<template>
  <!-- 头部导航 -->
  <view class="header header-fixed" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">{{ companyName }}</text>
    <view class="nav-right"></view>
  </view>

  <!-- 占位，防止固定定位后内容上移 -->
  <view :style="{ height: `${menu.top + menu.height}px` }"></view>

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
            <view class="section-title">注册分类</view>
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
              <text class="col-name">项目名称</text>
              <text class="col-category">注册分类</text>
              <text class="col-count">申请数量</text>
            </view>
            <view class="table-body">
              <view
                class="table-row"
                v-for="(item, index) in productList"
                :key="index"
                :class="{ zebra: index % 2 === 1 }"
              >
                <text class="col-rank">{{ index + 1 }}</text>
                <text class="col-name">{{ item.projectName }}</text>
                <text class="col-category">{{ item.registerCategoryName || '--' }}</text>
                <text class="col-count">{{ item.applyCount }}</text>
              </view>
              <view class="empty-tip" v-if="!productList.length">暂无数据</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 详情内容 (复用现有的项目列表样式) -->
      <view v-else class="detail-content">
        <NdaList class="trial-list-comp" :company-parent-id="companyParentId" />
      </view>
    </view>
  </scroll-view>

  <phone-bind-popup />
</template>

<script setup lang="ts">
  // #region 导入
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

  // #endregion

  // #region 页面状态
  const instance = getCurrentInstance()
  const activeTab = ref('stat')
  const menu = ref({ top: 0, left: 0, height: 0 })

  // 路由筛选参数（来自搜索页选中的药企）
  const companyName = ref('')
  const companyParentId = ref(0)
  // #endregion

  // #region 药品类型下拉选项（注册分类接口按药品类型分别统计）
  const DRUG_TYPE_OPTIONS = [
    { value: 1, text: '化药' },
    { value: 2, text: '预防用生物制品' },
    { value: 3, text: '治疗用生物制品' },
    { value: 4, text: '中药/天然药物' }
  ]
  const drugTypeOptions = computed(() => DRUG_TYPE_OPTIONS)
  const drugTypeCode = ref(DRUG_TYPE_OPTIONS[0].value)
  const drugTypeText = computed(
    () => DRUG_TYPE_OPTIONS.find((o) => o.value === drugTypeCode.value)?.text || '药品类型'
  )
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
  // #endregion

  // #region 注册分类（药品类型下的注册分类数量）
  const registerCategoryList = ref<{ label: string; count: number }[]>([])
  // #endregion

  // #region 药物类型
  const drugTypeLegend = ref<{ name: string; count: number; color: string }[]>([])
  const donutGradient = ref('')
  const drugTypeYearFilter = ref('')
  // #endregion

  // #region 产品NDA榜单
  const productList = ref<NdaProductRankVo[]>([])
  const productYearFilter = ref('')
  // #endregion

  // #region 年份选项
  const yearOptions = computed(() => [
    { value: '', text: '年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年` }
    })
  ])
  const drugTypeYearText = computed(
    () => yearOptions.value.find((o) => o.value === drugTypeYearFilter.value)?.text || '全部'
  )
  const productYearText = computed(
    () => yearOptions.value.find((o) => o.value === productYearFilter.value)?.text || '全部'
  )
  // #endregion

  // #region 请求参数构造
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

  // #region 数据请求
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

  async function fetchRegisterCategory() {
    try {
      const res = await queryNdaLastYearRegisterCategory({
        parentCompanyId: companyParentId.value || undefined,
        drugTypeCode: drugTypeCode.value
      })
      registerCategoryList.value = buildRegisterCategoryList(res.data)
      drawRadarChart()
    } catch {
      // 静默处理
    }
  }

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

  async function fetchProductRank() {
    try {
      const params = buildBaseParams()
      if (productYearFilter.value) {
        params.year = productYearFilter.value
      }
      const res = await queryProjectRank(params)
      productList.value = res.data || []
    } catch {
      // 静默处理
    }
  }
  // #endregion

  // #region 筛选联动
  function onQueryTypeChange(e: any) {
    const idx = Number(e.detail.value)
    const option = queryTypeOptions[idx]
    if (!option) return
    queryType.value = option.value
    fetchApplyAndApprove()
  }

  function onDrugTypeChange(e: any) {
    const idx = Number(e.detail.value)
    const option = DRUG_TYPE_OPTIONS[idx]
    if (!option) return
    drugTypeCode.value = option.value
    fetchRegisterCategory()
  }

  function onDrugTypeYearChange(e: any) {
    const idx = Number(e.detail.value)
    drugTypeYearFilter.value = yearOptions.value[idx]?.value || ''
    fetchDrugType()
  }

  function onProductYearChange(e: any) {
    const idx = Number(e.detail.value)
    productYearFilter.value = yearOptions.value[idx]?.value || ''
    fetchProductRank()
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
   * 绘制试验分期雷达图（canvas 2d 版本）
   */
  async function drawRadarChart2d() {
    const canvas = await getCanvas2d('radarCanvas')
    if (!canvas) return
    const ctx = canvas.ctx
    const width = canvas.width
    const height = canvas.height
    const center = { x: width / 2, y: height / 2 }
    const radius = Math.min(width, height) * 0.36
    const labels = registerCategoryList.value.map((item) => item.label)
    const values = registerCategoryList.value.map((item) => Number(item.count) || 0)
    const sides = Math.max(labels.length, 3)
    const maxVal = Math.max(...values, 1)

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    if (!labels.length) {
      ctx.fillStyle = '#999999'
      ctx.font = '12px sans-serif'
      ctx.fillText('暂无数据', width / 2 - 24, height / 2)
      return
    }

    // 绘制背景网格
    ctx.strokeStyle = '#eeeeee'
    ctx.lineWidth = 1
    for (let r = 1; r <= 5; r++) {
      ctx.beginPath()
      const currentRadius = (radius / 5) * r
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
        const x = center.x + Math.cos(angle) * currentRadius
        const y = center.y + Math.sin(angle) * currentRadius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }

    // 绘制数据区域
    ctx.fillStyle = 'rgba(245, 166, 35, 0.3)'
    ctx.strokeStyle = '#F5A623'
    ctx.beginPath()
    values.forEach((val, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
      const x = center.x + Math.cos(angle) * radius * (val / maxVal)
      const y = center.y + Math.sin(angle) * radius * (val / maxVal)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 绘制轴线及分类标签
    ctx.fillStyle = '#999999'
    ctx.font = '10px sans-serif'
    labels.forEach((label, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
      const x = center.x + Math.cos(angle) * (radius + 12)
      const y = center.y + Math.sin(angle) * (radius + 12)
      const textX = Math.min(Math.max(x - 12, 2), width - 4)
      const textY = Math.min(Math.max(y + 4, 10), height - 2)
      ctx.fillText(label, textX, textY)
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
   * 绘制试验分期雷达图（旧版 canvas 接口）
   */
  function drawRadarChartLegacy() {
    const ctx = uni.createCanvasContext('radarCanvas')
    const center = { x: 150, y: 80 }
    const radius = 55
    const labels = registerCategoryList.value.map((item) => item.label)
    const values = registerCategoryList.value.map((item) => Number(item.count) || 0)
    const sides = Math.max(labels.length, 3)
    const maxVal = Math.max(...values, 1)

    // 清空画布
    ctx.clearRect(0, 0, 300, 150)

    if (!labels.length) {
      ctx.setFillStyle('#999999')
      ctx.setFontSize(12)
      ctx.fillText('暂无数据', 126, 80)
      ctx.draw()
      return
    }

    // 绘制背景网格
    ctx.setStrokeStyle('#eeeeee')
    ctx.setLineWidth(1)
    for (let r = 1; r <= 5; r++) {
      ctx.beginPath()
      const currentRadius = (radius / 5) * r
      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
        const x = center.x + Math.cos(angle) * currentRadius
        const y = center.y + Math.sin(angle) * currentRadius
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.stroke()
    }

    // 绘制数据区域
    ctx.setFillStyle('rgba(245, 166, 35, 0.3)')
    ctx.setStrokeStyle('#F5A623')
    ctx.beginPath()
    values.forEach((val, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
      const x = center.x + Math.cos(angle) * radius * (val / maxVal)
      const y = center.y + Math.sin(angle) * radius * (val / maxVal)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // 绘制轴线及分类标签
    ctx.setFillStyle('#999999')
    ctx.setFontSize(10)
    labels.forEach((label, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
      const x = center.x + Math.cos(angle) * (radius + 12)
      const y = center.y + Math.sin(angle) * (radius + 12)
      const textX = Math.min(Math.max(x - 12, 2), 296)
      const textY = Math.min(Math.max(y + 4, 10), 148)
      ctx.fillText(label, textX, textY)
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

  function drawRadarChart() {
    let p: void | Promise<void>
    // #ifdef MP-WEIXIN
    p = drawRadarChart2d()
    // #endif
    // #ifndef MP-WEIXIN
    p = drawRadarChartLegacy()
    // #endif
    return p
  }

  function drawCharts() {
    drawLineChart()
    drawRadarChart()
  }

  /**
   * 注册分类：接口返回 registerCategory1~5 + other 的对象，转换为雷达图/表格数据
   */
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

  /**
   * 药物类型：根据接口数据生成环形渐变与图例
   */
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

  // #region 生命周期
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
  // #endregion

  // #region 方法
  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .header-fixed {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background: #fff;
    z-index: 1000;
  }

  .container-scroll-view {
    display: flex;
    flex-direction: column;
  }

  .container {
    padding: 30rpx;
    padding-bottom: 60rpx;
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

  .data-table {
    .table-header {
      display: flex;
      padding: 20rpx 0;
      font-size: 26rpx;
      color: #999;
      border-bottom: 1rpx solid #f8f8f8;
    }

    .table-row {
      display: flex;
      padding: 24rpx 0;
      font-size: 28rpx;
      color: #333;

      &.zebra {
        background: #fafbfc;
      }
    }

    .col-rank {
      width: 100rpx;
      text-align: center;
    }
    .col-name {
      flex: 1;
      text-align: center;
    }
    .col-category {
      width: 180rpx;
      text-align: center;
    }
    .col-count {
      width: 160rpx;
      text-align: center;
    }

    .empty-tip {
      padding: 40rpx 0;
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
