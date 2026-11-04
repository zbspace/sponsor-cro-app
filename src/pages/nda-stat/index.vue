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
        <text>NDA统计</text>
        <view class="active-line" v-if="activeTab === 'stat'"></view>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 'list' }" @click="activeTab = 'list'">
        <text>NDA列表</text>
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
                show-scrollbar
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
            v-model:year="listYear"
          />
        </view>
      </view>
    </scroll-view>
  </view>

  <phone-bind-popup />
</template>

<script setup lang="ts">
  // #region 导入与类型定义
  import { ref, computed, onMounted, watch, getCurrentInstance } from 'vue'
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
  import { renderLineChart, renderBarChart, shortYearLabel } from '@/utils/canvas-chart'
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
  // drugTypeCode 接口要求数字编码（1-化药 2-疫苗 3-治疗生物药 4-中药），故用 INT 版枚举
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
  // 榜单点击后带入 NDA 列表的年份（空值表示全部年份）
  const listYear = ref('')
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

  /**
   * 点击榜单产品：切到NDA列表并按该产品名称、榜单年份过滤
   * @param item 榜单条目
   */
  function onProductClick(item: NdaProductRankVo) {
    listProductName.value = item.productName || ''
    // 榜单按年份统计申请记录数，带入同一年份才能让列表条数与榜单一致；未选年份则不带年份条件
    listYear.value = productYearFilter.value || ''
    activeTab.value = 'list'
  }
  // #endregion

  // #region 图表绘制逻辑
  // 画布适配与绘制细节统一在 utils/canvas-chart 维护，这里只负责准备数据
  function drawCharts() {
    drawLineChart()
    drawBarChart()
  }

  function drawLineChart() {
    return renderLineChart(
      'lineCanvas',
      {
        values: projectSumList.value.map((item) => Number(item.projectCount) || 0),
        labels: projectSumList.value.map((item) => shortYearLabel(item.year))
      },
      { instance, showValueLabels: true }
    )
  }

  function drawBarChart() {
    return renderBarChart(
      'barCanvas',
      {
        values: registerCategoryList.value.map((item) => Number(item.count) || 0),
        labels: registerCategoryList.value.map((item) => item.label)
      },
      { instance }
    )
  }
  // #endregion
</script>

<style lang="scss" scoped src="./index.scss"></style>
