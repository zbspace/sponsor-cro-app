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
        <view class="section" v-if="correctAnswer">
          <text class="section-title">正确选项：</text>
          <view class="correct-box">
            <text>{{ correctAnswer.answer }}</text>
          </view>
        </view>

        <!-- 解析 -->
        <view class="section" v-if="correctAnswer">
          <text class="explanation-text">注解：{{ correctAnswer.annotation }}</text>
        </view>
      </view>

      <view class="question-container">
        <!-- 错误选项 -->
        <view class="section" v-if="wrongAnswers.length > 0">
          <text class="section-title">错误选项辨析：</text>
          <view class="incorrect-item" v-for="(item, index) in wrongAnswers" :key="index">
            <text class="keyword">{{ item.simpleAnswer }}：</text>
            <text class="desc">{{ item.annotation }}</text>
          </view>
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
  import { getEnglishQuestionDetailByWordId, getIndexInfo, ensureLogin } from '@/api'
  import type { EnglishQuestionResponse } from '@/types/api'
  // #endregion

  // #region 状态
  const wordId = ref<number>(0)
  const learnedCount = ref<number>(1)
  const questionData = ref<EnglishQuestionResponse | null>(null)
  const stats = ref({ recited: 0, total: 0 })
  const allWordsNum = ref<number>(uni.getStorageSync('allWordsNum') || 0)
  const currentProgress = computed(() => `${wordId.value}/${allWordsNum.value}`)

  const correctAnswer = computed(() =>
    questionData.value?.questionAnswerList.find((item) => item.correctAnswer)
  )

  const wrongAnswers = computed(
    () => questionData.value?.questionAnswerList.filter((item) => !item.correctAnswer) || []
  )
  // #endregion

  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })

  // #region 生命周期
  onLoad(async (options: any) => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    if (options.wordId) {
      wordId.value = Number(options.wordId)
      learnedCount.value = Number(options.learnedCount) || 1
      await ensureLogin()
      fetchStats()
      fetchQuestion()
    }
  })
  // #endregion

  // #region 方法
  async function fetchStats() {
    try {
      const res = await getIndexInfo()
      stats.value = {
        recited: res.data.recitedWordsNum,
        total: res.data.allWordsNum
      }
    } catch (err) {
      console.error('获取进度失败', err)
    }
  }

  async function fetchQuestion() {
    try {
      const res = await getEnglishQuestionDetailByWordId(wordId.value)
      questionData.value = res.data
    } catch (err) {
      console.error('获取解析失败', err)
    }
  }

  const goBack = () => {
    uni.navigateTo({
      url: `/pages/index/index`
    })
  }

  const goToDetail = () => {
    uni.navigateTo({
      url: `/pages/word/detail?wordId=${wordId.value}&wordType=recite&learnedCount=${learnedCount.value}`
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

  /* #region 问题 */
  .question-text {
    font-size: 28rpx;
    color: #333;
    line-height: 1.6;
    margin-bottom: 40rpx;
  }
  /* #endregion */

  /* #region 区块 */
  .section {
    margin-bottom: 50rpx;

    .section-title {
      display: block;
      font-size: 30rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 20rpx;
    }
  }
  /* #endregion */

  /* #region 正确提示框 */
  .correct-box {
    background-color: #eff6ff;
    border: 2rpx solid #bfdbfe;
    border-radius: 16rpx;
    padding: 30rpx;
    color: #1d4ed8;
    font-size: 28rpx;
    text-align: center;
    font-weight: bold;
  }
  /* #endregion */

  /* #region 解析 */
  .explanation-text {
    font-size: 28rpx;
    color: #666;
    line-height: 1.6;
  }
  /* #endregion */

  /* #region 错误选项辨析 */
  .incorrect-item {
    margin-bottom: 30rpx;
    font-size: 28rpx;
    line-height: 1.6;

    .keyword {
      color: #499ae6;
      font-weight: 500;
    }

    .desc {
      color: #666;
    }
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

    .next-btn {
      background-color: #499ae6;
      color: white;
      border-radius: 50rpx;
      font-size: 32rpx;
      height: 88rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      border: none;

      &:active {
        opacity: 0.8;
      }
    }
  }
  /* #endregion */
</style>
