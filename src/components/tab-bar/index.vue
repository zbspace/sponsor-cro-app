<template>
  <view class="tab-bar">
    <!-- #region 导航项 -->
    <view
      v-for="(item, index) in tabList"
      :key="index"
      class="tab-item"
      @click="handleTabClick(item)"
    >
      <view class="icon-wrapper">
        <!-- 首页图标 -->
        <template v-if="item.key === 'home'">
          <image class="close-icon" src="../../static/icons/首页1.png"  v-if="active === item.key" mode="aspectFit" />
          <image class="close-icon" src="../../static/icons/首页.png" v-else mode="aspectFit" />
        </template>

        <!-- 商机图标 -->
        <template v-else-if="item.key === 'opportunity'">
          <image class="close-icon" src="../../static/icons/商机1.png"  v-if="active === item.key" mode="aspectFit" />
          <image class="close-icon" src="../../static/icons/商机.png" v-else mode="aspectFit" />
        </template>

        <!-- 我的图标 -->
        <template v-else-if="item.key === 'mine'">
          <image class="close-icon" src="../../static/icons/我的1.png"  v-if="active === item.key" mode="aspectFit" />
          <image class="close-icon" src="../../static/icons/我的.png" v-else mode="aspectFit" />
        </template>
      </view>
      
      <text class="tab-text" :class="{ active: active === item.key }">{{ item.text }}</text>
    </view>
    <!-- #endregion -->
  </view>
</template>

<script setup lang="ts">
  // #region 属性与列表
  interface Props {
    active: string
  }

  const props = defineProps<Props>()

  const tabList = [
    {
      key: 'home',
      text: '首页',
      path: '/pages/index/index'
    },
    {
      key: 'opportunity',
      text: '商机',
      path: '/pages/business-leads/index'
    },
    {
      key: 'mine',
      text: '我的',
      path: '/pages/vip/index'
    }
  ]
  // #endregion

  // #region 方法
  const handleTabClick = (item: (typeof tabList)[0]) => {
    if (props.active === item.key) return

    uni.reLaunch({
      url: item.path
    })
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .tab-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-around;
    // padding-bottom: constant(safe-area-inset-bottom);
    // padding-bottom: env(safe-area-inset-bottom);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 999;
    height: 70px;

    .tab-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;

      .icon-wrapper {
        width: 48rpx;
        height: 48rpx;
        margin-bottom: 4rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .tab-text {
        font-weight: 400;
        font-size: 20rpx;
        color: #9199AE;
        line-height: 32rpx;

        &.active {
          color: #2b76f6;
          font-weight: 500;
        }
      }
    }
  }
</style>
