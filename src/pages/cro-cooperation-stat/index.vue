<!-- cro合作统计 -->
<template>
  <view class="page-container">
    <!-- #region 头部导航 -->
    <view class="header-nav" :style="{ paddingTop: `${statusBarHeight}px` }">
      <view class="nav-content">
        <view class="back-btn" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
        <text class="title">{{ companyName || '百济神州' }}</text>
        <view class="nav-placeholder"></view>
      </view>
    </view>
    <!-- #endregion -->

    <!-- #region 选项卡 -->
    <view class="tabs-wrapper">
      <view
        class="tab-item"
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view class="active-line" v-if="activeTab === tab.key"></view>
      </view>
    </view>
    <!-- #endregion -->

    <scroll-view
      scroll-y
      class="content-scroll"
      :show-scrollbar="false"
      @scrolltolower="onScrollToLower"
    >
      <!-- #region 统计内容 -->
      <view v-if="activeTab === 'stat'" class="stat-content p-16px">
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
          <view class="ratio-stats">
            <view class="stat-item">
              <text class="label">外包项目数</text>
              <text class="value">{{ outsourceRate.haveProjectNum }}</text>
            </view>
            <view class="stat-item">
              <text class="label">自研项目数</text>
              <text class="value">{{ outsourceRate.noProjectNum }}</text>
            </view>
            <view class="stat-item">
              <text class="label">总项目数</text>
              <text class="value">{{ outsourceRate.totalProjectNum }}</text>
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
          <view class="load-status" v-if="!croLoading && !croList.length">
            <text>暂无数据</text>
          </view>
        </view>
      </view>
      <!-- #endregion -->

      <!-- #region 项目列表 -->
      <view v-if="activeTab === 'list'" class="project-list p-16px">
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
        <view class="load-status" v-if="!loading && !projectList.length">
          <text>暂无数据</text>
        </view>
      </view>
      <!-- #endregion -->
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed, reactive } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { getOutsourcingRatio, selectClinicalCroRankList, getSponsorProjectList } from '@/api'
  // #endregion

  // #region 基础状态
  const statusBarHeight = ref(0)
  const activeTab = ref('stat')
  const tabs = [
    { label: '合作CRO统计', key: 'stat' },
    { label: '项目列表', key: 'list' }
  ]

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
    if (options?.companyId) {
      sponsorParentCompanyId.value = Number(options.companyId)
    }
    const sysInfo = uni.getSystemInfoSync()
    statusBarHeight.value = sysInfo.statusBarHeight || 0
    fetchOutsourcingRatio()
    fetchCroRankList()
    fetchProjectList()
  })

  const goBack = () => {
    uni.navigateBack()
  }
  // #endregion

  // #region 外包CRO统计
  const outsourceRate = reactive({
    cro: 0,
    self: 0,
    haveProjectNum: 0,
    noProjectNum: 0,
    totalProjectNum: 0
  })
  // 申办方母公司ID，优先从路由参数获取，默认为 0
  const sponsorParentCompanyId = ref(0)
  // 公司名称，从路由参数获取
  const companyName = ref('')
  // 跳转来源页面的CRO公司ID，用于项目列表 tab CRO合作名单筛选默认选中
  const routeCroCompanyId = ref(0)

  async function fetchOutsourcingRatio() {
    try {
      const res = await getOutsourcingRatio({
        companyType: 'cro',
        sponsorParentCompanyId: sponsorParentCompanyId.value
      })
      if (res.data) {
        outsourceRate.cro = res.data.outsourcingCroRatio
        outsourceRate.self = res.data.selfRatio
        outsourceRate.haveProjectNum = res.data.haveProjectNum || 0
        outsourceRate.noProjectNum = res.data.noProjectNum || 0
        outsourceRate.totalProjectNum = res.data.totalProjectNum || 0
      }
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

  //获取 CRO 合作名单
  async function fetchCroRankList() {
    if (croLoading.value) return
    croLoading.value = true
    try {
      // 接口必填参数：sponsorParentCompanyId 申办方母公司ID；lastYear 与时间筛选联动；croParentCompanyId 为筛选的 CRO
      const res = await selectClinicalCroRankList({
        sponsorParentCompanyId: sponsorParentCompanyId.value,
        pageNum: croPage.value,
        pageSize: croPageSize.value
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
    // 切换到项目列表 tab，并在 CRO 合作名单筛选中默认选中当前点击的 CRO
    activeTab.value = 'list'
  }
  // #endregion

  // #region 项目列表
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
        pageNum: projectPage.value,
        pageSize: projectPageSize.value,
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
  // #endregion
</script>

<style lang="scss" scoped>
  .page-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f8f9fb;

    .header-nav {
      background-color: #fff;
      flex-shrink: 0;
      .nav-content {
        height: 44px;
        display: flex;
        align-items: center;
        padding: 0 16px;
        .back-btn {
          width: 40px;
        }
        .title {
          flex: 1;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        .nav-placeholder {
          width: 40px;
        }
      }
    }

    .tabs-wrapper {
      display: flex;
      background-color: #fff;
      padding: 10px 0;
      flex-shrink: 0;
      .tab-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        .tab-text {
          font-size: 16px;
          color: #999;
          margin-bottom: 6px;
        }
        &.active {
          .tab-text {
            color: #00a0e9;
            font-weight: bold;
          }
          .active-line {
            width: 24px;
            height: 3px;
            background-color: #00a0e9;
            border-radius: 2px;
          }
        }
      }
    }

    .content-scroll {
      flex: 1;
      overflow: hidden;
    }

    /* 卡片通用样式 */
    .card {
      background: #ffffff;
      border-radius: 24rpx;
      padding: 30rpx;
      margin-bottom: 30rpx;
      box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

      .card-title {
        font-weight: bold;
        font-size: 28rpx;
        color: #333333;
        line-height: 52rpx;
        margin-bottom: 24rpx;
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

      .ratio-stats {
        margin-top: 40rpx;
        display: flex;
        justify-content: space-around;
        border-top: 2rpx solid #f8f8f8;
        padding-top: 30rpx;

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8rpx;

          .label {
            font-size: 24rpx;
            color: #999;
          }

          .value {
            font-size: 32rpx;
            font-weight: bold;
            color: #333;
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
        color: #999;

        background: #f7f8fa;
        border-radius: 0rpx 0rpx 0rpx 0rpx;
        border: 2rpx solid #eeeeee;

        font-weight: 400;
        font-size: 24rpx;
        color: #333333;
        line-height: 52rpx;
      }

      .table-row {
        display: flex;
        padding: 20rpx 0;
        border-bottom: 2rpx solid #f8f8f8;
        color: #333;
        font-weight: 400;
        font-size: 24rpx;
        line-height: 48rpx;

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
        margin-bottom: 24rpx;
        box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
        position: relative;

        .project-title {
          font-weight: bold;
          font-size: 28rpx;
          color: #333333;
          line-height: 48rpx;
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
              width: 34rpx;
              height: 34rpx;
              image {
                width: 100%;
                height: 100%;
              }
            }

            .info-text {
              font-weight: 400;
              font-size: 24rpx;
              color: #999999;
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
  }
</style>
