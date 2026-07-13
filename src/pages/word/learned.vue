<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-left">
      <view class="back-icon" @click="goBack">
        <view class="arrow"></view>
      </view>
    </view>

    <text class="title">{{ ['已背诵单词', '待复习单词', '收藏单词'][currentTab] }}</text>
  </view>

  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <view class="container">
    <!-- 标签页 -->
    <view class="tabs">
      <view class="tab" :class="{ active: currentTab === 0 }" @click="currentTab = 0">
        已背诵单词
      </view>
      <view class="tab" :class="{ active: currentTab === 2 }" @click="currentTab = 2">待复习</view>
      <view class="tab" :class="{ active: currentTab === 1 }" @click="currentTab = 1">收藏</view>
    </view>

    <!-- 单词列表 -->
    <view
      class="list-container"
      :style="{
        height: `calc(100vh - ${menu.top}px - ${menu.height}px - 150px)`
      }"
    >
      <view class="list-header">
        <text class="col-index">序号</text>
        <text class="col-word">单词</text>
        <text class="col-status">状态</text>
      </view>

      <scroll-view
        scroll-y
        class="scroll-view"
        @scrolltolower="onScrollToLower"
        :show-scrollbar="false"
        :style="{
          height: `calc(100vh - ${menu.top}px - ${menu.height}px - 350px)`
        }"
      >
        <view
          class="list-item"
          v-for="(item, index) in wordList"
          :key="item.id"
          @click="goToDetail(item.id)"
        >
          <text class="col-index">{{ index + 1 }}</text>
          <text class="col-word">{{ item.word }}</text>
          <view class="col-status">
            <image
              class="status-icon"
              :src="!item.reviewResult ? '' : '../../static/icons/待复习单词.png'"
              mode="aspectFit"
            />
            <!-- @click.stop="handleToggleCollect(item)" -->
            <image
              class="status-icon"
              :src="item.collectResult ? '../../static/icons/收藏.png' : ''"
              mode="aspectFit"
            />
          </view>
        </view>
        <view class="loading-status" v-if="loading || !hasMore">
          <text>{{ loading ? '加载中...' : '没有更多了' }}</text>
        </view>
        <view class="empty-tip" v-if="wordList.length === 0 && !loading">
          {{ currentTab === 1 ? '暂无收藏单词' : '暂无数据' }}
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, watch } from 'vue'
  import {
    getCollectList,
    cancelCollect,
    ensureLogin,
    getReciteWordList,
    getReviewWordList
  } from '@/api'
  import type { CollectWordItem } from '@/types/api'
  import { onLoad } from '@dcloudio/uni-app'
  // #endregion

  // #region 状态
  const currentTab = ref(0)
  const wordList = ref<CollectWordItem[]>([])
  const pageNum = ref(1)
  const pageSize = 20
  const totalPage = ref(0)
  const loading = ref(false)
  const hasMore = ref(true)
  // #endregion

  // #region 方法
  const fetchWordList = async (reset = false) => {
    if (loading.value || (!hasMore.value && !reset)) return

    if (reset) {
      pageNum.value = 1
      wordList.value = []
      hasMore.value = true
    }

    loading.value = true
    try {
      let res
      if (currentTab.value === 0) {
        res = await getReciteWordList(pageNum.value, pageSize)
      } else if (currentTab.value === 1) {
        res = await getCollectList(pageNum.value, pageSize)
      } else {
        res = await getReviewWordList(pageNum.value, pageSize)
      }

      if (res.code === 200) {
        wordList.value = [...wordList.value, ...res.data.list]
        totalPage.value = res.data.total
        if (pageNum.value >= totalPage.value) {
          hasMore.value = false
        } else {
          pageNum.value++
        }
      }
    } catch (error) {
      console.error('获取单词列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const handleToggleCollect = async (item: CollectWordItem) => {
    if (item.collectResult) {
      uni.showModal({
        title: '提示',
        content: `确定要取消收藏单词 "${item.word}" 吗？`,
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await cancelCollect(item.id)
              if (result.code === 200) {
                uni.showToast({
                  title: '已取消收藏',
                  icon: 'success'
                })
                if (currentTab.value === 1) {
                  // 收藏列表直接移除
                  wordList.value = wordList.value.filter((i) => i.id !== item.id)
                } else {
                  // 其他列表更新状态
                  item.collectResult = false
                }
              }
            } catch (error) {
              console.error('取消收藏失败:', error)
            }
          }
        }
      })
    } else {
      // 如果有收藏接口可以在这里调用，目前先处理取消逻辑
    }
  }

  const onScrollToLower = () => {
    fetchWordList()
  }

  const goToDetail = (id: number) => {
    uni.setStorageSync('allWordsNum', totalPage.value)
    if (currentTab.value === 2) {
      // 待复习
      uni.navigateTo({
        url: `/pages/review/question?wordId=${id}&wordType=review`
      })
    } else if (currentTab.value === 1) {
      // 收藏
      uni.navigateTo({
        url: `/pages/word/detail?wordId=${id}&wordType=collected`
      })
    } else if (currentTab.value === 0) {
      // 已背诵单词
      uni.navigateTo({
        url: `/pages/word/detail?wordId=${id}&wordType=recited`
      })
    }
  }

  const goBack = () => {
    uni.reLaunch({
      url: '/pages/index/index'
    })
  }

  watch(currentTab, async (newTab) => {
    await ensureLogin()
    fetchWordList(true)
  })

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  onLoad(async (options: any) => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    if (options.tab) {
      currentTab.value = Number(options.tab)
    }
    await ensureLogin()
    fetchWordList(true)
  })
  // #endregion
</script>

<style scoped lang="scss">
  /* #region 标签页 */
  .tabs {
    flex-shrink: 0;
    display: flex;
    background-color: #f0f2f5;
    border-radius: 16rpx;
    padding: 8rpx;
    margin-bottom: 40rpx;
  }
  .tab {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    font-size: 28rpx;
    color: #666;
    border-radius: 12rpx;
  }
  .tab.active {
    background-color: #499ae6;
    color: white;
  }
  /* #endregion */

  /* #region 单词列表 */
  .list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background-color: white;
    border-radius: 24rpx;
    padding: 30rpx;
    height: 100%;
  }
  .list-header {
    flex-shrink: 0;
    display: flex;
    padding: 20rpx 0;
    border-bottom: 2rpx solid #f0f0f0;
    font-size: 28rpx;
    color: #999;
  }
  .list-item {
    display: flex;
    padding: 30rpx 0;
    border-bottom: 2rpx solid #f0f0f0;
    font-size: 28rpx;
    color: #333;
    align-items: center;
  }
  .col-index {
    flex: 1;
    text-align: center;
  }
  .col-word {
    flex: 3;
    text-align: center;
  }
  .col-status {
    flex: 2;
    display: flex;
    justify-content: center;
    gap: 24rpx;
    align-items: center;

    .status-icon {
      width: 40rpx;
      height: 40rpx;
    }
  }
  .scroll-view {
    flex: 1;
    min-height: 0;
  }
  .loading-status {
    text-align: center;
    padding: 30rpx 0;
    font-size: 24rpx;
    color: #999;
  }
  .empty-tip {
    text-align: center;
    padding: 80rpx 0;
    color: #999;
    font-size: 28rpx;
  }
  .placeholder {
    text-align: center;
    padding: 80rpx 0;
    color: #ccc;
    font-size: 28rpx;
  }
  /* #endregion */
</style>
