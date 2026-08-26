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
              multiple
              :clear="true"
              placeholder="全部"
            >
              <template #selected="{ selectedItems }">
                <view class="selected-companies">
                  <text v-if="selectedItems.length === 0" class="placeholder-text">全部</text>
                  <template v-else>
                    <text class="selected-text">{{ selectedItems[0].text }}</text>
                    <text v-if="selectedItems.length > 1" class="selected-more">
                      +{{ selectedItems.length - 1 }}
                    </text>
                  </template>
                </view>
              </template>
            </uni-data-select>
          </view>
        </view>
        <view class="star-btn" @click="toggleStar">
          <image src="../../static/icons/收藏1.png" mode="aspectFit" v-if="!isStarred" />
          <image src="../../static/icons/收藏.png" mode="aspectFit" v-else />
        </view>
      </view>

      <!-- 选项卡 -->
      <view class="tabs">
        <view
          class="tab-item"
          :class="{ active: activeTab === 'stat' }"
          @click="activeTab = 'stat'"
        >
          <text>合作Lab统计</text>
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
        <!-- LAB合作名单筛选 -->
        <view class="time-filter-wrapper">
          <uni-data-select
            v-model="currentLabCompany"
            :localdata="labCompanyOptions"
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
                  background: `conic-gradient(#499AE6 0% ${outsourceRate.lab}%, #7ED321 ${outsourceRate.lab}% 100%)`
                }"
              ></view>
            </view>
            <view class="ratio-legend">
              <view class="legend-item">
                <view class="dot blue"></view>
                <view class="legend-info">
                  <text class="label">外包Lab</text>
                  <text class="value">{{ outsourceRate.lab }}%</text>
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

        <!-- LAB合作名单卡片 -->
        <view class="card list-card">
          <view class="card-title">Lab合作名单</view>
          <view class="table-header">
            <text class="col-rank">排序</text>
            <text class="col-name">Lab公司</text>
            <text class="col-count">合作项目数</text>
          </view>
          <view class="table-body">
            <view
              class="table-row"
              v-for="(item, index) in labList"
              :key="index"
              hover-class="row-hover"
              @click="onLabClick(item)"
            >
              <text class="col-rank">{{ index + 1 }}</text>
              <text class="col-name">{{ item.name }}</text>
              <text class="col-count highlight">{{ item.count }}</text>
            </view>
          </view>

          <!-- 加载状态提示 -->
          <view class="load-status" v-if="labLoading">
            <text>加载中...</text>
          </view>
          <view class="load-status" v-else-if="labNoMore && labList.length > 0">
            <text>没有更多了</text>
          </view>
          <view class="load-status" v-if="!labLoading && !labList.length">
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
              <text class="info-text">合作Lab：{{ item.lab }}</text>
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
    </view>
  </scroll-view>

  <!-- 手机号绑定弹窗 -->
  <phone-bind-popup />
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import {
    getOutsourcingRatio,
    getSponsorProjectList,
    getRelatedCompanyList,
    selectClinicalThirdLabRankList,
    userCollect,
    cancelUserCollect,
    getUserCollectList
  } from '@/api'

  const activeTab = ref('stat')
  // 相关公司多选，空数组表示全部
  const currentCompany = ref<string[]>([])
  const currentTimeFilter = ref('')
  const currentTimeFilterObj = ref('')
  const isStarred = ref(false)
  const companyOptions = ref<{ value: string; text: string }[]>([])

  // #region 收藏功能
  // 收藏记录id，用于取消收藏
  const collectId = ref(0)
  // 当前页面为申办方统计，收藏类型固定为 sponsor(1)
  const collectCompanyType = 1
  // 收藏对象为当前申办方母公司
  const collectParentCompanyId = computed(() => sponsorParentCompanyId.value)

  /**
   * 查询当前公司是否已收藏，初始化收藏按钮状态并保存收藏记录id
   */
  async function fetchCollectStatus() {
    const parentCompanyId = collectParentCompanyId.value
    if (!parentCompanyId) return
    try {
      const res = await getUserCollectList({
        pageNum: 1,
        pageSize: 50,
        companyType: collectCompanyType
      })
      const record = res.data?.list.find((item) => item.parentCompanyId === parentCompanyId)
      isStarred.value = !!record
      collectId.value = record?.id || 0
    } catch {
      // 静默处理
    }
  }
  // #endregion

  // 时间筛选选项：全部 + 最近三年，值对应接口 lastYear 参数
  const timeOptions = ref([
    { value: '', text: '历史所有' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年度` }
    })
  ])

  const outsourceRate = reactive({
    lab: 0,
    self: 0
  })
  // 申办方母公司ID，优先从路由参数获取，默认为 0
  const sponsorParentCompanyId = ref(0)
  // 公司名称，从路由参数获取
  const companyName = ref('')
  // 跳转来源页面的CRO公司ID，用于项目列表 tab CRO合作名单筛选默认选中
  const routeLabCompanyId = ref(0)

  async function fetchOutsourcingRatio() {
    try {
      // 接口必填参数：companyType(cro/thirdLab)、sponsorParentCompanyId
      const res = await getOutsourcingRatio({
        companyType: 'thirdLab',
        sponsorParentCompanyId: sponsorParentCompanyId.value,
        lastYear: currentTimeFilter.value ? Number(currentTimeFilter.value) : undefined
      })
      if (res.data) {
        outsourceRate.lab = res.data.outsourcingCroRatio
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
        companyOptions.value = res.data.list.map((item) => ({
          value: String(item.standardCompanyId),
          text: item.companyStandardName
        }))
      }
    } catch {
      // 静默处理
    }
  }
  // #endregion

  // #region LAB合作名单筛选
  const currentLabCompany = ref('')
  const labCompanyOptions = ref<{ value: string; text: string }[]>([{ value: '', text: '全部' }])

  /**
   * 查询该申办方合作的所有 LAB，用于 LAB 合作名单筛选下拉
   */
  async function fetchLabCompanyOptions() {
    try {
      const pageSize = 100
      // 先取第一页，得到总页数
      const firstRes = await selectClinicalThirdLabRankList({
        sponsorParentCompanyId: sponsorParentCompanyId.value,
        pageNum: 1,
        pageSize
      })
      let list = firstRes.data?.list || []
      const pages = firstRes.data?.pages || 1
      // 分页拉取全部 CRO
      for (let page = 2; page <= pages; page++) {
        const res = await selectClinicalThirdLabRankList({
          sponsorParentCompanyId: sponsorParentCompanyId.value,
          pageNum: page,
          pageSize
        })
        list = [...list, ...(res.data?.list || [])]
      }
      labCompanyOptions.value = [
        { value: '', text: '全部' },
        ...list.map((item) => ({
          value: String(item.parentCompanyId),
          text: item.parentCompanyShortName
        }))
      ]
      // 从LAB主页跳转进入时，默认在LAB合作名单筛选中选上上个页面的LAB公司
      if (routeLabCompanyId.value) {
        const target = labCompanyOptions.value.find(
          (opt) => opt.value === String(routeLabCompanyId.value)
        )
        if (target) {
          currentLabCompany.value = String(routeLabCompanyId.value)
        }
      }
    } catch {
      // 静默处理
    }
  }
  // #endregion

  // #region CRO合作名单
  const labList = ref<{ name: string; count: number }[]>([])
  // CRO合作名单分页参数
  const labPage = ref(1)
  const labPageSize = ref(10)
  const labTotal = ref(0)
  // 加载状态
  const labLoading = ref(false)
  const labNoMore = ref(false)

  /**
   * 获取 LAB 合作名单
   */
  async function fetchLabRankList() {
    if (labLoading.value) return
    labLoading.value = true
    try {
      // 接口必填参数：sponsorParentCompanyId 申办方母公司ID；lastYear 与时间筛选联动；croParentCompanyId 为筛选的 CRO
      const res = await selectClinicalThirdLabRankList({
        sponsorParentCompanyId: sponsorParentCompanyId.value,
        lastYear: currentTimeFilter.value ? Number(currentTimeFilter.value) : undefined,
        labParentCompanyId: currentLabCompany.value ? Number(currentLabCompany.value) : undefined,
        pageNum: labPage.value,
        pageSize: labPageSize.value,
        sponsorStandardCompanyIdList:
          currentCompany.value.length > 0 ? currentCompany.value.map(Number) : undefined
      })
      if (res.data?.list) {
        const newList = res.data.list.map((item) => ({
          name: item.parentCompanyShortName,
          count: item.projectExperienceNum,
          parentCompanyId: item.parentCompanyId
        }))
        // 第一页替换，后续页追加
        labList.value = labPage.value === 1 ? newList : [...labList.value, ...newList]
        labTotal.value = res.data.total
        labNoMore.value = labList.value.length >= res.data.total
      } else {
        labNoMore.value = true
      }
    } catch {
      // 静默处理
    } finally {
      labLoading.value = false
    }
  }
  // #endregion

  // #region 点击 LAB 合作名单行进入 LAB 主页
  const onLabClick = (item: any) => {
    if (!item.parentCompanyId) return
    // 携带当前查询时间，进入后默认切换到项目列表 tab 并套用该年份；
    // 同时带上当前申办方公司，用于 LAB 主页项目列表 tab 的申办方筛选默认选中
    uni.navigateTo({
      url: `/pages/lab-stat/index?partnerParentCompanyId=${item.parentCompanyId}&parentCompanyShortName=${encodeURIComponent(item.name)}&sponsorParentCompanyId=${sponsorParentCompanyId.value}&companyName=${encodeURIComponent(companyName.value)}&activeTab=list&timeFilter=${currentTimeFilter.value || ''}`
    })
  }
  // #endregion

  const projectList = ref<
    {
      title: string
      approveTime: string
      sponsor: string
      approveNo: string
      lab: string
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
        companyType: 'thirdLab',
        lastYear: currentTimeFilterObj.value ? Number(currentTimeFilterObj.value) : undefined,
        pageNum: projectPage.value,
        pageSize: projectPageSize.value,
        // 有 LAB 合作名单筛选时按 LAB 过滤；下拉未加载完成时退回来源LAB
        partnerParentCompanyIdList: currentLabCompany.value
          ? [Number(currentLabCompany.value)]
          : routeLabCompanyId.value
            ? [routeLabCompanyId.value]
            : undefined,
        sponsorStandardCompanyIdList:
          currentCompany.value.length > 0 ? currentCompany.value.map(Number) : undefined
      })
      if (res.data?.list) {
        const newList = res.data.list.map((item) => ({
          title: item.projectName,
          approveTime: item.approvalRecordTime,
          sponsor: item.sponsorStandardCompanyName,
          approveNo: item.projectNo,
          lab: item.partnerParentCompanyShortName,
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
      if (labLoading.value || labNoMore.value) return
      labPage.value += 1
      fetchLabRankList()
    } else if (activeTab.value === 'list') {
      if (loading.value || noMore.value) return
      projectPage.value += 1
      fetchProjectList()
    }
  }

  // 时间筛选变化时自动重新请求列表数据
  watch(currentTimeFilter, () => {
    labPage.value = 1
    labNoMore.value = false
    fetchLabRankList()
    fetchOutsourcingRatio()
  })

  // 时间筛选变化时自动重新请求列表数据
  watch(currentTimeFilterObj, () => {
    projectPage.value = 1
    noMore.value = false
    fetchProjectList()
  })

  // LAB合作名单筛选变化时自动重新请求 LAB 合作名单
  watch(currentLabCompany, () => {
    labPage.value = 1
    labNoMore.value = false
    fetchProjectList()
  })

  watch(currentCompany, () => {
    labPage.value = 1
    labNoMore.value = false
    projectPage.value = 1
    noMore.value = false
    fetchLabRankList()
    fetchProjectList()
  })

  const toggleStar = async () => {
    const parentCompanyId = collectParentCompanyId.value
    if (!parentCompanyId) {
      uni.showToast({ title: '暂无可收藏的公司', icon: 'none' })
      return
    }
    if (isStarred.value) {
      // 取消收藏
      if (!collectId.value) return
      try {
        await cancelUserCollect(collectId.value)
        isStarred.value = false
        collectId.value = 0
        uni.showToast({ title: '已取消收藏', icon: 'none' })
      } catch {
        // 请求失败提示已由拦截器统一处理
      }
    } else {
      // 收藏
      try {
        await userCollect(collectCompanyType, parentCompanyId)
        isStarred.value = true
        uni.showToast({ title: '已收藏', icon: 'success' })
        // 收藏成功后刷新收藏记录，保存记录id供取消使用
        fetchCollectStatus()
      } catch {
        // 请求失败提示已由拦截器统一处理
      }
    }
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
    // 查询当前公司是否已收藏，初始化收藏按钮状态
    fetchCollectStatus()
    // 读取路由参数中的来源CRO公司ID：从CRO主页跳转进入时，用于CRO合作名单筛选默认选中
    if (options?.partnerParentCompanyId) {
      routeLabCompanyId.value = Number(options.partnerParentCompanyId)
    }
    // 读取路由参数中的目标tab：支持从CRO主页跳转时默认切换到项目列表tab
    if (options?.activeTab === 'list') {
      activeTab.value = 'list'
    }
    // 读取路由参数中的时间筛选：有值时通过 watch 触发按指定年份加载项目列表
    const timeFilter = options?.timeFilter
    if (timeFilter) {
      currentTimeFilterObj.value = timeFilter
    }
    fetchOutsourcingRatio()
    if (!timeFilter) {
      fetchProjectList()
    }
    fetchRelatedCompanyList()
    fetchLabRankList()
    fetchLabCompanyOptions()
    fetchProjectList()
  })
</script>

<style lang="scss" scoped>
  .container {
    padding: 30rpx;
  }

  .top-filter-bar {
    :deep(.uni-select__selector) {
      width: 700rpx;
      left: -180rpx;
    }
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

        :deep(.slot-content) {
          display: flex;
          align-items: center;
        }

        .selected-companies {
          display: flex;
          align-items: center;
          font-size: 28rpx;

          .placeholder-text {
            color: #c0c4cc;
          }

          .selected-text {
            color: #333;
            max-width: 240rpx;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .selected-more {
            margin-left: 8rpx;
            color: #499ae6;
            font-size: 24rpx;
            flex-shrink: 0;
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
