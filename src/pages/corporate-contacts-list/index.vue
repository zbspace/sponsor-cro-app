<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">企业联系人</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <scroll-view
    scroll-y
    class="container-scroll-view"
    :show-scrollbar="false"
    lower-threshold="100"
    @scrolltolower="loadMore"
    :style="{
      height: `calc(100vh - ${menu.top}px - ${menu.height}px)`
    }"
  >
    <view class="container">
      <view class="contact-list">
        <view class="contact-card" v-for="(item, index) in list" :key="index">
          <view class="card-top">
            <view class="avatar">{{ getFirstChar(item.sponsorContacts) }}</view>
            <text class="name">{{ item.sponsorContacts }}</text>
          </view>

          <view class="info-box">
            <view class="info-row">
              <text class="label">CDE登记试验数</text>
              <text class="value">{{ item.acceptanceNoNum }}</text>
            </view>
            <view class="info-row">
              <text class="label">最早一次登记时间</text>
              <text class="value">{{ formatDate(item.earliestRegistrationTime) }}</text>
            </view>
            <view class="info-row">
              <text class="label">最近一次登记时间</text>
              <text class="value">{{ formatDate(item.latestRegistrationTime) }}</text>
            </view>
            <view class="note">注：电话邮箱需要进入 CDE网站搜索可查看</view>
          </view>
        </view>

        <!-- 加载状态 -->
        <view class="load-more">
          <text v-if="loading">加载中...</text>
          <text v-else-if="finished && list.length > 0">没有更多了</text>
          <text v-else-if="list.length === 0">暂无数据</text>
        </view>
      </view>
    </view>
  </scroll-view>

  <phone-bind-popup />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import { getBusinessContactList } from '@/api'
  import type { OpportunityContactVo, OpportunityParam } from '@/types/api'
  // #endregion

  // #region 状态
  const menu = ref({ top: 0, left: 0, height: 0 })
  const companyId = ref(0)
  const list = ref<OpportunityContactVo[]>([])
  const pageNum = ref(1)
  const pageSize = 10
  const loading = ref(false)
  const finished = ref(false)
  // #endregion

  // #region 生命周期
  onLoad((options: any) => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    if (options?.companyId) {
      companyId.value = Number(options.companyId)
    }

    fetchList()
  })
  // #endregion

  // #region 方法
  async function fetchList() {
    if (loading.value || finished.value) return
    loading.value = true

    try {
      const params: OpportunityParam = {
        pageNum: pageNum.value,
        pageSize: pageSize,
        parentCompanyId: companyId.value
      }

      const res = await getBusinessContactList(params)

      if (res.data) {
        const newList = res.data.list || []
        list.value = [...list.value, ...newList]
        if (newList.length < pageSize || pageNum.value >= res.data.pages) {
          finished.value = true
        }
      }
    } catch (error) {
      console.error('获取联系人列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  function loadMore() {
    if (!finished.value && !loading.value) {
      pageNum.value++
      fetchList()
    }
  }

  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  function getFirstChar(name: string) {
    return name ? name.charAt(0) : ''
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    // 假设后端返回的是 YYYY-MM-DD 或类似格式，直接返回或简单处理
    return dateStr
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .container {
    padding: 30rpx;
    padding-top: 0;
  }

  .contact-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

    .card-top {
      display: flex;
      align-items: center;
      gap: 20rpx;
      margin-bottom: 30rpx;

      .avatar {
        width: 80rpx;
        height: 80rpx;
        background: #499ae6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 32rpx;
        font-weight: bold;
      }

      .name {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }

    .info-box {
      background: #f7f8fa;
      border-radius: 16rpx;
      padding: 24rpx;
      display: flex;
      flex-direction: column;
      gap: 20rpx;

      .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 26rpx;

        .label {
          color: #999;
        }

        .value {
          color: #333;
        }
      }

      .note {
        font-size: 24rpx;
        color: #499ae6;
        margin-top: 10rpx;
      }
    }
  }

  .load-more {
    padding: 30rpx 0;
    text-align: center;
    font-size: 24rpx;
    color: #999;
  }
</style>
