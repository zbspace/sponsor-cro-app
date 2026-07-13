<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-left">
      <view class="back-icon" @click="goBack">
        <view class="arrow"></view>
      </view>
      <text class="progress-text">
        <!-- {{ questionData?.currentOrder || 0 }}/{{ questionData?.reviewWordsNum || 0 }} -->
        {{ currentProgress }}
      </text>
    </view>
  </view>
  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <scroll-view
    scroll-y
    class="container-scroll-view"
    :show-scrollbar="false"
    enhanced
    :style="{
      height: `calc(100vh - ${menu.top}px - ${menu.height}px - 100px)`
    }"
  >
    <view class="container">
      <view class="question-container">
        <!-- 问题 -->
        <view class="question-text" v-if="questionData">
          {{ questionData.questionContent }}
        </view>

        <!-- 正确选项 -->
        <text class="section-title">正确选项：</text>
        <view class="correct-box">
          <text>{{ correctAnswer?.answer }}</text>
        </view>

        <!-- 解析 -->
        <text class="explanation-text">注解：{{ correctAnswer?.annotation }}</text>
      </view>

      <!-- 错误选项 -->
      <view class="section-container" v-if="wrongAnswers.length > 0">
        <text class="section-title">错误选项辨析：</text>
        <view class="incorrect-item" v-for="(item, index) in wrongAnswers" :key="index">
          <text class="keyword">{{ item.simpleAnswer }}：</text>
          <text class="desc">{{ item.annotation }}</text>
        </view>
      </view>
    </view>
  </scroll-view>
  <!-- 底部 -->
  <view class="footer" v-if="questionData">
    <button class="next-btn" @click="goToDetail">下一页</button>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { getChineseQuestionDetail, ensureLogin, getWordDetailByWordId } from '@/api'
  import type { ChineseQuestionResponse } from '@/types/api'
  // #endregion

  // #region 状态
  const wordId = ref<number>(0)
  const wordNo = ref<number>(0)
  const questionData = ref<ChineseQuestionResponse | null>(null)
  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })
  const correctAnswer = computed(() =>
    questionData.value?.questionAnswerList.find((item) => item.correctAnswer)
  )

  const wrongAnswers = computed(
    () => questionData.value?.questionAnswerList.filter((item) => !item.correctAnswer) || []
  )
  const allWordsNum = ref<number>(uni.getStorageSync('allWordsNum') || 0)
  const currentProgress = computed(() => `${wordNo.value}/${allWordsNum.value}`)
  // #endregion

  // #region 生命周期
  onLoad(async (options: any) => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    if (options.wordId) {
      wordId.value = Number(options.wordId)
      await ensureLogin()
      fetchWordDetail(wordId.value, 'review')
      fetchQuestion()
    }
  })
  // #endregion

  // #region 方法
  const fetchWordDetail = async (id: number, type: string) => {
    try {
      const res = await getWordDetailByWordId(id, type)
      wordNo.value = res.data.wordNo || 0
    } catch (error) {
      console.error('获取单词详情失败:', error)
    }
  }
  async function fetchQuestion() {
    try {
      const res = await getChineseQuestionDetail(wordId.value)
      questionData.value = res.data
    } catch (err) {
      console.error('获取解析失败', err)
    }
  }

  const goToDetail = () => {
    uni.navigateTo({
      url: `/pages/review/detail?wordId=${wordId.value}&currentOrder=${questionData.value?.currentOrder || 0}&reviewWordsNum=${questionData.value?.reviewWordsNum || 0}`
    })
  }

  const goBack = () => {
    // uni.reLaunch({ url: '/pages/index/index' })
    uni.navigateBack({
      fail: () => {
        uni.reLaunch({ url: '/pages/word/learned?tab=2' })
      }
    })
  }
  // #endregion
</script>

<style lang="scss" scoped>
  /* #region 问题 */
  .question-container {
    background: #ffffff;
    border-radius: 20rpx 20rpx 20rpx 20rpx;
    border: 2rpx solid #eeeeee;
    padding: 30rpx;
    margin-bottom: 24rpx;
    .question-text {
      font-family:
        PingFang SC,
        PingFang SC;
      font-weight: 400;
      font-size: 28rpx;
      color: #666666;
      line-height: 44rpx;
      margin-bottom: 40rpx;
    }
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
    margin-bottom: 20rpx;
  }

  /* #region 正确提示框 */
  .correct-box {
    background: #eaf2ff;
    border-radius: 20rpx 20rpx 20rpx 20rpx;
    border: 2rpx solid #bfdbfe;
    padding: 28rpx;
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: 400;
    font-size: 28rpx;
    color: #499ae6;
    line-height: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
  }
  /* #endregion */

  .section-container {
    background: #ffffff;
    border-radius: 20rpx 20rpx 20rpx 20rpx;
    border: 2rpx solid #eeeeee;
    margin-bottom: 20rpx;
    padding: 30rpx;
  }

  /* #region 解析 */
  .explanation-text {
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: 400;
    font-size: 28rpx;
    color: #666666;
    line-height: 44rpx;
  }
  /* #endregion */

  /* #region 错误选项 */
  .incorrect-item {
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: 400;
    font-size: 28rpx;
    line-height: 44rpx;
    margin-bottom: 20rpx;
  }
  .keyword {
    color: #499ae6;
    font-weight: 500;
  }
  .desc {
    color: #666;
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
  }
  .next-btn {
    background-color: #499ae6;
    color: white;
    border-radius: 50rpx;
    font-size: 32rpx;
  }
  /* #endregion */
</style>
