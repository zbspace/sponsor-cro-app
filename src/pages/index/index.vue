<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="vip-btn-wrapper" v-if="isVip !== 1" @click="handleApplyTrialClick">
      <text>申请试用</text>
      <view class="arrow-right-icon" style="border-color: #fff"></view>
    </view>
    <view class="vip-badge" v-else @click="goTo('vip/index')">
      <image class="vip-badge-icon" src="/static/vip-icon.svg" mode="aspectFit" />
      <text>尊享会员</text>
    </view>
  </view>

  <image class="bg-img" src="../../static/home/head-bg.png" mode="aspectFit" />

  <scroll-view
    scroll-y
    class="container-scroll-view"
    :show-scrollbar="false"
    enhanced
    :style="{
      height: `calc(100vh - ${menu.top}px - ${menu.height}px)`
    }"
  >
    <view class="container">
      <!-- 标题 -->
      <view class="title-section">
        <text class="main-title">药研查-商务版</text>
        <text class="sub-title">明熟客情 稳妥商机</text>
      </view>

      <!-- 内容 -->
      <!-- #region 功能网格 -->
      <view class="feature-grid">
        <view
          class="grid-item"
          v-for="(item, index) in gridItems"
          :key="index"
          @click="handleGridClick(item)"
        >
          <view class="item-content">
            <text class="item-title">{{ item.title }}</text>
            <view class="item-desc">
              <text>{{ item.desc }}</text>
              <view class="arrow-right-icon-white"></view>
            </view>
          </view>
          <image class="item-icon" :src="item.icon" mode="aspectFit" />
        </view>
      </view>
      <!-- #endregion -->

      <!-- #region 数据榜单 -->
      <view class="rank-section">
        <view class="section-header">
          <view class="header-line"></view>
          <text class="header-title">数据榜单</text>
        </view>
        <view class="rank-list">
          <view
            class="rank-item"
            v-for="(item, index) in rankLists"
            :key="index"
            @click="goTo(item.path)"
          >
            <view class="rank-icon-wrapper">
              <view v-if="item.icon === 'CRO'" class="cro-icon">CRO</view>
              <image v-else class="rank-icon" :src="item.iconUrl" mode="aspectFit" />
            </view>
            <text class="rank-title">{{ item.title }}</text>
            <view class="arrow-right-icon"></view>
          </view>
        </view>
      </view>
      <!-- #endregion -->

      <!-- 底部助手标语 -->
      <view class="bd-assistant-section">
        <text class="bd-slogan">- 助力BD拿单 -</text>
      </view>

      <!-- 底部 -->
      <view class="footer">
        <view class="footer-links">
          <button class="footer-link-item share-btn" open-type="share">
            <image class="footer-icon" src="/static/icons/分享.png" mode="aspectFit" />
            <text>分享给朋友</text>
          </button>
          <view class="footer-link-item" @click="showDataStatement = true">
            <image class="footer-icon" src="/static/icons/数据声明.png" mode="aspectFit" />
            <text>数据声明</text>
          </view>
          <view class="footer-link-item" @click="goTo('contact/index')">
            <image class="footer-icon" src="/static/icons/联系我们.png" mode="aspectFit" />
            <text>联系我们</text>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>

  <!-- 数据声明弹窗 -->
  <data-statement-popup v-model:visible="showDataStatement" />

  <!-- 手机号绑定弹窗 -->
  <phone-bind-popup />

  <!-- 搜索弹窗 -->
  <search-company-popup v-model:visible="showSearchPopup" />

  <!-- 申请试用弹窗 -->
  <trial-apply-popup v-model:visible="showTrialPopup" />

  <!-- 找客户弹窗 -->
  <find-customer-popup v-model:visible="showFindPopup" />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref } from 'vue'
  import { onShow, onLoad } from '@dcloudio/uni-app'
  import DataStatementPopup from '../../components/data-statement-popup/data-statement-popup.vue'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import SearchCompanyPopup from '@/components/search-company-popup/search-company-popup.vue'
  import TrialApplyPopup from '@/components/trial-apply-popup/trial-apply-popup.vue'
  import FindCustomerPopup from '@/components/find-customer-popup/find-customer-popup.vue'
  import { getVip, ensureLogin } from '@/api'
  // #endregion

  // #region 状态
  const isVip = ref(0)
  const showDataStatement = ref(false)
  const showSearchPopup = ref(false)
  const showTrialPopup = ref(false)
  const showFindPopup = ref(false)

  // 功能网格数据
  const gridItems = [
    {
      title: '查客户',
      desc: '立即前往',
      icon: '/static/home/1.png',
      path: 'customer/search'
    },
    {
      title: '找客户',
      desc: '立即前往',
      icon: '/static/home/2.png',
      path: 'customer/company-detail'
    },
    {
      title: '查产品',
      desc: '立即前往',
      icon: '/static/home/3.png',
      path: 'trial-list/index'
    },
    {
      title: '查药企&CRO\n合作关系',
      desc: '立即前往',
      icon: '/static/home/4.png',
      path: 'cro-stat/index',
      special: true
    },
    {
      title: '查药企&中心实\n验室合作关系',
      desc: '立即前往',
      icon: '/static/home/5.png',
      path: 'lab-stat/index'
    },
    {
      title: '查药企&医院/研\n究者合作关系',
      desc: '立即前往',
      icon: '/static/home/6.png',
      path: 'hospital-stat/index'
    }
  ]

  // 数据榜单数据
  const rankLists = [
    {
      title: '中国临床CRO公司榜单',
      icon: 'CRO',
      iconColor: '/static/home/10.png',
      path: 'cro-rank/index'
    },
    {
      title: '近5年附条件批准药品',
      icon: 'med',
      iconUrl: '/static/home/11.png',
      path: 'medicine-rank/conditional'
    },
    {
      title: '近5年1类新药获批名单',
      icon: 'doc',
      iconUrl: '/static/home/12.png',
      path: 'medicine-rank/new-drug'
    },
    {
      title: '中国药企临床试验榜单',
      icon: 'building',
      iconUrl: '/static/home/13.png',
      path: 'sponsor-stat/index'
    }
  ]
  // #endregion
  onShow(async () => {
    // 确保登录成功后再获取数据
    await ensureLogin()
    isVip.value = getVip()
  })
  // #endregion

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  function goTo(path: string, query?: string) {
    const url = query ? `/pages/${path}?${query}` : `/pages/${path}`
    uni.navigateTo({ url })
  }

  function handleGridClick(item: any) {
    if (item.special) {
      showSearchPopup.value = true
    } else if (item.title === '找客户') {
      showFindPopup.value = true
    } else if (item.path) {
      goTo(item.path)
    } else {
      uni.showToast({ title: '该功能暂未开启', icon: 'none' })
    }
  }

  function handleApplyTrialClick() {
    showTrialPopup.value = true
  }

  onLoad(() => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
  })
</script>

<style lang="scss" scoped>
  /* #region 标题 */
  .title-section {
    text-align: center;
    margin-bottom: 60rpx;

    .main-title {
      font-weight: 400;
      font-size: 44rpx;
      color: #293959;
      line-height: 96rpx;
      margin-bottom: 18rpx;
    }

    .sub-title {
      font-weight: 400;
      font-size: 28rpx;
      color: #9199ae;
      line-height: 52rpx;
      margin-bottom: 60rpx;
      display: block;
    }
  }
  /* #endregion */

  /* #region 底部助手 */
  .bd-assistant-section {
    text-align: center;
    margin-bottom: 40rpx;
    .bd-slogan {
      display: block;
      font-size: 24rpx;
      color: #cccccc;
    }
  }
  /* #endregion */

  /* #region 功能网格 */
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 30rpx;
    margin-bottom: 30rpx;

    .grid-item {
      position: relative;
      width: 210rpx;
      height: 142rpx;
      padding: 20rpx;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;

      .item-content {
        position: relative;
        z-index: 2;

        .item-title {
          display: block;
          font-size: 24rpx;
          color: #ffffff;
          font-weight: 400;
          margin-bottom: 10rpx;
        }

        .item-desc {
          display: flex;
          font-size: 16rpx;
          color: #ffffff;
          align-items: center;
          opacity: 0.8;
          .arrow-right-icon-white {
            width: 10rpx;
            height: 10rpx;
            margin-left: 8rpx;
          }
        }
      }

      .item-icon {
        position: absolute;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        z-index: 1;
      }
    }
  }
  /* #endregion */

  /* #region 数据榜单 */
  .rank-section {
    background: #ffffff;
    border-radius: 20rpx;
    padding: 30rpx 30rpx 0 30rpx;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    margin-bottom: 68rpx;

    .section-header {
      display: flex;
      align-items: center;
      margin-bottom: 10rpx;

      .header-line {
        width: 4px;
        height: 16px;
        background: #499ae6;
        border-radius: 2px;
        margin-right: 8px;
      }

      .header-title {
        font-size: 16px;
        font-weight: bold;
        color: #333333;
      }
    }

    .rank-list {
      .rank-item {
        display: flex;
        align-items: center;
        padding: 16px 0;
        border-bottom: 1px solid #f5f5f5;

        &:last-child {
          border-bottom: none;
        }

        .rank-icon-wrapper {
          width: 32px;
          height: 32px;
          margin-right: 12px;
          display: flex;
          justify-content: center;
          align-items: center;

          .cro-icon {
            width: 32px;
            height: 32px;
            background: #eef6ff;
            color: #499ae6;
            font-size: 10px;
            font-weight: bold;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .rank-icon {
            width: 32px;
            height: 32px;
          }
        }

        .rank-title {
          flex: 1;
          font-size: 15px;
          color: #333333;
        }

        .arrow-right {
          width: 8px;
          height: 8px;
          border-top: 2px solid #cccccc;
          border-right: 2px solid #cccccc;
          transform: rotate(45deg);
        }
      }
    }
  }
  /* #endregion */

  /* #region 底部 */
  .footer {
    text-align: center;

    .footer-text {
      display: block;
      font-weight: 400;
      font-size: 24rpx;
      color: #999999;
      line-height: 52rpx;
      text-align: left;
      font-style: normal;
      text-transform: none;
      margin-bottom: 20rpx;
      text-align: center;
    }

    .footer-sub {
      display: block;
      font-weight: 400;
      font-size: 24rpx;
      color: #999999;
      line-height: 52rpx;
      text-align: left;
      font-style: normal;
      text-transform: none;
      margin-bottom: 60rpx;
      text-align: center;
    }

    .footer-links {
      display: flex;
      justify-content: center;
      gap: 60rpx;
      font-size: 24rpx;
      color: #666;
      margin-bottom: 70rpx;

      .footer-link-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        font-weight: 400;
        font-size: 24rpx;
        color: #666666;
        line-height: 52rpx;
        text-align: left;
        font-style: normal;
        text-transform: none;

        .footer-icon {
          width: 66rpx;
          height: 66rpx;
          margin-bottom: 20rpx;
        }
      }

      .share-btn {
        background-color: transparent;
        padding: 0;
        margin: 0;
        border: none;
        border-radius: 0;
        color: #666;
        overflow: visible;
        line-height: 52rpx;

        &::after {
          display: none;
        }
      }
    }
  }
  /* #endregion */
</style>
