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
          <svg
            v-if="active === item.key"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 10.5V21C3 21.5523 3.44772 22 4 22H8C8.55228 22 9 21.5523 9 21V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21C15 21.5523 15.4477 22 16 22H20C20.5523 22 21 21.5523 21 21V10.5M3 10.5L11.2929 2.20711C11.6834 1.81658 12.3166 1.81658 12.7071 2.20711L21 10.5M3 10.5H21"
              stroke="#2B76F6"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
          <svg
            v-else
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 10.5V21C3 21.5523 3.44772 22 4 22H8C8.55228 22 9 21.5523 9 21V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21C15 21.5523 15.4477 22 16 22H20C20.5523 22 21 21.5523 21 21V10.5M3 10.5L11.2929 2.20711C11.6834 1.81658 12.3166 1.81658 12.7071 2.20711L21 10.5M3 10.5H21"
              stroke="#9199AE"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </template>

        <!-- 商机图标 -->
        <template v-else-if="item.key === 'opportunity'">
          <svg
            v-if="active === item.key"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="9" stroke="#2B76F6" stroke-width="2" />
            <circle cx="12" cy="12" r="5" stroke="#2B76F6" stroke-width="2" />
            <circle cx="12" cy="12" r="1" fill="#2B76F6" />
            <path d="M12 2V5" stroke="#2B76F6" stroke-width="2" stroke-linecap="round" />
            <path d="M12 19V22" stroke="#2B76F6" stroke-width="2" stroke-linecap="round" />
            <path d="M2 12H5" stroke="#2B76F6" stroke-width="2" stroke-linecap="round" />
            <path d="M19 12H22" stroke="#2B76F6" stroke-width="2" stroke-linecap="round" />
          </svg>
          <svg
            v-else
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="9" stroke="#9199AE" stroke-width="2" />
            <circle cx="12" cy="12" r="5" stroke="#9199AE" stroke-width="2" />
            <circle cx="12" cy="12" r="1" fill="#9199AE" />
            <path d="M12 2V5" stroke="#9199AE" stroke-width="2" stroke-linecap="round" />
            <path d="M12 19V22" stroke="#9199AE" stroke-width="2" stroke-linecap="round" />
            <path d="M2 12H5" stroke="#9199AE" stroke-width="2" stroke-linecap="round" />
            <path d="M19 12H22" stroke="#9199AE" stroke-width="2" stroke-linecap="round" />
          </svg>
        </template>

        <!-- 我的图标 -->
        <template v-else-if="item.key === 'mine'">
          <svg
            v-if="active === item.key"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21"
              stroke="#2B76F6"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle cx="12" cy="7" r="4" stroke="#2B76F6" stroke-width="2" />
          </svg>
          <svg
            v-else
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 21C20 18.2386 16.4183 16 12 16C7.58172 16 4 18.2386 4 21"
              stroke="#9199AE"
              stroke-width="2"
              stroke-linecap="round"
            />
            <circle cx="12" cy="7" r="4" stroke="#9199AE" stroke-width="2" />
          </svg>
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
      path: '/pages/business-club-list/index'
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
    height: 100rpx;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    z-index: 999;

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
        font-size: 20rpx;
        color: #9199ae;
        line-height: 28rpx;

        &.active {
          color: #2b76f6;
          font-weight: 500;
        }
      }
    }
  }
</style>
