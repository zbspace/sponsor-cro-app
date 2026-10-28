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
            <text class="pc-tag" v-else-if="!vipTag">普通用户</text>
          </view>
          <text class="pc-meta">手机 {{ maskedPhone }}</text>
        </view>
      </view>

      <view class="pc-membership">
        <!-- 尊享会员：皇冠 + 到期时间 -->
        <template v-if="vipExpiry">
          <view class="pcm-label">
            <view class="pcm-crown"></view>
            <text>尊享会员</text>
          </view>
          <text class="pcm-expiry">
            到期
            <text class="pcm-date">{{ vipExpiry }}</text>
          </text>
        </template>
        <!-- 已提交试用申请：等待审核 -->
        <template v-else-if="isApplying">
          <view class="pcm-label">
            <view class="pcm-clock"></view>
            <text>试用申请已提交</text>
          </view>
          <text class="pcm-expiry">请耐心等待</text>
        </template>
        <!-- 普通用户：引导申请试用 -->
        <template v-else>
          <text class="pcm-label">可先申请试用，体验全部功能</text>
          <view class="pcm-btn" @click="handleApplyTrial"><text>申请试用</text></view>
        </template>
      </view>
    </view>
    <!-- #endregion -->

    <!-- #region 功能入口 -->
    <view class="menu-group">
      <view class="menu-item" @click="goTo('contact/index')">
        <view class="menu-ico ico-amber"></view>
        <text class="menu-label">联系我们</text>
        <view class="menu-arrow"></view>
      </view>

      <button class="menu-item menu-item-btn" open-type="share">
        <view class="menu-ico ico-teal"></view>
        <text class="menu-label">分享好友</text>
        <view class="menu-arrow"></view>
      </button>

      <button class="menu-item menu-item-btn" open-type="share">
        <view class="menu-ico ico-gray"></view>
        <text class="menu-label">账号与登录</text>
        <view class="menu-arrow"></view>
      </button>
    </view>
    <!-- #endregion -->

    <!-- #region 我的客户 -->
    <view class="sec-head">
      <text class="sec-title">我的客户</text>
    </view>

    <!-- 空数据：暂无收藏客户 -->
    <view class="cust-empty" v-if="!loading && customers.length === 0">
      <view class="ce-ico"></view>
      <text class="ce-title">暂无我的客户</text>
      <text class="ce-desc">收藏的企业、CRO 将显示在这里</text>
    </view>

    <view class="list-card" v-else>
      <scroll-view
        scroll-y
        class="scroll-view"
        @scrolltolower="onScrollToLower"
        :show-scrollbar="false"
      >
        <view
          class="cust-item"
          v-for="item in customers"
          :key="item.id"
          hover-class="row-hover"
          @click="onRowClick(item)"
        >
          <view class="cust-info">
            <text class="cust-name">{{ item.name }}</text>
            <text class="cust-src">{{ item.source }}</text>
          </view>
          <view class="cust-arrow"></view>
        </view>

        <view class="loading-status" v-if="loading || noMore">
          <text>{{ loading ? '加载中...' : '没有更多了' }}</text>
        </view>
      </scroll-view>
    </view>
    <!-- #endregion -->
  </view>
  <!-- #endregion -->

  <!-- 申请试用弹窗 -->
  <trial-apply-popup v-model:visible="showTrialPopup" @success="fetchUserDetail" />

  <!-- 底部导航 -->
  <tab-bar active="mine" />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed, onMounted } from 'vue'
  import { onLoad, onShareAppMessage } from '@dcloudio/uni-app'
  import TabBar from '@/components/tab-bar/index.vue'
  import TrialApplyPopup from '@/components/trial-apply-popup/trial-apply-popup.vue'
  import { getUserCollectList, getUserInfo, refreshUserDetail } from '@/api'
  import { VIP_CODE, APPLY_STATUS } from '@/utils/enums'
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
  // 申请试用弹窗
  const showTrialPopup = ref(false)

  // 会员申请状态：0-未申请，1-申请试用中，2-试用中，3-申请开通中，4-开通中
  const applyStatus = ref(0)

  // 试用申请已提交，等待审核
  const isApplying = computed(() => applyStatus.value === APPLY_STATUS.申请试用中)

  // 会员标签：仅 VIP 用户 / 试用中展示
  const vipTag = computed(() => {
    if (userInfo.value?.vipCode === VIP_CODE.VIP用户) return '尊享会员'
    if (userInfo.value?.vipCode === VIP_CODE.VIP试用) return '试用中'
    if (isApplying.value) return '申请试用中'
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
    fetchUserDetail()
  })
  // #endregion

  // #region 会员状态
  // 同步用户详情：刷新本地用户信息与会员申请状态（进入页面、申请试用成功后各调一次）
  async function fetchUserDetail() {
    const detail = await refreshUserDetail()
    if (!detail) return
    userInfo.value = detail
    applyStatus.value = detail.applyStatus || 0
  }

  // 申请试用：已提交过则提示，否则打开申请弹窗
  function handleApplyTrial() {
    if (isApplying.value) {
      uni.showToast({ title: '您已提交试用申请，请耐心等待', icon: 'none' })
      return
    }
    showTrialPopup.value = true
  }
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

    // 编辑铅笔图标（内联 SVG）
    .edit-ico {
      width: 22rpx;
      height: 22rpx;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTQgMjBoNEwxOC41IDkuNWEyLjEgMi4xIDAgMCAwLTMtM0w1IDE3djN6IiBzdHJva2U9IiMxRTZGRkYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTEzLjUgNi41bDMgMyIgc3Ryb2tlPSIjMUU2RkZGIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4=');
      background-size: 100% 100%;
      background-repeat: no-repeat;
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
    display: flex;
    align-items: center;
    gap: 14rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: #ffffff;
  }

  // 尊享会员皇冠图标（内联 SVG）
  .pcm-crown {
    width: 28rpx;
    height: 28rpx;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTMgOGw0IDMgNS02IDUgNiA0LTMtMiAxMUg1TDMgOHoiIHN0cm9rZT0iI0ZGRDY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PC9zdmc+');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    flex-shrink: 0;
  }

  // 申请试用中时钟图标（内联 SVG）
  .pcm-clock {
    width: 28rpx;
    height: 28rpx;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOC41IiBzdHJva2U9IiNGRkQ2NjYiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0xMiA3LjZWMTJsMy4yIDIiIHN0cm9rZT0iI0ZGRDY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=');
    background-size: 100% 100%;
    background-repeat: no-repeat;
    flex-shrink: 0;
  }

  .pcm-expiry {
    font-size: 22rpx;
    color: rgba(255, 255, 255, 0.75);
  }

  .pcm-date {
    color: #ffd666;
  }

  // 普通用户：申请试用按钮
  .pcm-btn {
    flex-shrink: 0;
    background: #ffd666;
    color: #7a4d00;
    font-size: 24rpx;
    font-weight: 700;
    padding: 14rpx 28rpx;
    border-radius: 32rpx;
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
    padding: 30rpx 32rpx;
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
    // 入口图标统一 36rpx 居中（内联 SVG）
    background-position: center;
    background-repeat: no-repeat;
    background-size: 36rpx 36rpx;

    &.ico-amber {
      background-color: #fdf3e3;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTIyIDE2LjkydjNhMiAyIDAgMCAxLTIuMTggMiAxOS43OSAxOS43OSAwIDAgMS04LjYzLTMuMDcgMTkuNSAxOS41IDAgMCAxLTYtNiAxOS43OSAxOS43OSAwIDAgMS0zLjA3LTguNjdBMiAyIDAgMCAxIDQuMTEgMmgzYTIgMiAwIDAgMSAyIDEuNzIgMTIuODQgMTIuODQgMCAwIDAgLjcgMi44MSAyIDIgMCAwIDEtLjQ1IDIuMTFMOC4wOSA5LjkxYTE2IDE2IDAgMCAwIDYgNmwxLjI3LTEuMjdhMiAyIDAgMCAxIDIuMTEtLjQ1IDEyLjg0IDEyLjg0IDAgMCAwIDIuODEuN0EyIDIgMCAwIDEgMjIgMTYuOTJ6IiBzdHJva2U9IiNGNTlFMEIiIHN0cm9rZS13aWR0aD0iMS45IiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=');
    }

    &.ico-teal {
      background-color: #e6f7f1;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTgiIGN5PSI1IiByPSIzIiBzdHJva2U9IiMxMEI5ODEiIHN0cm9rZS13aWR0aD0iMS45Ii8+PGNpcmNsZSBjeD0iNiIgY3k9IjEyIiByPSIzIiBzdHJva2U9IiMxMEI5ODEiIHN0cm9rZS13aWR0aD0iMS45Ii8+PGNpcmNsZSBjeD0iMTgiIGN5PSIxOSIgcj0iMyIgc3Ryb2tlPSIjMTBCOTgxIiBzdHJva2Utd2lkdGg9IjEuOSIvPjxwYXRoIGQ9Ik04LjYgMTMuNGw2LjggMy45TTE1LjQgNi42bC02LjggMy45IiBzdHJva2U9IiMxMEI5ODEiIHN0cm9rZS13aWR0aD0iMS45Ii8+PC9zdmc+');
    }

    &.ico-gray {
      background-color: #f2f5f9;
      background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI0IiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMS45Ii8+PHBhdGggZD0iTTQgMjFjMC00IDMuNi02IDgtNnM4IDIgOCA2IiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMS45IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=');
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
    overflow: hidden;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);
    margin-bottom: 10rpx;
  }

  .scroll-view {
    flex: 1;
    height: 0;
    width: 100%;
  }

  .cust-item {
    display: flex;
    align-items: center;
    padding: 26rpx 32rpx;
    border-bottom: 2rpx solid #f0f1f3;

    &:last-child {
      border-bottom: none;
    }

    // 点击反馈
    &.row-hover {
      background-color: #fafbfd;
    }
  }

  .cust-info {
    flex: 1;
    min-width: 0;
  }

  .cust-name {
    display: block;
    font-size: 30rpx;
    font-weight: 500;
    color: #1f2329;
  }

  .cust-src {
    display: block;
    margin-top: 6rpx;
    font-size: 24rpx;
    color: #9ca3af;
  }

  .cust-arrow {
    flex-shrink: 0;
    width: 16rpx;
    height: 16rpx;
    border-top: 3rpx solid #c6cbd4;
    border-right: 3rpx solid #c6cbd4;
    transform: rotate(45deg);
  }

  // 空态：暂无我的客户
  .cust-empty {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    padding: 68rpx 32rpx 60rpx;
    background: #ffffff;
    border-radius: 28rpx;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);
  }

  // 空态圆形图标（文件夹，内联 SVG）
  .ce-ico {
    width: 132rpx;
    height: 132rpx;
    margin-bottom: 8rpx;
    border-radius: 50%;
    background-color: #f7f8fa;
    background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSI+PHBhdGggZD0iTTMgN2EyIDIgMCAwIDEgMi0yaDRsMiAyaDhhMiAyIDAgMCAxIDIgMnY4YTIgMiAwIDAgMS0yIDJINWEyIDIgMCAwIDEtMi0yVjd6IiBzdHJva2U9IiNDNkNCRDQiIHN0cm9rZS13aWR0aD0iMS43IiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+PHBhdGggZD0iTTMgMTBoMTgiIHN0cm9rZT0iI0M2Q0JENCIgc3Ryb2tlLXdpZHRoPSIxLjciLz48L3N2Zz4=');
    background-position: center;
    background-repeat: no-repeat;
    background-size: 60rpx 60rpx;
  }

  .ce-title {
    font-size: 28rpx;
    font-weight: 500;
    color: #6b7280;
  }

  .ce-desc {
    font-size: 24rpx;
    color: #9ca3af;
  }

  .loading-status {
    padding: 40rpx 0;
    text-align: center;

    text {
      font-size: 24rpx;
      color: #999999;
    }
  }
  /* #endregion */
</style>
