<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">我的收藏</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <!-- tab -->
  <scroll-view scroll-x class="tab-bar" :show-scrollbar="false">
    <view
      class="tab-item"
      v-for="tab in serverIdTabs"
      :key="tab.value"
      :class="{ active: activeServerId === tab.value }"
      @click="onTabChange(tab.value)"
    >
      <text>{{ tab.label }}</text>
    </view>
  </scroll-view>
  <view class="container">
    <!-- 内容卡片 -->
    <view class="rank-table-card">
      <view class="table-header">
        <text class="col-rank">序号</text>
        <text class="col-name">公司</text>
        <text class="col-exp">公司类型</text>
        <text class="col-pharma">状态</text>
      </view>

      <scroll-view
        scroll-y
        class="scroll-view"
        @scrolltolower="onScrollToLower"
        :show-scrollbar="false"
        :style="{
          height: `calc(100vh - ${menu.top}px - ${menu.height}px - 210px)`
        }"
      >
        <view
          class="table-row"
          v-for="(item, index) in rankList"
          :key="index"
          :class="{ zebra: index % 2 === 1 }"
          hover-class="row-hover"
          @click="onRowClick(item)"
        >
          <text class="col-rank">{{ index + 1 }}</text>
          <text class="col-name">{{ item.name }}</text>
          <text class="col-exp">{{ item.type }}</text>
          <text class="col-pharma status-text">{{ item.status }}</text>
        </view>

        <view class="loading-status" v-if="loading || noMore">
          <text>{{ loading ? '加载中...' : '没有更多了' }}</text>
        </view>
        <view class="empty-tip" v-if="rankList.length === 0 && !loading">暂无数据</view>
      </scroll-view>
    </view>
  </view>

  <!-- 手机号绑定弹窗 -->
  <phone-bind-popup />
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import { getUserCollectList } from '@/api'

  // 收藏的公司类型：1-sponsor, 2-cro, 3-thirdLab
  const companyTypeMap: Record<number, string> = {
    1: '申办方',
    2: 'CRO',
    3: '中心实验室'
  }

  const rankList = ref<any[]>([])
  const loading = ref(false)
  const noMore = ref(false)
  const page = ref(1)

  // #region tab 模块切换
  // 各业务模块对应的 serverId
  const serverIdTabs = [
    { label: '查客户', value: 'searchCust' },
    { label: '找客户', value: 'findCust' },
    { label: '查药企&CRO', value: 'searchComCRO' },
    { label: '查药企&医院', value: 'searchComHos' },
    { label: '查药企&实验室', value: 'searchComLab' },
    { label: '查产品', value: 'searchProduce' }
  ]
  // 当前选中的模块，默认查药企&CRO
  const activeServerId = ref('searchComCRO')

  const onTabChange = (value: string) => {
    if (activeServerId.value === value) return
    activeServerId.value = value
    // 重置分页并重新加载
    rankList.value = []
    noMore.value = false
    page.value = 1
    fetchRankData()
  }
  // #endregion

  const goBack = () => {
    uni.navigateBack({
      delta: 1,
      fail: () => {
        uni.reLaunch({ url: '/pages/index/index' })
      }
    })
  }

  // 获取收藏列表
  const fetchRankData = async () => {
    if (loading.value || noMore.value) return
    loading.value = true
    try {
      const res = await getUserCollectList({
        pageNum: page.value,
        pageSize: 20,
        serverId: activeServerId.value
      })
      const list = res.data?.list || []
      rankList.value = [
        ...rankList.value,
        ...list.map((item) => ({
          name: item.parentCompanyShortName,
          type: companyTypeMap[item.companyType] || '',
          status: '已收藏',
          companyType: item.companyType,
          parentCompanyId: item.parentCompanyId
        }))
      ]
      noMore.value = rankList.value.length >= (res.data?.total || 0)
      page.value++
    } catch {
      // 静默处理
    } finally {
      loading.value = false
    }
  }

  // #region 点击行根据公司类型进入对应主页
  const onRowClick = (item: any) => {
    if (!item.parentCompanyId) return
    // 1-申办方进入申办方主页；2-CRO、3-中心实验室进入 CRO/中心实验室主页
    if (item.companyType === 1) {
      uni.navigateTo({
        url: `/pages/sponsor-stat/index?sponsorParentCompanyId=${item.parentCompanyId}&companyName=${encodeURIComponent(item.name)}`
      })
    } else if (item.companyType === 2 || item.companyType === 3) {
      uni.navigateTo({
        url: `/pages/cro-stat/index?partnerParentCompanyId=${item.parentCompanyId}&parentCompanyShortName=${encodeURIComponent(item.name)}`
      })
    }
  }
  // #endregion

  // #region 滚动加载逻辑
  const onScrollToLower = () => {
    fetchRankData()
  }
  // #endregion

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  onLoad(async (options: any) => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    fetchRankData()
  })
</script>

<style lang="scss" scoped>
  /* #region tab 模块切换 */
  .tab-bar {
    white-space: nowrap;
    width: 100%;
    padding: 20rpx 30rpx 24rpx;
    box-sizing: border-box;

    .tab-item {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 14rpx 32rpx;
      margin-right: 16rpx;
      background: #ffffff;
      border-radius: 40rpx;
      font-size: 26rpx;
      color: #666666;

      &.active {
        background: #499ae6;
        color: #ffffff;
        font-weight: 500;
      }
    }
  }
  /* #endregion */

  .rank-table-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

    // #region 表头样式
    .table-header {
      display: flex;
      align-items: center;
      padding: 24rpx 0;
      margin-bottom: 12rpx;
      background: #f6f9fc;
      border-radius: 16rpx;
      font-size: 26rpx;
      color: #8a94a6;
      font-weight: 500;

      text {
        text-align: center;
      }

      // 与数据行列宽保持一致，保证表头对齐
      .col-rank {
        width: 100rpx;
      }
      .col-name {
        flex: 2;
      }
      .col-exp {
        flex: 1;
      }
      .col-pharma {
        flex: 1;
      }
    }
    // #endregion

    .table-row {
      display: flex;
      padding: 30rpx 0;
      align-items: center;

      &.zebra {
        background-color: #fcfdfe;
      }

      // 点击反馈
      &.row-hover {
        background-color: #f2f7fc;
      }

      text {
        font-size: 28rpx;
        color: #333;
        text-align: center;
      }

      .highlight {
        color: #499ae6;
      }

      .col-rank {
        width: 100rpx;
      }
      .col-name {
        flex: 2;
      }
      .col-exp {
        flex: 1;
      }
      .col-pharma {
        flex: 1;
      }

      .status-text {
        color: #0097d9;
      }
    }

    // #region 滚动列表样式
    .scroll-view {
      width: 100%;
    }

    .loading-status,
    .empty-tip {
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
