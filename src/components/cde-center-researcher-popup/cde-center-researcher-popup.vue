<template>
  <bottom-sheet :visible="visible" :z-index="10000" @close="close">
    <view class="popup-content">
      <view class="modal-head-row">
        <view class="modal-title-wrap">
          <text class="modal-title">中心及研究者</text>
          <text class="modal-sub">滑动查看更多</text>
        </view>
        <view class="modal-close" @click="close">
          <text>×</text>
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
  </bottom-sheet>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { queryCdeCenterAndResearcherList } from '@/api'
  import type { CenterAndResearcherItem, CdeCenterAndResearcherReq } from '@/types/api'

  const props = defineProps<{
    visible: boolean
    /** 登记号（CDE试验唯一标识） */
    acceptanceNo: string
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

    const params: CdeCenterAndResearcherReq = {
      acceptanceNo: props.acceptanceNo,
      pageNum: pageNum.value,
      pageSize: pageSize
    }

    try {
      const res = await queryCdeCenterAndResearcherList(params)
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
  .popup-content {
    width: 100%;
    min-height: 35vh;
    max-height: 84vh;
    padding: 56rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
    box-sizing: border-box;
    background-color: #fff;
    border-radius: 40rpx 40rpx 0 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  /* #region 头部 */
  .modal-head-row {
    display: flex;
    align-items: center;
    gap: 20rpx;
    padding-bottom: 20rpx;

    .modal-title-wrap {
      flex: 1;
      min-width: 0;
    }

    .modal-title {
      display: block;
      font-size: 32rpx;
      font-weight: 600;
      color: #1f2329;
    }

    .modal-sub {
      display: block;
      margin-top: 4rpx;
      font-size: 22rpx;
      color: #9ca3af;
    }

    .modal-close {
      width: 60rpx;
      height: 60rpx;
      flex-shrink: 0;
      border-radius: 50%;
      background: #f7f8fa;
      color: #6b7280;
      font-size: 40rpx;
      line-height: 1;
      display: flex;
      align-items: center;
      justify-content: center;

      &:active {
        background: #eceef1;
      }
    }
  }
  /* #endregion */

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
        font-weight: 400;
        font-size: 24rpx;
        color: #9199ae;
        line-height: 52rpx;
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
        font-weight: 400;
        font-size: 24rpx;
        color: #293959;
        line-height: 52rpx;
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
