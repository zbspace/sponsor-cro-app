<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-left">
      <view class="back-icon" @click="goBack">
        <view class="arrow"></view>
      </view>
      <text class="progress-text">{{ currentProgress }}</text>
    </view>
  </view>
  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <scroll-view
    scroll-y
    class="container-scroll-view"
    :show-scrollbar="false"
    enhanced
    :style="{
      height: `calc(100vh - ${menu.top}px - ${menu.height}px - 50px)`
    }"
  >
    <view class="container" v-if="wordDetail">
      <!-- 单词头部 -->
      <view class="word-header">
        <text class="word">{{ wordDetail.word }}</text>
        <text class="phonetic">{{ wordDetail.phoneticSymbol }}</text>
      </view>

      <!-- 单词详情 -->
      <view class="details-card">
        <view class="tags">
          <template v-for="(tag, index) in levels" :key="index">
            <text>{{ tag }}</text>
            <text v-if="index < levels.length - 1" class="divider">|</text>
          </template>
        </view>

        <view class="definition">
          <text class="def-text">{{ wordDetail.definition }}</text>
        </view>
      </view>

      <!-- 例句 -->
      <view class="example-card">
        <text class="section-title">行业例句：</text>
        <text class="en-sentence">{{ sentences.en }}</text>
        <text class="zh-sentence">{{ sentences.zh }}</text>
      </view>
    </view>
  </scroll-view>

  <!-- 底部 -->
  <view class="footer">
    <view class="star-btn" @click="handleToggleCollect">
      <image
        style="width: 80rpx; height: 80rpx"
        class="status-icon"
        :src="
          wordDetail?.collectResult
            ? '../../static/icons/收藏3.svg'
            : '../../static/icons/收藏2.svg'
        "
        mode="aspectFit"
      />
    </view>
    <button class="next-btn" @click="handleNextWord">下一单词</button>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { getWordDetailByWordId, confirmCollect, cancelCollect, ensureLogin } from '@/api'
  import type { WordDetailResponse } from '@/types/api'
  // #endregion

  // #region 状态
  const wordDetail = ref<WordDetailResponse | null>(null)
  const wordNo = ref<number>(0)
  const currentWordId = ref<number>(0)
  const nextWordId = ref<number>(0)
  const stats = ref({ currentOrder: 0, reviewWordsNum: 0 })
  const allWordsNum = ref<number>(uni.getStorageSync('allWordsNum') || 0)
  const currentProgress = computed(() => `${wordNo.value}/${allWordsNum.value}`)

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })
  // #endregion

  // #region 计算属性
  const levels = computed(() => {
    if (!wordDetail.value?.level) return []
    return wordDetail.value.level.split('|').map((s) => s.trim())
  })

  const sentences = computed(() => {
    if (!wordDetail.value?.exampleSentence) return { en: '', zh: '' }
    const parts = wordDetail.value.exampleSentence.split('\n')
    return {
      en: parts[0] || '',
      zh: parts[1] || ''
    }
  })
  // #endregion

  // #region 方法
  const fetchWordDetail = async (id: number) => {
    try {
      // 传入 'review' 类型
      const res = await getWordDetailByWordId(id, 'review')
      wordDetail.value = res.data
      nextWordId.value = res.data.nextWordId || 0
      wordNo.value = res.data.wordNo || 0
    } catch (error) {
      console.error('获取单词详情失败:', error)
    }
  }

  // 收藏/取消收藏单词
  const handleToggleCollect = async () => {
    if (!wordDetail.value) return
    const targetStatus = !wordDetail.value.collectResult
    try {
      let res = null
      if (targetStatus) {
        res = await confirmCollect(wordDetail.value.id)
      } else {
        res = await cancelCollect(wordDetail.value.id)
      }
      if (res.code === 200) {
        wordDetail.value.collectResult = targetStatus ? true : false
        uni.showToast({
          title: wordDetail.value.collectResult ? '收藏成功' : '已取消收藏',
          icon: 'none'
        })
      }
    } catch (error) {
      console.error('操作收藏失败:', error)
    }
  }

  const handleNextWord = async () => {
    try {
      if (nextWordId.value) {
        uni.reLaunch({
          url: `/pages/review/question?wordId=${nextWordId.value}`
        })
      } else {
        uni.showToast({
          title: '已经是最后一个单词了',
          icon: 'none'
        })
        // setTimeout(() => {
        //   uni.navigateBack()
        // }, 1500)
      }
    } catch (error) {
      console.error('获取首页信息失败:', error)
      uni.showToast({
        title: '获取下一个单词失败',
        icon: 'none'
      })
    }
  }

  const goBack = () => {
    // uni.reLaunch({
    //   url: '/pages/index/index'
    // })
    uni.navigateBack({
      fail: () => {
        uni.reLaunch({ url: '/pages/word/learned?tab=2' })
      }
    })
  }

  onLoad(async (options: any) => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    if (options.wordId) {
      currentWordId.value = Number(options.wordId)
      stats.value.currentOrder = Number(options.currentOrder) || 0
      stats.value.reviewWordsNum = Number(options.reviewWordsNum) || 0
      await ensureLogin()
      fetchWordDetail(currentWordId.value)
    }
  })
  // #endregion
</script>

<style lang="scss" scoped>
  /* #region 单词头部 */
  .word-header {
    text-align: center;
    margin-bottom: 60rpx;
  }
  .word {
    display: block;
    font-family: Arial, Arial;
    font-weight: bold;
    font-size: 60rpx;
    color: #000000;
    margin-bottom: 10rpx;
  }
  .phonetic {
    display: block;
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: 400;
    font-size: 28rpx;
    color: #666666;
    line-height: 44rpx;
    margin-bottom: 40rpx;
  }
  /* #endregion */

  /* #region 详情卡片 */
  .details-card {
    padding: 30rpx;
    margin-bottom: 20rpx;
    background: #ffffff;
    border-radius: 20rpx 20rpx 20rpx 20rpx;
    border: 2rpx solid #eeeeee;
  }
  .tags {
    display: flex;
    align-items: center;
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: bold;
    font-size: 28rpx;
    color: #333333;
    line-height: 44rpx;
    margin-bottom: 24rpx;
    flex-wrap: wrap;
  }
  .status-icon {
    position: absolute;
  }
  .divider {
    margin: 0 20rpx;
    color: #ddd;
  }
  .def-text {
    display: block;
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: 400;
    font-size: 28rpx;
    color: #666666;
    line-height: 44rpx;
  }
  /* #endregion */

  /* #region 例句卡片 */
  .example-card {
    padding: 30rpx;
    background: #ffffff;
    border-radius: 20rpx 20rpx 20rpx 20rpx;
    border: 2rpx solid #eeeeee;
  }
  .section-title {
    display: block;
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: bold;
    font-size: 28rpx;
    color: #333333;
    line-height: 44rpx;
    margin-bottom: 24rpx;
  }
  .en-sentence {
    display: block;
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: 400;
    font-size: 28rpx;
    color: #666666;
    line-height: 44rpx;
    margin-bottom: 20rpx;
  }
  .zh-sentence {
    display: block;
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: 400;
    font-size: 28rpx;
    color: #666666;
    line-height: 44rpx;
  }
  /* #endregion */

  /* #region 底部 */
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 40rpx;
    background-color: #f5f7fa;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  .star-btn {
    width: 88rpx;
    height: 88rpx;
    border-radius: 44rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 999;
    bottom: 200rpx;
  }
  .next-btn {
    flex: 1;
    background-color: #499ae6;
    color: white;
    border-radius: 50rpx;
    font-size: 32rpx;
    margin: 0;
  }
  /* #endregion */
</style>
