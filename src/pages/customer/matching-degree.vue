<template>
  <view class="page-wrapper">
    <!-- 头部导航 -->
    <view class="header" :style="{ paddingTop: `${menu.top}px` }">
      <view class="nav-left" @click="goBack">
        <view class="back-icon">
          <view class="arrow"></view>
        </view>
      </view>
      <text class="title">匹配度</text>
      <view class="nav-right"></view>
    </view>

    <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

    <!-- 搜索栏 -->
    <view class="search-section" :style="{ top: `${menu.top + menu.height + 10}px` }">
      <view class="search-bar">
        <icon type="search" size="18" color="#CCCCCC" class="search-icon" />
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="输入查找目标客户"
          placeholder-style="color: #CCCCCC"
        />
        <view class="arrow-down-icon"></view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="container-scroll-view"
      :show-scrollbar="false"
      enhanced
      :style="{
        height: `calc(100vh - ${menu.top + menu.height + 80}px)`,
        marginTop: `${menu.top + menu.height + 70}px`
      }"
    >
      <view class="list-container">
        <view
          class="company-card"
          v-for="(item, index) in list"
          :key="index"
          @click="goToDetail(item)"
        >
          <view class="card-header">
            <view class="company-info">
              <view class="company-logo">{{ item.shortName[0] }}</view>
              <text class="company-name">{{ item.name }}</text>
            </view>
            <view class="match-score">
              <text class="label">匹配分配：</text>
              <text class="value">{{ item.score }}</text>
            </view>
          </view>

          <view class="match-details">
            <view class="detail-item">
              <view class="status-icon" :class="{ success: item.indicationMatch }">
                <icon
                  :type="item.indicationMatch ? 'success' : 'clear'"
                  size="14"
                  :color="item.indicationMatch ? '#52C41A' : '#F5222D'"
                />
              </view>
              <text class="detail-label">适应症匹配记录</text>
              <text class="detail-count">{{ item.indicationCount }}</text>
            </view>
            <view class="detail-item">
              <view class="status-icon" :class="{ success: item.drugMatch }">
                <icon
                  :type="item.drugMatch ? 'success' : 'clear'"
                  size="14"
                  :color="item.drugMatch ? '#52C41A' : '#F5222D'"
                />
              </view>
              <text class="detail-label">药品匹配记录</text>
              <text class="detail-count">{{ item.drugCount }}</text>
            </view>
            <view class="detail-item">
              <view class="status-icon" :class="{ success: item.leadMatch }">
                <icon
                  :type="item.leadMatch ? 'success' : 'clear'"
                  size="14"
                  :color="item.leadMatch ? '#52C41A' : '#F5222D'"
                />
              </view>
              <text class="detail-label">商机线索匹配记录</text>
              <text class="detail-count">{{ item.leadCount }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <phone-bind-popup />
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  // #endregion

  // #region 状态
  const menu = ref({ top: 0, left: 0, height: 0 })
  const searchKeyword = ref('')

  const list = ref([
    {
      name: '恒瑞医药',
      shortName: '恒',
      score: 47,
      indicationMatch: true,
      indicationCount: 12,
      drugMatch: true,
      drugCount: 12,
      leadMatch: false,
      leadCount: 12
    },
    {
      name: '恒瑞医药',
      shortName: '恒',
      score: 47,
      indicationMatch: true,
      indicationCount: 12,
      drugMatch: true,
      drugCount: 12,
      leadMatch: true,
      leadCount: 12
    },
    {
      name: '恒瑞医药',
      shortName: '恒',
      score: 47,
      indicationMatch: true,
      indicationCount: 12,
      drugMatch: true,
      drugCount: 12,
      leadMatch: true,
      leadCount: 12
    }
  ])
  // #endregion

  // #region 生命周期
  onLoad((options) => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    if (options?.indication || options?.drugName) {
      searchKeyword.value = options.indication || options.drugName
    }
  })
  // #endregion

  // #region 方法
  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  function goToDetail(item: any) {
    uni.navigateTo({
      url: `/pages/customer/company-detail?name=${encodeURIComponent(item.name)}`
    })
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .page-wrapper {
    background: #f8f9fb;
    min-height: 100vh;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx;
    height: 88rpx;
    position: relative;
    z-index: 100;

    .nav-left {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      .back-icon {
        width: 40rpx;
        height: 40rpx;
        .arrow {
          width: 20rpx;
          height: 20rpx;
          border-top: 4rpx solid #333;
          border-left: 4rpx solid #333;
          transform: rotate(-45deg);
        }
      }
    }

    .title {
      font-size: 34rpx;
      font-weight: 500;
      color: #333;
    }

    .nav-right {
      width: 60rpx;
    }
  }

  .bg-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 300rpx;
    z-index: 1;
  }

  .search-section {
    position: fixed;
    left: 30rpx;
    right: 30rpx;
    z-index: 90;
  }

  .search-bar {
    background: #ffffff;
    border-radius: 20rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

    .search-icon {
      margin-right: 16rpx;
    }

    input {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }

    .arrow-down-icon {
      width: 0;
      height: 0;
      border-left: 10rpx solid transparent;
      border-right: 10rpx solid transparent;
      border-top: 12rpx solid #cccccc;
      margin-left: 16rpx;
    }
  }

  .list-container {
    padding: 0 30rpx 30rpx;
  }

  .company-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30rpx;

      .company-info {
        display: flex;
        align-items: center;
        gap: 20rpx;

        .company-logo {
          width: 64rpx;
          height: 64rpx;
          background: #499ae6;
          border-radius: 50%;
          color: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 32rpx;
          font-weight: bold;
        }

        .company-name {
          font-size: 32rpx;
          color: #333;
          font-weight: bold;
        }
      }

      .match-score {
        font-size: 24rpx;
        .label {
          color: #499ae6;
        }
        .value {
          color: #499ae6;
          font-weight: bold;
        }
      }
    }

    .match-details {
      background: #f7f8fa;
      border-radius: 20rpx;
      padding: 20rpx 30rpx;

      .detail-item {
        display: flex;
        align-items: center;
        margin-bottom: 20rpx;
        &:last-child {
          margin-bottom: 0;
        }

        .status-icon {
          margin-right: 16rpx;
          display: flex;
          align-items: center;
        }

        .detail-label {
          flex: 1;
          font-size: 26rpx;
          color: #666;
        }

        .detail-count {
          font-size: 26rpx;
          color: #333;
          width: 60rpx;
          text-align: right;
        }
      }
    }
  }
</style>
