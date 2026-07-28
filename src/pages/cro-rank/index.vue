<template>
  <!-- 顶部背景与导航 -->
  <view class="header-bg" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-bar" :style="{ height: `${menu.height}px` }">
      <view class="back-btn" @click="goBack">
        <view class="back-icon"></view>
      </view>
    </view>
  </view>

  <image class="bg-img" src="../../static/icons/rank-bg.png" mode="aspectFit" />

  <view class="content-body">
    <!-- 年份选择 -->
    <view class="filter-card">
      <uni-data-select
        v-model="selectedYear"
        :localdata="yearOptions"
        :clear="false"
        placeholder="选择年份"
      />
    </view>

    <!-- 榜单表格 -->
    <view class="rank-table-card">
      <view class="table-header">
        <text class="col-rank">排序</text>
        <text class="col-name">CRO公司</text>
        <text class="col-exp">项目经验</text>
        <text class="col-pharma">合作药企</text>
      </view>

      <scroll-view
        scroll-y
        class="scroll-view"
        @scrolltolower="onScrollToLower"
        :show-scrollbar="false"
        :style="{
          height: `calc(100vh - ${menu.top}px - ${menu.height}px - 350px)`
        }"
      >
        <view
          class="table-row"
          v-for="(item, index) in rankList"
          :key="index"
          :class="{ zebra: index % 2 === 1 }"
        >
          <text class="col-rank">{{ index + 1 }}</text>
          <text class="col-name highlight">{{ item.name }}</text>
          <text class="col-exp">{{ item.experience }}</text>
          <text class="col-pharma">{{ item.partners }}</text>
        </view>

        <view class="loading-status" v-if="loading || noMore">
          <text>{{ loading ? '加载中...' : '没有更多了' }}</text>
        </view>
        <view class="empty-tip" v-if="rankList.length === 0 && !loading">暂无数据</view>
      </scroll-view>
    </view>
  </view>

  <!-- 底部按钮 -->
  <view class="footer">
    <view class="share-btn">分享</view>
  </view>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { getCroRankList } from '@/api'

  // #region 筛选
  const selectedYear = ref('')

  const yearOptions = (() => {
    const currentYear = new Date().getFullYear()
    const options = [{ value: '', text: '全部历史' }]
    for (let y = currentYear; y >= 2016; y--) {
      options.push({ value: String(y), text: `${y}年度` })
    }
    return options
  })()
  // #endregion

  // #region 榜单数据
  const rankList = ref<{ name: string; experience: number; partners: number }[]>([])
  const loading = ref(false)
  const noMore = ref(false)
  const page = ref(1)
  const pageSize = 10

  const fetchRankData = async (reset = false) => {
    if (loading.value || noMore.value) return

    if (reset) {
      page.value = 1
      rankList.value = []
      noMore.value = false
    }

    loading.value = true

    try {
      const res = await getCroRankList(page.value, pageSize, selectedYear.value)
      if (res.data?.list) {
        const mapped = res.data.list.map((item) => ({
          name: item.parentCompanyShortName,
          experience: item.projectExperienceNum,
          partners: item.cooperationEnterpriseNum
        }))

        if (reset) {
          rankList.value = mapped
        } else {
          rankList.value = [...rankList.value, ...mapped]
        }

        if (page.value >= res.data.pages) {
          noMore.value = true
        }
      }
    } catch {
      // 静默处理
    } finally {
      loading.value = false
      page.value++
    }
  }

  watch(selectedYear, () => {
    fetchRankData(true)
  })
  // #endregion

  // #region 滚动加载
  const onScrollToLower = () => {
    fetchRankData()
  }
  // #endregion

  const goBack = () => {
    uni.navigateBack()
  }

  // 胶囊位置
  const menu = ref({ top: 44, height: 32 })
  onLoad(() => {
    // #ifdef MP-WEIXIN
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    // #endif
    fetchRankData(true)
  })
</script>

<style lang="scss" scoped>
  .header-bg {
    padding-top: 400rpx;
    position: relative;
    overflow: hidden;

    .nav-bar {
      padding-left: 30rpx;
      display: flex;
      align-items: center;

      .back-btn {
        width: 60rpx;
        height: 60rpx;
        display: flex;
        align-items: center;

        .back-icon {
          width: 20rpx;
          height: 20rpx;
          border-left: 4rpx solid #333;
          border-bottom: 4rpx solid #333;
          transform: rotate(45deg);
        }
      }
    }

    .header-content {
      padding: 40rpx 40rpx 20rpx;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      position: relative;
      z-index: 1;

      .title-section {
        flex: 1;
        .main-title {
          font-size: 44rpx;
          font-weight: bold;
          color: #003087;
          font-style: italic;
          display: block;
          margin-bottom: 16rpx;
        }
        .sub-title {
          font-size: 22rpx;
          color: #f38a8a;
          line-height: 1.4;
        }
      }
    }
  }

  .content-body {
    padding: 0 30rpx;
    margin-top: 216rpx;

    .filter-card {
      background: #ffffff;
      height: 90rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      padding: 0;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);
      margin-bottom: 30rpx;

      :deep(.uni-select) {
        flex: 1;
        border: none;
        .uni-select__input-text {
          font-size: 28rpx;
          color: #adadad;
        }
        .uni-select__selector {
          .uni-select__selector-item {
            line-height: 40px;
          }
        }
      }
    }

    .rank-table-card {
      background: #ffffff;
      border-radius: 24rpx;
      padding: 20rpx;
      box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

      .table-header {
        display: flex;
        padding: 30rpx 0;
        border-bottom: 2rpx solid #f8f8f8;

        text {
          font-size: 26rpx;
          color: #666;
          text-align: center;
        }
      }

      .table-row {
        display: flex;
        padding: 30rpx 0;
        align-items: center;

        &.zebra {
          background-color: #fcfdfe;
        }

        text {
          font-size: 28rpx;
          color: #333;
          text-align: center;
        }

        .highlight {
          color: #499ae6;
        }
      }

      .col-rank {
        width: 100rpx;
      }
      .col-name {
        flex: 2;
        text-align: left !important;
        padding-left: 20rpx;
      }
      .col-exp {
        flex: 1;
      }
      .col-pharma {
        flex: 1;
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
  }

  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 30rpx 40rpx 60rpx;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, #fff 40%);
    z-index: 10;

    .share-btn {
      background: #499ae6;
      color: #ffffff;
      height: 90rpx;
      border-radius: 45rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32rpx;
      box-shadow: 0 8rpx 20rpx rgba(73, 154, 230, 0.3);
    }
  }
</style>
