<template>
  <view class="page-wrapper">
    <!-- 头部导航 -->
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

    <!-- 搜索栏与收藏 -->
    <view class="top-section" :style="{ top: `${menu.top + menu.height + 10}px` }">
      <view class="search-bar">
        <view class="filter-text">相关公司 | 全部</view>
        <view class="arrow-down-icon"></view>
      </view>
      <view class="favorite-btn" @click="toggleFavorite">
        <icon
          :type="isFavorite ? 'success' : 'circle'"
          size="24"
          :color="isFavorite ? '#499ae6' : '#CCCCCC'"
        />
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
      <view class="container">
        <!-- 研发管线 -->
        <view class="section-card">
          <view class="section-title">研发管线</view>
          <view class="grid-container">
            <view class="grid-item">
              <view class="item-icon ind">IND</view>
              <view class="item-info">
                <text class="label">新药临床试验申请</text>
                <text class="value">34</text>
              </view>
            </view>
            <view class="grid-item">
              <view class="item-icon cde">CDE</view>
              <view class="item-info">
                <text class="label">临床试验登记</text>
                <text class="value">234</text>
              </view>
            </view>
            <view class="grid-item">
              <view class="item-icon nda">NDA</view>
              <view class="item-info">
                <text class="label">新药上市申请</text>
                <text class="value">144</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 供应商合作记录 -->
        <view class="section-card">
          <view class="section-title">供应商合作记录</view>
          <view class="grid-container">
            <view class="grid-item">
              <view class="item-icon cro">CRO</view>
              <view class="item-info">
                <text class="label">CRO公司</text>
                <text class="value">34</text>
              </view>
            </view>
            <view class="grid-item">
              <view class="item-icon lab">
                <image src="../../static/icons/cro.png" mode="aspectFit" />
              </view>
              <view class="item-info">
                <text class="label">中心实验室</text>
                <text class="value">234</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 医院&研究者合作记录 -->
        <view class="section-card">
          <view class="section-title">医院&研究者合作记录</view>
          <view class="grid-container">
            <view class="grid-item">
              <view class="item-icon hospital">
                <image src="../../static/icons/hospital.png" mode="aspectFit" v-if="false" />
                <text style="color: #52c41a; font-size: 24rpx">H</text>
              </view>
              <view class="item-info">
                <text class="label">医院</text>
                <text class="value">34</text>
              </view>
            </view>
            <view class="grid-item">
              <view class="item-icon researcher">
                <image src="../../static/icons/sponsor.png" mode="aspectFit" v-if="false" />
                <text style="color: #9013fe; font-size: 24rpx">R</text>
              </view>
              <view class="item-info">
                <text class="label">主要研究者</text>
                <text class="value">234</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 商机线索 -->
        <view class="section-card">
          <view class="section-title">商机线索</view>
          <view class="grid-container">
            <view class="grid-item">
              <view class="item-icon leads-post">
                <image src="../../static/icons/time.png" mode="aspectFit" />
              </view>
              <view class="item-info">
                <text class="label">上市后</text>
                <text class="value">34</text>
              </view>
            </view>
            <view class="grid-item">
              <view class="item-icon leads-pre">
                <image src="../../static/icons/time.png" mode="aspectFit" />
              </view>
              <view class="item-info">
                <text class="label">上市前</text>
                <text class="value">234</text>
              </view>
            </view>
            <view class="grid-item">
              <view class="item-icon product">
                <image src="../../static/home/3.png" mode="aspectFit" />
              </view>
              <view class="item-info">
                <text class="label">最值得跟进产品</text>
                <text class="value">144</text>
              </view>
            </view>
            <view class="grid-item">
              <view class="item-icon contact">
                <image src="../../static/icons/sponsor.png" mode="aspectFit" />
              </view>
              <view class="item-info">
                <text class="label">企业联系人</text>
                <text class="value">144</text>
              </view>
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
  const companyName = ref('百济神州')
  const isFavorite = ref(false)
  // #endregion

  // #region 生命周期
  onLoad((options) => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    if (options?.name) {
      companyName.value = decodeURIComponent(options.name)
    }
  })
  // #endregion

  // #region 方法
  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  function toggleFavorite() {
    isFavorite.value = !isFavorite.value
    uni.showToast({
      title: isFavorite.value ? '已收藏' : '已取消收藏',
      icon: 'none'
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

  .top-section {
    position: fixed;
    left: 30rpx;
    right: 30rpx;
    z-index: 90;
    display: flex;
    align-items: center;
    gap: 20rpx;
  }

  .search-bar {
    flex: 1;
    background: #ffffff;
    border-radius: 20rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

    .filter-text {
      font-size: 28rpx;
      color: #999;
    }

    .arrow-down-icon {
      width: 0;
      height: 0;
      border-left: 10rpx solid transparent;
      border-right: 10rpx solid transparent;
      border-top: 12rpx solid #cccccc;
    }
  }

  .favorite-btn {
    width: 88rpx;
    height: 88rpx;
    background: #ffffff;
    border-radius: 20rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  }

  .container {
    padding: 0 30rpx 30rpx;
  }

  .section-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

    .section-title {
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 30rpx;
      padding-left: 20rpx;
      position: relative;
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

    .grid-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20rpx;

      .grid-item {
        background: #f7f8fa;
        border-radius: 20rpx;
        padding: 24rpx;
        display: flex;
        align-items: center;
        gap: 20rpx;

        .item-icon {
          width: 80rpx;
          height: 80rpx;
          border-radius: 20rpx;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: bold;
          font-size: 20rpx;
          background: #ffffff;
          flex-shrink: 0;
          image {
            width: 40rpx;
            height: 40rpx;
          }

          &.ind {
            color: #9013fe;
          }
          &.cde {
            color: #499ae6;
          }
          &.nda {
            color: #52c41a;
          }
          &.cro {
            color: #9013fe;
          }
          &.lab {
            background: #e6f7ff;
          }
          &.hospital {
            background: #f6ffed;
          }
          &.researcher {
            background: #f9f0ff;
          }
          &.leads-post,
          &.leads-pre {
            background: #f0f5ff;
            image {
              opacity: 0.6;
            }
          }
          &.product {
            background: #e6fff1;
          }
          &.contact {
            background: #fff7e6;
          }
        }

        .item-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          .label {
            font-size: 22rpx;
            color: #999;
            margin-bottom: 8rpx;
          }
          .value {
            font-size: 32rpx;
            color: #333;
            font-weight: bold;
          }
        }
      }
    }
  }
</style>
