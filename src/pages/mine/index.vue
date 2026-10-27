<!-- 我的 -->
<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left">
      <view class="back-icon visibility-hidden">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">{{ '我的' }}</text>
    <view class="nav-right"></view>
  </view>

  <!-- #region 背景与页面容器 -->
  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <view class="page" :style="{ height: `calc(100vh - ${menu.top}px - ${menu.height}px - 70px)` }">
    <!-- #region 用户信息 -->
    <view class="profile-card">
      <view class="pc-top" @click="goProfileSetup">
        <view class="pc-ava-wrap">
          <image class="pc-ava" :src="userInfo?.avatarUrl || defaultAvatar" mode="aspectFill" />
          <view class="pc-ava-edit">
            <view class="edit-ico"></view>
          </view>
        </view>
        <view class="pc-info">
          <view class="pc-name">
            <text class="pc-name-text">{{ userInfo?.nickname || '微信用户' }}</text>
            <text class="pc-tag" v-if="vipTag">{{ vipTag }}</text>
          </view>
          <text class="pc-meta">手机 {{ maskedPhone }}</text>
        </view>
      </view>

      <view class="pc-membership" v-if="vipExpiry">
        <text class="pcm-label">尊享会员</text>
        <text class="pcm-expiry">
          到期
          <text class="pcm-date">{{ vipExpiry }}</text>
        </text>
      </view>
    </view>
    <!-- #endregion -->

    <!-- #region 功能入口 -->
    <view class="menu-group">
      <view class="menu-item" @click="goTo('contact/index')">
        <view class="menu-ico ico-amber">
          <image class="menu-ico-img" src="/static/icons/联系我们.png" mode="aspectFit" />
        </view>
        <text class="menu-label">联系我们</text>
        <view class="menu-arrow"></view>
      </view>

      <button class="menu-item menu-item-btn" open-type="share">
        <view class="menu-ico ico-teal">
          <image class="menu-ico-img" src="/static/icons/分享.png" mode="aspectFit" />
        </view>
        <text class="menu-label">分享好友</text>
        <view class="menu-arrow"></view>
      </button>

      <view class="menu-item" @click="showDataStatement = true">
        <view class="menu-ico ico-blue">
          <image class="menu-ico-img" src="/static/icons/数据声明.png" mode="aspectFit" />
        </view>
        <text class="menu-label">数据声明</text>
        <view class="menu-arrow"></view>
      </view>
    </view>
    <!-- #endregion -->

    <!-- #region 我的客户 -->
    <view class="sec-head">
      <text class="sec-title">我的客户</text>
    </view>

    <view class="list-card">
      <view class="table-header">
        <text class="col-rank">序号</text>
        <text class="col-name">客户</text>
        <text class="col-source">来源</text>
      </view>

      <scroll-view
        scroll-y
        class="scroll-view"
        @scrolltolower="onScrollToLower"
        :show-scrollbar="false"
      >
        <view
          class="table-row"
          v-for="(item, index) in customers"
          :key="item.id"
          hover-class="row-hover"
          @click="onRowClick(item)"
        >
          <text class="col-rank">{{ index + 1 }}</text>
          <text class="col-name highlight">{{ item.name }}</text>
          <text class="col-source">{{ item.source }}</text>
        </view>

        <view class="loading-status" v-if="loading || noMore">
          <text>{{ loading ? '加载中...' : '没有更多了' }}</text>
        </view>
        <view class="empty-tip" v-if="!loading && customers.length === 0">
          <text>暂无客户</text>
        </view>
      </scroll-view>
    </view>
    <!-- #endregion -->
  </view>
  <!-- #endregion -->

  <!-- 数据声明弹窗 -->
  <data-statement-popup v-model:visible="showDataStatement" />

  <!-- 底部导航 -->
  <tab-bar active="mine" />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed, onMounted } from 'vue'
  import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
  import TabBar from '@/components/tab-bar/index.vue'
  import DataStatementPopup from '@/components/data-statement-popup/data-statement-popup.vue'
  import { getUserCollectList, getUserInfo } from '@/api'
  import { VIP_CODE } from '@/utils/enums'
  import type { UserInfo } from '@/types/api'
  // #endregion

  // #region 分享
  onShareAppMessage(() => {
    return {
      title: '临研商机宝 - 明熟客情 稳妥商机',
      path: '/pages/index/index',
      imageUrl: '/static/icons/header-bg.png'
    }
  })
  // #endregion

  // #region 页面基础状态
  const menu = ref({ top: 0, left: 0, height: 0 })
  const defaultAvatar = '../../static/icons/default-avatar-1.png'
  const userInfo = ref<UserInfo | null>(null)
  const showDataStatement = ref(false)

  // 会员标签：仅 VIP 用户 / 试用中展示
  const vipTag = computed(() => {
    if (userInfo.value?.vipCode === VIP_CODE.VIP用户) return '尊享会员'
    if (userInfo.value?.vipCode === VIP_CODE.VIP试用) return '试用中'
    return ''
  })

  // 会员到期时间：仅 VIP 用户展示
  const vipExpiry = computed(() => {
    if (userInfo.value?.vipCode !== VIP_CODE.VIP用户) return ''
    const time = userInfo.value?.vipExpirationTime || ''
    return time ? time.slice(0, 10) : ''
  })

  // 手机号脱敏：138****8888
  const maskedPhone = computed(() => {
    const phone = userInfo.value?.phone || ''
    if (!phone) return '--'
    return phone.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
  })

  onLoad(() => {
    menu.value = uni.getMenuButtonBoundingClientRect()
  })

  onMounted(() => {
    userInfo.value = getUserInfo()
    fetchCustomers(true)
  })
  // #endregion

  // #region 导航
  function goTo(path: string, query?: string) {
    const url = query ? `/pages/${path}?${query}` : `/pages/${path}`
    uni.navigateTo({ url })
  }

  // 完善资料（头像、昵称）
  function goProfileSetup() {
    uni.navigateTo({ url: '/pages/profile-setup/index' })
  }
  // #endregion

  // #region 我的客户（收藏数据）
  interface CustomerRow {
    id: number
    parentCompanyId: number
    name: string
    source: string
    createTime: string
  }

  // 收藏记录所属模块，接口返回 serverId 时用于展示客户来源
  const COLLECT_MODULE_LABELS: Record<string, string> = {
    searchCust: '查客户',
    findCust: '找客户',
    searchComCRO: '药企&CRO合作关系',
    searchComHos: '药企&医院合作关系',
    searchComLab: '药企&实验室合作关系',
    searchProduce: '查产品'
  }

  // 未返回 serverId 时，按收藏的公司类型兜底展示来源
  const COMPANY_TYPE_LABELS: Record<number, string> = {
    1: '药企',
    2: 'CRO',
    3: '实验室'
  }

  const customers = ref<CustomerRow[]>([])
  const loading = ref(false)
  const noMore = ref(false)
  const page = ref(1)
  const pageSize = 20

  async function fetchCustomers(reset = false) {
    if (loading.value) return
    if (!reset && noMore.value) return

    if (reset) {
      page.value = 1
      customers.value = []
      noMore.value = false
    }

    loading.value = true
    try {
      const res = await getUserCollectList({ pageNum: page.value, pageSize })
      const list = (res.data?.list || []).map((item: any) => ({
        id: item.id,
        parentCompanyId: item.parentCompanyId,
        name: item.parentCompanyShortName || '--',
        source:
          COLLECT_MODULE_LABELS[item.serverId] || COMPANY_TYPE_LABELS[item.companyType] || '--',
        createTime: item.createTime || ''
      }))

      customers.value = reset ? list : [...customers.value, ...list]
      if (page.value >= (res.data?.pages || 1)) {
        noMore.value = true
      }
      page.value++
    } catch {
      // 静默处理
    } finally {
      loading.value = false
    }
  }

  const onScrollToLower = () => {
    fetchCustomers()
  }

  // 跳转客户（企业）详情页
  const onRowClick = (item: CustomerRow) => {
    if (!item.parentCompanyId) return
    uni.navigateTo({
      url: `/pages/customer/company-detail?companyId=${item.parentCompanyId}&companyName=${encodeURIComponent(item.name)}`
    })
  }
  // #endregion
</script>

<style lang="scss" scoped>
  /* #region 页面容器 */
  .page {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    padding: 30rpx 30rpx 0;
  }
  /* #endregion */

  /* #region 用户信息 */
  .profile-card {
    flex-shrink: 0;
    background: linear-gradient(120deg, #0a2a5e 0%, #1350c2 100%);
    border-radius: 32rpx;
    color: #ffffff;
    overflow: hidden;
    box-shadow: 0 4rpx 16rpx rgba(15, 23, 42, 0.08);
  }

  .pc-top {
    display: flex;
    align-items: center;
    gap: 28rpx;
    padding: 36rpx 32rpx 32rpx;
  }

  .pc-ava-wrap {
    position: relative;
    flex-shrink: 0;
  }

  .pc-ava {
    width: 104rpx;
    height: 104rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.18);
    border: 4rpx solid rgba(255, 255, 255, 0.4);
  }

  .pc-ava-edit {
    position: absolute;
    right: -4rpx;
    bottom: -4rpx;
    width: 40rpx;
    height: 40rpx;
    border-radius: 50%;
    background: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.25);

    // 编辑铅笔图标（纯 CSS 绘制）
    .edit-ico {
      position: relative;
      width: 18rpx;
      height: 4rpx;
      background: #1e6fff;
      border-radius: 2rpx;
      transform: rotate(-45deg);

      &::after {
        content: '';
        position: absolute;
        right: -4rpx;
        top: -2rpx;
        width: 0;
        height: 0;
        border-top: 4rpx solid transparent;
        border-bottom: 4rpx solid transparent;
        border-left: 6rpx solid #1e6fff;
      }
    }
  }

  .pc-info {
    flex: 1;
    min-width: 0;
  }

  .pc-name {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  .pc-name-text {
    font-size: 34rpx;
    font-weight: 600;
    color: #ffffff;
  }

  .pc-tag {
    font-size: 22rpx;
    font-weight: 500;
    color: #ffffff;
    background: rgba(255, 255, 255, 0.2);
    padding: 4rpx 16rpx;
    border-radius: 24rpx;
  }

  .pc-meta {
    display: block;
    margin-top: 10rpx;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.75);
  }

  .pc-membership {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    padding: 22rpx 32rpx;
    background: rgba(255, 255, 255, 0.12);
  }

  .pcm-label {
    font-size: 24rpx;
    font-weight: 600;
    color: #ffffff;
  }

  .pcm-expiry {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.75);
  }

  .pcm-date {
    color: #ffd666;
  }
  /* #endregion */

  /* #region 功能入口 */
  .menu-group {
    flex-shrink: 0;
    margin-top: 24rpx;
    background: #ffffff;
    border-radius: 28rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);
  }

  .menu-item {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 28rpx 32rpx;
    border-bottom: 2rpx solid #f0f1f3;

    &:last-child {
      border-bottom: none;
    }

    &:active {
      background: #fafbfd;
    }
  }

  // 微信分享按钮：清除默认样式
  .menu-item-btn {
    width: 100%;
    background: transparent;
    border-radius: 0;
    border-bottom: 2rpx solid #f0f1f3;
    line-height: normal;
    text-align: left;
    font-weight: 400;

    &::after {
      display: none;
    }
  }

  .menu-ico {
    width: 64rpx;
    height: 64rpx;
    border-radius: 18rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.ico-amber {
      background: #fdf3e3;
    }

    &.ico-teal {
      background: #e6f7f1;
    }

    &.ico-blue {
      background: #ebf3ff;
    }
  }

  .menu-ico-img {
    width: 36rpx;
    height: 36rpx;
  }

  .menu-label {
    flex: 1;
    font-size: 28rpx;
    color: #1f2329;
  }

  .menu-arrow {
    width: 16rpx;
    height: 16rpx;
    border-top: 3rpx solid #c6cbd4;
    border-right: 3rpx solid #c6cbd4;
    transform: rotate(45deg);
    flex-shrink: 0;
  }
  /* #endregion */

  /* #region 我的客户 */
  .sec-head {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 32rpx 4rpx 16rpx;
  }

  .sec-title {
    display: flex;
    align-items: center;
    font-size: 32rpx;
    font-weight: 600;
    color: #1f2329;

    &::before {
      content: '';
      width: 8rpx;
      height: 32rpx;
      border-radius: 4rpx;
      background: #1e6fff;
      margin-right: 16rpx;
    }
  }

  .list-card {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 28rpx;
    padding: 20rpx;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);
    margin-bottom: 10rpx;
  }

  .table-header {
    flex-shrink: 0;
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
  }

  .scroll-view {
    flex: 1;
    height: 0;
    width: 100%;
  }

  .table-row {
    display: flex;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 2rpx solid #f8f8f8;
    font-size: 28rpx;
    color: #333333;

    &:last-child {
      border-bottom: none;
    }

    // 点击反馈
    &.row-hover {
      background-color: #f2f7fc;
    }

    text {
      text-align: center;
      word-break: break-all;
    }
  }

  .col-rank {
    width: 100rpx;
  }

  .col-name {
    flex: 2;
  }

  .col-source {
    flex: 2;
  }

  .highlight {
    color: #2b66ef;
  }

  .loading-status,
  .empty-tip {
    padding: 40rpx 0;
    text-align: center;

    text {
      font-size: 24rpx;
      color: #999999;
    }
  }
  /* #endregion */
</style>
