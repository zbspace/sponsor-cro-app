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

  <view class="page">
    <!-- #region 用户信息 -->
    <view class="user-card">
      <image class="avatar" :src="userInfo?.avatarUrl || defaultAvatar" mode="aspectFill" />
      <view class="user-detail">
        <text class="nickname">{{ userInfo?.nickname || '微信用户' }}</text>
        <text class="phone">{{ maskedPhone }}</text>
      </view>
    </view>
    <!-- #endregion -->

    <!-- #region 我的客户 -->
    <view class="section-title">
      <text>我的客户：</text>
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
        :style="{
          height: `calc(100vh - ${menu.top}px - ${menu.height}px - 320px)`
        }"
      >
        <view class="table-row" v-for="(item, index) in customers" :key="item.id">
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

    <!-- 底部导航 -->
    <tab-bar active="mine" />
  </view>
  <!-- #endregion -->
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed, onMounted } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import TabBar from '@/components/tab-bar/index.vue'
  import { getUserCollectList, getUserInfo } from '@/api'
  import type { UserInfo } from '@/types/api'
  // #endregion

  // #region 页面基础状态
  const menu = ref({ top: 0, left: 0, height: 0 })
  const defaultAvatar = '../../static/icons/default-avatar-1.png'
  const userInfo = ref<UserInfo | null>(null)

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

  // #region 我的客户（收藏数据）
  interface CustomerRow {
    id: number
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
  // #endregion
</script>

<style lang="scss" scoped>
  /* #region 页面容器 */
  .page {
    position: relative;
    z-index: 1;
    padding-left: 30rpx;
    padding-right: 30rpx;
    margin-top: 30rpx;
  }
  /* #endregion */

  /* #region 用户信息 */
  .user-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 40rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  }

  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 60rpx;
    margin-right: 30rpx;
    background: #f0f2f5;
    flex-shrink: 0;
  }

  .user-detail {
    display: flex;
    flex-direction: column;
  }

  .nickname {
    font-size: 36rpx;
    font-weight: bold;
    color: #333333;
    margin-bottom: 12rpx;
  }

  .phone {
    font-size: 28rpx;
    color: #666666;
  }
  /* #endregion */

  /* #region 我的客户 */
  .section-title {
    display: flex;
    align-items: center;
    margin: 40rpx 0 24rpx;

    &::before {
      content: '';
      width: 8rpx;
      height: 32rpx;
      border-radius: 4rpx;
      background: #2b66ef;
      margin-right: 16rpx;
    }

    text {
      font-size: 32rpx;
      font-weight: bold;
      color: #293959;
    }
  }

  .list-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 20rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  }

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
  }

  .scroll-view {
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
