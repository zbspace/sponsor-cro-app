<template>
  <view class="popup-mask" v-if="visible" @click="close">
    <view class="popup-content" @click.stop>
      <view class="popup-header">
        <text class="popup-title">中心及研究者</text>
        <view class="close-btn" @click="close">
          <text class="close-icon">×</text>
        </view>
      </view>

      <view class="table-container">
        <view class="table-header">
          <text class="col-index">序号</text>
          <text class="col-center">中心</text>
          <text class="col-researcher">研究者</text>
        </view>

        <scroll-view
          scroll-y
          class="table-body-scroll"
          @scrolltolower="loadMore"
          :lower-threshold="50"
        >
          <view
            class="table-row"
            v-for="(item, index) in list"
            :key="index"
            :class="{ zebra: index % 2 === 1 }"
          >
            <text class="col-index">{{ index + 1 }}</text>
            <text class="col-center">{{ item.hosStandardName }}</text>
            <text class="col-researcher">{{ item.researcherName }}</text>
          </view>

          <view class="loading-status" v-if="list.length > 0">
            <text>{{ hasMore ? '正在加载...' : '没有更多了' }}</text>
          </view>
          <view class="empty-status" v-if="list.length === 0 && !loading">
            <text>暂无中心及研究者信息</text>
          </view>
        </scroll-view>
      </view>

      <!-- 虽然用户要求滑动加载，但为了还原设计稿的视觉效果，保留按钮区域，但功能改为翻页或隐藏 -->
      <!-- 这里根据用户要求“滑动加载”，我们隐藏按钮或仅作为装饰 -->
      <!-- <view class="popup-footer">
        <view class="btn prev" :class="{ disabled: pageNum === 1 }" @click="prevPage">上一页</view>
        <view class="btn next" :class="{ disabled: !hasMore }" @click="nextPage">下一页</view>
      </view> -->
    </view>
  </view>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { queryCenterAndResearcherList } from '@/api'
  import type { CenterAndResearcherItem, HospitalStatisticsQuery } from '@/types/api'

  const props = defineProps<{
    visible: boolean
    acceptanceNo: string
    companyParentId?: number
    year?: string
    trialStage?: string
    trialStatus?: string
  }>()

  const emit = defineEmits(['update:visible'])

  const list = ref<CenterAndResearcherItem[]>([])
  const pageNum = ref(1)
  const pageSize = 20
  const total = ref(0)
  const loading = ref(false)
  const hasMore = computed(() => list.value.length < total.value)

  async function fetchList(refresh = false) {
    if (loading.value) return
    if (refresh) {
      pageNum.value = 1
      list.value = []
    }
    loading.value = true

    const params: HospitalStatisticsQuery = {
      acceptanceNo: props.acceptanceNo,
      companyParentId: props.companyParentId,
      year: props.year,
      trialStage: props.trialStage,
      trialStatus: props.trialStatus,
      pageNum: pageNum.value,
      pageSize: pageSize
    }

    try {
      const res = await queryCenterAndResearcherList(params)
      if (res.data) {
        list.value = refresh ? res.data.list || [] : [...list.value, ...(res.data.list || [])]
        total.value = res.data.total || 0
      }
    } catch (e) {
      console.error('获取中心及研究者列表失败', e)
    } finally {
      loading.value = false
    }
  }

  function loadMore() {
    if (hasMore.value && !loading.value) {
      pageNum.value++
      fetchList()
    }
  }

  function close() {
    emit('update:visible', false)
  }

  watch(
    () => props.visible,
    (val) => {
      if (val) {
        fetchList(true)
      }
    }
  )
</script>

<style lang="scss" scoped>
  .popup-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    padding: 40rpx;
  }

  .popup-content {
    width: 600rpx;
    background-color: #fff;
    border-radius: 32rpx;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  .popup-header {
    padding: 40rpx 40rpx 20rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .popup-title {
      font-size: 34rpx;
      font-weight: bold;
      color: #333;
    }

    .close-btn {
      width: 50rpx;
      height: 50rpx;
      border-radius: 50%;
      background: #f5f5f5;
      display: flex;
      justify-content: center;
      align-items: center;

      .close-icon {
        font-size: 40rpx;
        color: #999;
        line-height: 1;
        margin-top: -4rpx;
      }
    }
  }

  .table-container {
    padding: 20rpx 40rpx 40rpx;
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 600rpx;
    max-height: 800rpx;

    .table-header {
      display: flex;
      background: #f8f9fb;
      padding: 20rpx 0;
      border-radius: 8rpx;
      margin-bottom: 10rpx;

      text {
        font-size: 26rpx;
        color: #999;
        text-align: center;
      }
    }

    .table-body-scroll {
      flex: 1;
      height: 600rpx;
      min-height: 0;
    }

    .table-row {
      display: flex;
      padding: 24rpx 0;
      border-bottom: 1rpx solid #f8f9fb;

      &.zebra {
        background: #fafbfc;
      }

      text {
        font-size: 28rpx;
        color: #333;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .col-index {
      width: 100rpx;
    }
    .col-center {
      flex: 2;
      padding: 0 10rpx;
    }
    .col-researcher {
      flex: 1;
    }
  }

  .loading-status,
  .empty-status {
    padding: 30rpx 0;
    text-align: center;
    font-size: 24rpx;
    color: #999;
  }

  .popup-footer {
    padding: 0 40rpx 40rpx;
    display: flex;
    justify-content: center;
    gap: 30rpx;

    .btn {
      width: 200rpx;
      height: 70rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12rpx;
      font-size: 28rpx;

      &.prev {
        background: #499ae6;
        color: #fff;
      }

      &.next {
        background: #f5f5f5;
        color: #999;
      }

      &.disabled {
        opacity: 0.5;
      }
    }
  }
</style>
