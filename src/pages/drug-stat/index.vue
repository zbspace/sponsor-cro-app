<template>
  <view class="page-container">
    <!-- #region 头部导航 -->
    <view class="header" :style="{ paddingTop: `${menu.top}px` }">
      <view class="nav-left" @click="goBack">
        <view class="back-icon">
          <view class="arrow"></view>
        </view>
      </view>
      <text class="title">查药品</text>
      <view class="nav-right"></view>
    </view>
    <!-- #endregion -->

    <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

    <!-- #region 药品详情卡片 -->
    <view class="drug-card">
      <view class="drug-header">
        <text class="drug-label">药品：</text>
        <text class="drug-name">{{ drugInfo.drugStandardName }}</text>
      </view>
      <view class="tag-row">
        <text class="tag category" v-if="drugInfo.cleanedClassification">
          {{ drugInfo.cleanedClassification }}
        </text>
        <text class="tag type" v-if="drugInfo.cleanedDrugType">
          {{ drugInfo.cleanedDrugType }}
        </text>
      </view>
      <view class="company-row">
        <text class="company-label">公司</text>
        <text class="company-name">{{ drugInfo.standardCompanyName }}</text>
      </view>
    </view>
    <!-- #endregion -->

    <!-- #region 选项卡 -->
    <view class="tabs">
      <view
        class="tab-item"
        v-for="tab in tabOptions"
        :key="tab.value"
        :class="{ active: activeTab === tab.value }"
        @click="onTabChange(tab.value)"
      >
        <text>{{ tab.label }}({{ tab.count }})</text>
        <view class="active-line" v-if="activeTab === tab.value"></view>
      </view>
    </view>
    <!-- #endregion -->

    <scroll-view
      scroll-y
      class="container-scroll-view"
      :show-scrollbar="false"
      enhanced
      :style="{
        height: `calc(100vh - ${menu.top}px - ${menu.height}px - 20px)`
      }"
      @scrolltolower="onScrollToLower"
    >
      <view class="container">
        <!-- #region 列表内容 -->
        <view class="list-content">
          <template v-if="list.length > 0">
            <view class="record-card" v-for="(item, index) in list" :key="index">
              <!-- IND 记录 -->
              <template v-if="activeTab === 'ind'">
                <view class="card-header">
                  <view class="title-row">
                    <text class="name">{{ item.drugStandardName }}</text>
                  </view>
                  <text class="date">{{ item.undertakeDate }}</text>
                </view>
                <view class="tag-row">
                  <text class="tag blue">{{ item.cleanedDrugType }}</text>
                  <text class="tag orange">{{ item.cleanedClassification }}</text>
                </view>
                <view class="info-row">
                  <text class="label">申请人：</text>
                  <text class="value">{{ item.applicationCompany }}</text>
                </view>
                <view class="info-row">
                  <text class="label">申请状态：</text>
                  <text class="value status">{{ item.applicationStatus }}</text>
                </view>
                <view class="info-row">
                  <text class="label">受理号：</text>
                  <text class="value">{{ item.acceptanceNo }}</text>
                </view>
                <view class="info-row">
                  <text class="label">适应症：</text>
                  <text class="value">{{ item.indication }}</text>
                </view>
              </template>

              <!-- 试验记录 -->
              <template v-if="activeTab === 'trial'">
                <view class="card-header">
                  <view class="title-row">
                    <text class="name">{{ item.drugStandardName }}</text>
                  </view>
                  <text class="date">{{ item.firstPublicityDate }}</text>
                </view>
                <view class="tag-row">
                  <text class="tag blue">{{ item.cleanedTrialStages }}</text>
                  <text class="tag green" v-if="item.trialStatus">{{ item.trialStatus }}</text>
                </view>
                <view class="info-row">
                  <text class="label">申请人：</text>
                  <text class="value">{{ item.sponsorContacts }}</text>
                </view>
                <view class="info-row">
                  <text class="label">登记号：</text>
                  <text class="value">{{ item.acceptanceNo }}</text>
                </view>
                <view class="info-row">
                  <text class="label">适应症：</text>
                  <text class="value">{{ item.indication }}</text>
                </view>
              </template>

              <!-- NDA 记录 -->
              <template v-if="activeTab === 'nda'">
                <view class="card-header">
                  <view class="title-row">
                    <text class="name">{{ item.productName }}</text>
                  </view>
                  <text class="date">{{ item.undertakeDate }}</text>
                </view>
                <view class="tag-row">
                  <text class="tag blue">{{ item.cleanedDrugType }}</text>
                  <text class="tag orange">{{ item.cleanedClassification }}</text>
                  <text class="tag purple" v-if="item.applyStatusStr">
                    {{ item.applyStatusStr }}
                  </text>
                </view>
                <view class="info-row">
                  <text class="label">申请人：</text>
                  <text class="value">{{ item.standardCompanyName }}</text>
                </view>
                <view class="info-row">
                  <text class="label">受理号：</text>
                  <text class="value">{{ item.acceptanceNo }}</text>
                </view>
                <view class="info-row">
                  <text class="label">批准日期：</text>
                  <text class="value">{{ item.approveDate }}</text>
                </view>
              </template>
            </view>
            <view class="loading-status" v-if="loading || noMore">
              <text>{{ loading ? '加载中...' : '没有更多了' }}</text>
            </view>
          </template>

          <!-- 空状态 -->
          <view class="empty-state" v-else-if="!loading">
            <text class="empty-text">暂无数据</text>
          </view>
        </view>
        <!-- #endregion -->
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { getIndApplicationList, getCdeTrailList, queryNdaProductList } from '@/api'

  // #region 基础状态
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  const drugInfo = reactive({
    drugStandardName: '',
    cleanedClassification: '',
    cleanedDrugType: '',
    standardCompanyName: '',
    parentCompanyId: ''
  })

  const activeTab = ref('ind')
  const tabOptions = ref([
    { label: 'IND记录', value: 'ind', count: 0 },
    { label: '试验记录', value: 'trial', count: 0 },
    { label: 'NDA记录', value: 'nda', count: 0 }
  ])

  const list = ref<any[]>([])
  const pageNum = ref(1)
  const pageSize = 10
  const loading = ref(false)
  const noMore = ref(false)
  // #endregion

  // #region 生命周期与初始化
  onLoad((options: any) => {
    // 获取胶囊位置信息
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    // 解析页面参数
    if (options) {
      drugInfo.drugStandardName = options.drugStandardName
        ? decodeURIComponent(options.drugStandardName)
        : ''
      drugInfo.cleanedClassification = options.cleanedClassification || ''
      drugInfo.cleanedDrugType = options.cleanedDrugType || ''
      drugInfo.standardCompanyName = options.standardCompanyName
        ? decodeURIComponent(options.standardCompanyName)
        : ''
      drugInfo.parentCompanyId = options.parentCompanyId || ''
    }

    fetchData()
  })

  const goBack = () => {
    uni.navigateBack()
  }
  // #endregion

  // #region 数据获取
  const fetchData = async (isRefresh = false) => {
    if (loading.value) return
    if (isRefresh) {
      pageNum.value = 1
      list.value = []
      noMore.value = false
    }
    if (noMore.value) return

    loading.value = true
    try {
      let res: any
      const commonParams = {
        drugStandardName: drugInfo.drugStandardName,
        parentCompanyId: Number(drugInfo.parentCompanyId) || undefined,
        pageNum: pageNum.value,
        pageSize: pageSize
      }

      if (activeTab.value === 'ind') {
        res = await getIndApplicationList(commonParams)
      } else if (activeTab.value === 'trial') {
        res = await getCdeTrailList(commonParams)
      } else if (activeTab.value === 'nda') {
        // NDA 接口参数略有不同
        res = await queryNdaProductList({
          ...commonParams,
          productName: drugInfo.drugStandardName
        })
      }

      const newList = res.data?.list || []
      list.value = [...list.value, ...newList]

      // 更新当前 tab 的数量
      const currentTab = tabOptions.value.find((t) => t.value === activeTab.value)
      if (currentTab) {
        currentTab.count = res.data?.total || 0
      }

      if (newList.length < pageSize) {
        noMore.value = true
      } else {
        pageNum.value++
      }
    } catch (error) {
      console.error('Fetch data failed:', error)
    } finally {
      loading.value = false
    }
  }

  const onTabChange = (value: string) => {
    if (activeTab.value === value) return
    activeTab.value = value
    fetchData(true)
  }

  const onScrollToLower = () => {
    fetchData()
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .page-container {
    height: calc(100vh);
    display: flex;
    flex-direction: column;
    .header,
    .drug-card,
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
    padding: 30rpx;
  }

  /* #region 药品详情卡片样式 */
  .drug-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 32rpx;
    box-shadow: 0 8rpx 32rpx rgba(73, 154, 230, 0.08);
    margin-bottom: 40rpx;

    .drug-header {
      margin-bottom: 20rpx;
      .drug-label {
        font-size: 32rpx;
        color: #333;
        font-weight: 500;
      }
      .drug-name {
        font-size: 36rpx;
        color: #499ae6;
        font-weight: 600;
      }
    }

    .tag-row {
      display: flex;
      gap: 16rpx;
      margin-bottom: 24rpx;

      .tag {
        padding: 6rpx 20rpx;
        border-radius: 8rpx;
        font-size: 24rpx;
      }
      .category {
        background: #eef7ff;
        color: #499ae6;
      }
      .type {
        background: #f5f0ff;
        color: #8c52ff;
      }
    }

    .company-row {
      background: #f8f9fb;
      padding: 16rpx 24rpx;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      gap: 20rpx;

      .company-label {
        font-size: 26rpx;
        color: #999;
      }
      .company-name {
        font-size: 28rpx;
        color: #666;
      }
    }
  }
  /* #endregion */

  /* #region 选项卡样式 */
  .tabs {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30rpx;
    border-bottom: 2rpx solid #f0f0f0;

    .tab-item {
      flex: 1;
      text-align: center;
      padding: 20rpx 0;
      position: relative;
      font-size: 28rpx;
      color: #666;

      &.active {
        color: #499ae6;
        font-weight: 600;
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
  /* #endregion */

  /* #region 列表卡片样式 */
  .record-card {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx;
    margin-bottom: 24rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20rpx;

      .title-row {
        display: flex;
        align-items: center;
        gap: 12rpx;
        flex: 1;

        .icon {
          width: 32rpx;
          height: 32rpx;
        }
        .name {
          font-size: 30rpx;
          color: #333;
          font-weight: 600;
        }
      }

      .date {
        font-size: 24rpx;
        color: #999;
      }
    }

    .tag-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      margin-bottom: 20rpx;

      .tag {
        padding: 4rpx 12rpx;
        border-radius: 4rpx;
        font-size: 22rpx;

        &.blue {
          background: #eef7ff;
          color: #499ae6;
        }
        &.orange {
          background: #fff7ee;
          color: #ff9800;
        }
        &.green {
          background: #eefcf0;
          color: #4caf50;
        }
        &.purple {
          background: #f5f0ff;
          color: #8c52ff;
        }
      }
    }

    .info-row {
      display: flex;
      margin-bottom: 12rpx;
      line-height: 1.4;

      .label {
        width: 140rpx;
        font-size: 26rpx;
        color: #999;
        flex-shrink: 0;
      }
      .value {
        font-size: 26rpx;
        color: #666;
        &.status {
          color: #4caf50;
        }
      }
    }
  }
  /* #endregion */

  /* #region 空状态与加载 */
  .empty-state {
    padding-top: 100rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    .empty-img {
      width: 320rpx;
      height: 320rpx;
      margin-bottom: 20rpx;
    }
    .empty-text {
      font-size: 28rpx;
      color: #999;
    }
  }

  .loading-status {
    text-align: center;
    padding: 30rpx 0;
    font-size: 24rpx;
    color: #999;
  }
  /* #endregion */
</style>
