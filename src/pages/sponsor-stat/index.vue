<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
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
    scroll-y
    class="container-scroll-view"
    :show-scrollbar="false"
    enhanced
    :style="{
      height: `calc(100vh - ${menu.top}px - ${menu.height}px)`
    }"
    @scrolltolower="onScrollToLower"
  >
    <view class="container">
      <!-- 顶部筛选栏 -->
      <view class="top-filter-bar">
        <view class="filter-input-card">
          <text class="label">相关公司</text>
          <view class="divider"></view>
          <view class="value-wrapper">
            <uni-data-select
              v-model="currentCompany"
              :localdata="companyOptions"
              :clear="false"
              placeholder="请选择"
            ></uni-data-select>
          </view>
        </view>
        <view class="star-btn" :class="{ active: isStarred }" @click="toggleStar">
          <image src="../../static/icons/收藏3.png" mode="aspectFit" />
        </view>
      </view>

      <!-- 选项卡 -->
      <view class="tabs">
        <view
          class="tab-item"
          :class="{ active: activeTab === 'stat' }"
          @click="activeTab = 'stat'"
        >
          <text>合作CRO统计</text>
          <view class="active-line" v-if="activeTab === 'stat'"></view>
        </view>
        <view
          class="tab-item"
          :class="{ active: activeTab === 'list' }"
          @click="activeTab = 'list'"
        >
          <text>项目列表</text>
          <view class="active-line" v-if="activeTab === 'list'"></view>
        </view>
      </view>

      <!-- 时间筛选 -->
      <view class="time-filter-wrapper" v-if="activeTab === 'stat'">
        <uni-data-select
          v-model="currentTimeFilter"
          :localdata="timeOptions"
          :clear="false"
          placeholder="请选择"
        ></uni-data-select>
      </view>

      <view class="filter-wrapper" v-if="activeTab === 'list'">
        <!-- CRO合作名单筛选 -->
        <view class="time-filter-wrapper">
          <uni-data-select
            v-model="currentCroCompany"
            :localdata="croCompanyOptions"
            :clear="false"
            placeholder="请选择"
          ></uni-data-select>
        </view>

        <!-- 时间筛选 -->
        <view class="time-filter-wrapper">
          <uni-data-select
            v-model="currentTimeFilterObj"
            :localdata="timeOptions"
            :clear="false"
            placeholder="请选择"
          ></uni-data-select>
        </view>
      </view>

      <view class="time-filter-tip" v-if="activeTab === 'list'">
        注：同一个项目可能存在多条HGR获批记录，时间按照HGR批准 时间统计
      </view>

      <!-- 统计内容 -->
      <view v-if="activeTab === 'stat'">
        <!-- 外包比例卡片 -->
        <view class="card ratio-card">
          <view class="card-title">外包比例</view>
          <view class="ratio-content">
            <view class="pie-chart-wrapper">
              <view
                class="pie-chart"
                :style="{
                  background: `conic-gradient(#499AE6 0% ${outsourceRate.cro}%, #7ED321 ${outsourceRate.cro}% 100%)`
                }"
              ></view>
            </view>
            <view class="ratio-legend">
              <view class="legend-item">
                <view class="dot blue"></view>
                <view class="legend-info">
                  <text class="label">外包CRO</text>
                  <text class="value">{{ outsourceRate.cro }}%</text>
                </view>
              </view>
              <view class="legend-item">
                <view class="dot green"></view>
                <view class="legend-info">
                  <text class="label">自己申报</text>
                  <text class="value">{{ outsourceRate.self }}%</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- CRO合作名单卡片 -->
        <view class="card list-card">
          <view class="card-title">CRO合作名单</view>
          <view class="table-header">
            <text class="col-rank">排序</text>
            <text class="col-name">CRO公司</text>
            <text class="col-count">合作项目数</text>
          </view>
          <view class="table-body">
            <view
              class="table-row"
              v-for="(item, index) in croList"
              :key="index"
              hover-class="row-hover"
              @click="onCroClick(item)"
            >
              <text class="col-rank">{{ index + 1 }}</text>
              <text class="col-name">{{ item.name }}</text>
              <text class="col-count highlight">{{ item.count }}</text>
            </view>
          </view>

          <!-- 加载状态提示 -->
          <view class="load-status" v-if="croLoading">
            <text>加载中...</text>
          </view>
          <view class="load-status" v-else-if="croNoMore && croList.length > 0">
            <text>没有更多了</text>
          </view>
          <view class="load-status" v-if="!croList.length">
            <text>暂无数据</text>
          </view>
        </view>
      </view>

      <!-- 项目列表内容 -->
      <view v-else class="project-list">
        <view class="project-card" v-for="(item, index) in projectList" :key="index">
          <view class="project-title">{{ item.title }}</view>
          <view class="info-list">
            <view class="info-item">
              <view class="info-icon time">
                <image src="../../static/icons/time.png" mode="aspectFit" />
              </view>
              <text class="info-text">批入时间：{{ item.approveTime }}</text>
            </view>
            <view class="info-item">
              <view class="info-icon sponsor">
                <image src="../../static/icons/sponsor.png" mode="aspectFit" />
              </view>
              <text class="info-text">申办方：{{ item.sponsor }}</text>
            </view>
            <view class="info-item">
              <view class="info-icon no">
                <image src="../../static/icons/no.png" mode="aspectFit" />
              </view>
              <text class="info-text">审批号/备案号：{{ item.approveNo }}</text>
            </view>
            <view class="info-item">
              <view class="info-icon cro">
                <image src="../../static/icons/cro.png" mode="aspectFit" />
              </view>
              <text class="info-text">合作CRO：{{ item.cro }}</text>
            </view>
          </view>
          <view class="action-btn">{{ item.tag }}</view>
        </view>

        <!-- 加载状态提示 -->
        <view class="load-status" v-if="loading">
          <text>加载中...</text>
        </view>
        <view class="load-status" v-else-if="noMore && projectList.length > 0">
          <text>没有更多了</text>
        </view>
      </view>
    </view>
  </scroll-view>

  <!-- 手机号绑定弹窗 -->
  <phone-bind-popup />
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import {
    getOutsourcingRatio,
    getSponsorProjectList,
    getRelatedCompanyList,
    selectClinicalCroRankList
  } from '@/api'

  const activeTab = ref('stat')
  const currentCompany = ref('全部')
  const currentTimeFilter = ref('')
  const currentTimeFilterObj = ref('')
  const isStarred = ref(false)
  const companyOptions = ref<{ value: string; text: string }[]>([{ value: '', text: '全部' }])

  // 时间筛选选项：全部 + 最近三年，值对应接口 lastYear 参数
  const timeOptions = ref([
    { value: '', text: '历史所有' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年度` }
    })
  ])

  const outsourceRate = reactive({
    cro: 0,
    self: 0
  })
  // 申办方母公司ID，优先从路由参数获取，默认为 0
  const sponsorParentCompanyId = ref(0)
  // 公司名称，从路由参数获取
  const companyName = ref('')

  async function fetchOutsourcingRatio() {
    try {
      // 接口必填参数：companyType(cro/thirdLab)、sponsorParentCompanyId
      const res = await getOutsourcingRatio({
        companyType: 'cro',
        sponsorParentCompanyId: sponsorParentCompanyId.value
      })
      if (res.data) {
        outsourceRate.cro = res.data.outsourcingCroRatio
        outsourceRate.self = res.data.selfRatio
      }
    } catch {
      // 静默处理
    }
  }

  // #region 相关公司筛选下拉数据
  /**
   * 获取相关公司列表（顶部筛选下拉）
   */
  async function fetchRelatedCompanyList() {
    const parentId = sponsorParentCompanyId.value
    if (!parentId) return
    try {
      const res = await getRelatedCompanyList({
        companyType: 'sponsor',
        pageNum: 1,
        pageSize: 50,
        parentCompanyId: parentId
      })
      if (res.data?.list) {
        companyOptions.value = [
          { value: '', text: '全部' },
          ...res.data.list.map((item) => ({
            value: String(item.standardCompanyId),
            text: item.companyStandardName
          }))
        ]
      }
    } catch {
      // 静默处理
    }
  }
  // #endregion

  // #region CRO合作名单筛选
  const currentCroCompany = ref('')
  const croCompanyOptions = ref<{ value: string; text: string }[]>([{ value: '', text: '全部' }])

  /**
   * 查询该申办方合作的所有 CRO，用于 CRO 合作名单筛选下拉
   */
  async function fetchCroCompanyOptions() {
    try {
      const pageSize = 100
      // 先取第一页，得到总页数
      const firstRes = await selectClinicalCroRankList({
        sponsorParentCompanyId: sponsorParentCompanyId.value,
        pageNum: 1,
        pageSize
      })
      let list = firstRes.data?.list || []
      const pages = firstRes.data?.pages || 1
      // 分页拉取全部 CRO
      for (let page = 2; page <= pages; page++) {
        const res = await selectClinicalCroRankList({
          sponsorParentCompanyId: sponsorParentCompanyId.value,
          pageNum: page,
          pageSize
        })
        list = [...list, ...(res.data?.list || [])]
      }
      croCompanyOptions.value = [
        { value: '', text: '全部' },
        ...list.map((item) => ({
          value: String(item.parentCompanyId),
          text: item.parentCompanyShortName
        }))
      ]
    } catch {
      // 静默处理
    }
  }
  // #endregion

  // #region CRO合作名单
  const croList = ref<{ name: string; count: number }[]>([])
  // CRO合作名单分页参数
  const croPage = ref(1)
  const croPageSize = ref(10)
  const croTotal = ref(0)
  // 加载状态
  const croLoading = ref(false)
  const croNoMore = ref(false)

  /**
   * 获取 CRO 合作名单
   */
  async function fetchCroRankList() {
    if (croLoading.value) return
    croLoading.value = true
    try {
      // 接口必填参数：sponsorParentCompanyId 申办方母公司ID；lastYear 与时间筛选联动；croParentCompanyId 为筛选的 CRO
      const res = await selectClinicalCroRankList({
        sponsorParentCompanyId: sponsorParentCompanyId.value,
        lastYear: currentTimeFilter.value ? Number(currentTimeFilter.value) : undefined,
        croParentCompanyId: currentCroCompany.value ? Number(currentCroCompany.value) : undefined,
        pageNum: croPage.value,
        pageSize: croPageSize.value,
        sponsorStandardCompanyIdList: currentCompany.value
          ? [Number(currentCompany.value)]
          : undefined
      })
      if (res.data?.list) {
        const newList = res.data.list.map((item) => ({
          name: item.parentCompanyShortName,
          count: item.projectExperienceNum,
          parentCompanyId: item.parentCompanyId
        }))
        // 第一页替换，后续页追加
        croList.value = croPage.value === 1 ? newList : [...croList.value, ...newList]
        croTotal.value = res.data.total
        croNoMore.value = croList.value.length >= res.data.total
      } else {
        croNoMore.value = true
      }
    } catch {
      // 静默处理
    } finally {
      croLoading.value = false
    }
  }
  // #endregion

  // #region 点击 CRO 合作名单行进入 CRO 主页
  const onCroClick = (item: any) => {
    if (!item.parentCompanyId) return
    uni.navigateTo({
      url: `/pages/cro-stat/index?partnerParentCompanyId=${item.parentCompanyId}&parentCompanyShortName=${encodeURIComponent(item.name)}`
    })
  }
  // #endregion

  const projectList = ref<
    {
      title: string
      approveTime: string
      sponsor: string
      approveNo: string
      cro: string
      tag: string
    }[]
  >([])
  // 项目列表分页参数
  const projectPage = ref(1)
  const projectPageSize = ref(10)
  const projectTotal = ref(0)
  // 加载状态
  const loading = ref(false)
  const noMore = ref(false)

  async function fetchProjectList() {
    if (loading.value) return
    loading.value = true
    try {
      // 接口必填参数：companyType(cro/thirdLab)；lastYear 为筛选年份，空值表示全部
      const res = await getSponsorProjectList({
        companyType: 'cro',
        lastYear: currentTimeFilterObj.value ? Number(currentTimeFilterObj.value) : undefined,
        pageNum: projectPage.value,
        pageSize: projectPageSize.value,
        // 有 CRO 合作名单筛选时按 CRO 过滤
        partnerParentCompanyIdList: currentCroCompany.value
          ? [Number(currentCroCompany.value)]
          : undefined,
        // 有申办方母公司ID时按申办方过滤
        sponsorParentCompanyId: sponsorParentCompanyId.value || undefined
      })
      if (res.data?.list) {
        const newList = res.data.list.map((item) => ({
          title: item.projectName,
          approveTime: item.approvalRecordTime,
          sponsor: item.sponsorStandardCompanyName,
          approveNo: item.projectNo,
          cro: item.partnerParentCompanyShortName,
          tag: item.category
        }))
        // 第一页替换，后续页追加
        projectList.value = projectPage.value === 1 ? newList : [...projectList.value, ...newList]
        projectTotal.value = res.data.total
        noMore.value = projectList.value.length >= res.data.total
      } else {
        noMore.value = true
      }
    } catch {
      // 静默处理
    } finally {
      loading.value = false
    }
  }

  /**
   * 滚动到底部加载下一页
   */
  function onScrollToLower() {
    // 加载中或无更多数据时不再请求
    if (activeTab.value === 'stat') {
      if (croLoading.value || croNoMore.value) return
      croPage.value += 1
      fetchCroRankList()
    } else if (activeTab.value === 'list') {
      if (loading.value || noMore.value) return
      projectPage.value += 1
      fetchProjectList()
    }
  }

  // 时间筛选变化时自动重新请求列表数据
  watch(currentTimeFilter, () => {
    croPage.value = 1
    croNoMore.value = false
    fetchCroRankList()
  })

  // 时间筛选变化时自动重新请求列表数据
  watch(currentTimeFilterObj, () => {
    projectPage.value = 1
    noMore.value = false
    fetchProjectList()
  })

  // CRO合作名单筛选变化时自动重新请求 CRO 合作名单
  watch(currentCroCompany, () => {
    croPage.value = 1
    croNoMore.value = false
    fetchProjectList()
  })

  watch(currentCompany, () => {
    croPage.value = 1
    croNoMore.value = false
    fetchCroRankList()
  })

  const toggleStar = () => {
    isStarred.value = !isStarred.value
    uni.showToast({
      title: isStarred.value ? '已收藏' : '已取消收藏',
      icon: 'none'
    })
  }

  const goBack = () => {
    uni.navigateBack({
      delta: 1,
      fail: () => {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    })
  }

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  onLoad((options: any) => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    // 读取路由参数中的公司名称
    if (options?.companyName) {
      companyName.value = decodeURIComponent(options.companyName)
    }
    // 读取路由参数中的申办方母公司ID
    if (options?.sponsorParentCompanyId) {
      sponsorParentCompanyId.value = Number(options.sponsorParentCompanyId)
    }
    fetchOutsourcingRatio()
    fetchProjectList()
    fetchRelatedCompanyList()
    fetchCroRankList()
    fetchCroCompanyOptions()
  })
</script>

<style lang="scss" scoped>
  .container {
    padding: 30rpx;
  }

  /* 顶部筛选栏 */
  .top-filter-bar {
    display: flex;
    align-items: center;
    gap: 20rpx;
    margin-bottom: 30rpx;

    .filter-input-card {
      flex: 1;
      background: #ffffff;
      height: 100rpx;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      padding: 0 30rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);
      border: 2rpx solid #eeeeee;

      .label {
        font-size: 28rpx;
        color: #999;
      }

      .divider {
        width: 2rpx;
        height: 30rpx;
        background-color: #eee;
        margin: 0 20rpx;
      }

      .value-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;

        :deep(.uni-select) {
          border: none;
          padding: 0;

          .uni-select__input-text {
            font-size: 28rpx;
            color: #333;
          }
        }
      }
    }

    .star-btn {
      width: 100rpx;
      height: 100rpx;
      background: #ffffff;
      border-radius: 20rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.02);

      .star-icon {
        width: 40rpx;
        height: 40rpx;
        background-image: url('https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=star+icon+line+art+gray&image_size=square');
        background-size: contain;
        background-repeat: no-repeat;
      }

      &.active {
        border-style: solid;
        border-color: #499ae6;
      }
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

  /* 卡片通用样式 */
  .card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

    .card-title {
      font-size: 30rpx;
      font-weight: 500;
      color: #333;
      margin-bottom: 30rpx;
    }
  }

  /* 外包比例 */
  .ratio-card {
    .ratio-content {
      display: flex;
      align-items: center;
      gap: 130rpx;
      padding: 20rpx 0;
      justify-content: center;

      .pie-chart-wrapper {
        .pie-chart {
          width: 200rpx;
          height: 200rpx;
          border-radius: 50%;
        }
      }

      .ratio-legend {
        display: flex;
        flex-direction: column;
        gap: 30rpx;

        .legend-item {
          display: flex;
          align-items: center;
          gap: 20rpx;

          .dot {
            width: 16rpx;
            height: 16rpx;
            border-radius: 4rpx;

            &.blue {
              background-color: #499ae6;
            }
            &.green {
              background-color: #7ed321;
            }
          }

          .legend-info {
            display: flex;
            flex-direction: column;

            .label {
              font-size: 24rpx;
              color: #999;
              margin-bottom: 4rpx;
            }

            .value {
              font-size: 28rpx;
              font-weight: bold;
              color: #333;
            }
          }
        }
      }
    }
  }

  /* 合作名单列表 */
  .list-card {
    .table-header {
      display: flex;
      padding: 20rpx 0;
      border-bottom: 2rpx solid #f8f8f8;
      font-size: 26rpx;
      color: #999;
    }

    .table-row {
      display: flex;
      padding: 30rpx 0;
      border-bottom: 2rpx solid #f8f8f8;
      font-size: 28rpx;
      color: #333;

      &:last-child {
        border-bottom: none;
      }

      // 点击反馈
      &.row-hover {
        background-color: #f2f7fc;
      }
    }

    .col-rank {
      width: 120rpx;
      text-align: center;
    }

    .col-name {
      flex: 1;
      text-align: center;
    }

    .col-count {
      width: 200rpx;
      text-align: center;

      &.highlight {
        color: #499ae6;
      }
    }

    .load-status {
      padding: 40rpx 0;
      text-align: center;

      text {
        font-size: 24rpx;
        color: #999;
      }
    }
  }

  /* 项目列表卡片 */
  .project-list {
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
        line-height: 1.5;
        margin-bottom: 30rpx;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        overflow: hidden;
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
        font-size: 26rpx;
        padding: 12rpx 30rpx;
        border-radius: 40rpx;
        box-shadow: 0 4rpx 12rpx rgba(73, 154, 230, 0.3);
      }
    }

    // #region 加载状态
    .load-status {
      padding: 40rpx 0;
      text-align: center;

      text {
        font-size: 24rpx;
        color: #999;
      }
    }
    // #endregion
  }
</style>
