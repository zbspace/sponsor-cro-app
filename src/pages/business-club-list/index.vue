<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">{{ companyName }}</text>
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
      <!-- 顶部注记 -->
      <view class="note-box">
        <text class="note-text">{{ noteText }}</text>
      </view>

      <!-- 列表内容 -->
      <view class="list-container">
        <view class="clue-card" v-for="(item, index) in list" :key="index">
          <!-- 药品基本信息 -->
          <view class="card-header">
            <view class="drug-info">
              <view class="drug-icon">
                <image src="../../static/icons/sponsor.png" mode="aspectFit" />
              </view>
              <text class="drug-name">{{ item.drugStandardName }}</text>
            </view>
            <text class="date">{{ item.undertakeDate || item.approvalTime }}</text>
          </view>

          <view class="tags">
            <text class="tag type-tag" v-if="item.cleanedDrugType">{{ item.cleanedDrugType }}</text>
            <text class="tag class-tag" v-if="item.cleanedClassificationOrStages">
              {{ item.cleanedClassificationOrStages }}
            </text>
            <text class="tag priority-tag" v-if="item.ndaPriorityApproval">
              {{ item.ndaPriorityApproval }}
            </text>
          </view>

          <view class="info-grid">
            <view class="info-row">
              <text class="label">申请人</text>
              <text class="value">{{ item.applicationCompany }}</text>
            </view>
            <view class="info-row">
              <text class="label">申请状态</text>
              <text
                class="value status"
                :class="{ success: isSuccessStatus(item.applicationStatus) }"
              >
                {{ item.applicationStatus }}
              </text>
            </view>
            <view class="info-row" v-if="item.approvalTime">
              <text class="label">批准日期</text>
              <text class="value">{{ item.approvalTime }}</text>
            </view>
            <view class="info-row">
              <text class="label">适应症</text>
              <text class="value">{{ item.indication }}</text>
            </view>
          </view>

          <!-- 商机线索部分 -->
          <view class="clue-section" :class="clueSectionClass">
            <view class="clue-header">
              <image src="../../static/icons/time.png" mode="aspectFit" class="clue-icon" />
              <text class="clue-title">商机线索</text>
            </view>
            <view class="clue-content">
              <text>{{ item.businessClueText }}</text>
            </view>
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
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import { getAfterListingBusinessClueList, getBeforeListingBusinessClueList } from '@/api'
  import type { OpportunityVo, OpportunityParam } from '@/types/api'
  // #endregion

  // #region 状态
  const menu = ref({ top: 0, left: 0, height: 0 })
  const companyName = ref('')
  const companyId = ref(0)
  const type = ref<'before' | 'after'>('before')

  const list = ref<OpportunityVo[]>([])
  const pageNum = ref(1)
  const pageSize = 10
  const loading = ref(false)
  const finished = ref(false)
  // #endregion

  // #region 计算属性
  const noteText = computed(() => {
    if (type.value === 'before') {
      return '注：IND一般60个工作日以内获批，申请及获批后，申请及获批1年内，申办方一般启动相关临床试验，所以此处只展示1年内IND申请及获批记录'
    }
    return '注：由于1、2类创新药上市获批后，3年内大概率会开展相关上市后临床研究，所以此处只展示3年内申请及获批1、2类创新药记录'
  })

  const clueSectionClass = computed(() => {
    return type.value === 'before' ? 'before-clue' : 'after-clue'
  })
  // #endregion

  // #region 生命周期
  onLoad((options: any) => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    if (options?.companyName) {
      companyName.value = decodeURIComponent(options.companyName)
    }
    if (options?.companyId) {
      companyId.value = Number(options.companyId)
    }
    if (options?.type) {
      type.value = options.type as any
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

      const res =
        type.value === 'after'
          ? await getAfterListingBusinessClueList(params)
          : await getBeforeListingBusinessClueList(params)

      if (res.data) {
        const newList = res.data.list || []
        list.value = [...list.value, ...newList]
        if (newList.length < pageSize || pageNum.value >= res.data.pages) {
          finished.value = true
        }
      }
    } catch (error) {
      console.error('获取列表失败:', error)
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

  function isSuccessStatus(status: string) {
    if (!status) return false
    return status.includes('通过') || status.includes('获批')
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .container {
    padding: 30rpx;
    padding-top: 0;
  }

  .note-box {
    padding: 24rpx;
    background: linear-gradient(180deg, rgba(255, 241, 241, 0.5) 0%, rgba(255, 255, 255, 0) 100%);
    border-radius: 16rpx;
    margin-bottom: 30rpx;

    .note-text {
      font-size: 24rpx;
      color: #ff4d4f;
      line-height: 1.6;
    }
  }

  .clue-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24rpx;

      .drug-info {
        display: flex;
        align-items: center;
        gap: 16rpx;
        flex: 1;

        .drug-icon {
          width: 48rpx;
          height: 48rpx;
          background: #499ae6;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          image {
            width: 28rpx;
            height: 28rpx;
            filter: brightness(0) invert(1);
          }
        }

        .drug-name {
          font-size: 32rpx;
          font-weight: bold;
          color: #333;
        }
      }

      .date {
        font-size: 24rpx;
        color: #999;
        flex-shrink: 0;
      }
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      margin-bottom: 30rpx;

      .tag {
        font-size: 22rpx;
        padding: 4rpx 16rpx;
        border-radius: 8rpx;
      }

      .type-tag {
        background: #f0f5ff;
        color: #2f54eb;
      }

      .class-tag {
        background: #e6f7ff;
        color: #1890ff;
      }

      .priority-tag {
        background: #fff7e6;
        color: #fa8c16;
      }
    }

    .info-grid {
      background: #f7f8fa;
      border-radius: 16rpx;
      padding: 24rpx;
      display: flex;
      flex-direction: column;
      gap: 20rpx;
      margin-bottom: 30rpx;

      .info-row {
        display: flex;
        font-size: 26rpx;

        .label {
          width: 140rpx;
          color: #999;
          flex-shrink: 0;
        }

        .value {
          flex: 1;
          color: #333;

          &.status {
            color: #fa8c16;
          }
          &.success {
            color: #52c41a;
          }
        }
      }
    }

    .clue-section {
      border-radius: 16rpx;
      padding: 24rpx;
      position: relative;
      overflow: hidden;

      &.before-clue {
        background: #fff7e6;
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 8rpx;
          background: #fa8c16;
        }
      }

      &.after-clue {
        background: #e6f7ff;
        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 8rpx;
          background: #1890ff;
        }
      }

      .clue-header {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-bottom: 12rpx;

        .clue-icon {
          width: 28rpx;
          height: 28rpx;
        }

        .clue-title {
          font-size: 26rpx;
          font-weight: bold;
          color: #fa8c16;
        }
      }

      &.after-clue .clue-title {
        color: #1890ff;
      }

      .clue-content {
        font-size: 26rpx;
        color: #fa8c16;
        line-height: 1.5;
      }

      &.after-clue .clue-content {
        color: #1890ff;
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
