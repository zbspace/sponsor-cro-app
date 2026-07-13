<template>
  <!-- 头部 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px` }">
    <view class="nav-left">
      <view class="back-icon" @click="goBack">
        <view class="arrow"></view>
      </view>
      <text class="progress-text">
        <!-- {{ questionData?.currentOrder }}/{{ questionData?.reviewWordsNum }} -->
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
      height: `calc(100vh - ${menu.top}px - ${menu.height}px - 50px)`
    }"
  >
    <view class="container">
      <!-- 定时器 -->
      <view class="timer-wrapper">
        <view class="timer" :class="{ 'timer-warning': timeLeft <= 5 }">{{ timeLeft }}</view>
      </view>

      <view class="question-wrapper">
        <!-- 问题 -->
        <view class="question-card">
          <text class="question-text">
            {{ questionData?.questionContent || '...' }}
          </text>
        </view>

        <!-- 选项 -->
        <view class="options-list" v-if="questionData">
          <view
            v-for="(item, index) in questionData.questionAnswerList"
            :key="index"
            class="option"
            :class="{
              'option-correct': selectedOption === index && item.correctAnswer,
              'option-wrong': selectedOption === index && !item.correctAnswer
            }"
            @click="selectOption(index, item.correctAnswer)"
          >
            <text>{{ item.answer }}</text>
            <text v-if="selectedOption === index && !item.correctAnswer" class="wrong-icon">×</text>
            <text v-if="selectedOption === index && item.correctAnswer" class="correct-icon">
              ✓
            </text>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>

  <!-- 底部 -->
  <view class="footer">
    <button class="dont-know-btn" @click="handleDontKnow">不认识</button>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed, onUnmounted } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { getChineseQuestionDetail, reviewWord, ensureLogin, getWordDetailByWordId } from '@/api'
  import type { ChineseQuestionResponse } from '@/types/api'
  // #endregion

  // #region 状态
  const wordId = ref<number>(0)
  const wordNo = ref<number>(0)
  const learnedCount = ref<number>(1)
  const questionData = ref<ChineseQuestionResponse | null>(null)
  const selectedOption = ref<number | null>(null)
  const allWordsNum = ref<number>(uni.getStorageSync('allWordsNum') || 0)
  const currentProgress = computed(() => `${wordNo.value}/${allWordsNum.value}`)
  const timeLeft = ref(20)
  let timerId: number | null = null
  let isSubmitting = false
  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })
  // #endregion

  // #region 生命周期
  onLoad(async (options: any) => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    if (options.wordId) {
      wordId.value = Number(options.wordId)
      learnedCount.value = Number(options.learnedCount) || 1
      await ensureLogin()
      fetchWordDetail(wordId.value, 'review')
      await fetchQuestion()
      startTimer()
    }
  })

  onUnmounted(() => {
    stopTimer()
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
      console.error('获取复习题目失败', err)
    }
  }

  const startTimer = () => {
    stopTimer()
    timeLeft.value = 20
    timerId = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        stopTimer()
        handleTimeOut()
      }
    }, 1000)
  }

  const stopTimer = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  const handleTimeOut = async () => {
    if (isSubmitting) return
    isSubmitting = true
    try {
      await reviewWord(wordId.value, false)
      uni.showToast({
        title: '超时未作答',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        goToExplanation()
      }, 2000)
    } catch (err) {
      console.error('提交答案失败', err)
      isSubmitting = false
    }
  }

  const selectOption = async (index: number, isCorrect: boolean) => {
    if (isSubmitting || selectedOption.value !== null) return

    selectedOption.value = index
    stopTimer()
    isSubmitting = true

    try {
      await reviewWord(wordId.value, isCorrect)

      if (!isCorrect) {
        uni.showToast({
          title: '答错了，请看解析',
          icon: 'none',
          duration: 1500
        })
      }

      // 延迟一会处理跳转
      setTimeout(() => {
        if (isCorrect) {
          // 正确，跳转到单词释义页 detail
          uni.redirectTo({
            url: `/pages/review/detail?wordId=${wordId.value}&wordType=recite&learnedCount=${learnedCount.value}`
          })
        } else {
          // 错误或者没有下一题了，进入解析页
          // 如果是答错，跳转延迟需要匹配 toast 的时间
          const delay = isCorrect ? 300 : 1500
          setTimeout(() => {
            goToExplanation()
          }, delay)
        }
      }, 0)
    } catch (err) {
      console.error('提交答案失败', err)
      isSubmitting = false
    }
  }

  const handleDontKnow = async () => {
    if (isSubmitting) return
    stopTimer()
    isSubmitting = true
    try {
      await reviewWord(wordId.value, false)
      goToExplanation()
    } catch (err) {
      console.error('提交答案失败', err)
    } finally {
      isSubmitting = false
    }
  }

  const goToExplanation = () => {
    stopTimer()
    uni.navigateTo({
      url: `/pages/review/explanation?wordId=${wordId.value}&learnedCount=${learnedCount.value}`
    })
  }

  const goBack = () => {
    stopTimer()
    // uni.navigateBack({
    //   fail: () => {
    //     uni.reLaunch({ url: '/pages/index/index' })
    //   }
    // })
    uni.navigateBack({
      fail: () => {
        uni.reLaunch({ url: '/pages/word/learned?tab=2' })
      }
    })
  }
  // #endregion
</script>

<style lang="scss" scoped>
  /* #region 定时器 */
  .timer-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 40rpx;
    position: absolute;
    right: 30rpx;
    top: 0;
  }
  .timer {
    width: 60rpx;
    height: 60rpx;
    border-radius: 30rpx;
    background-color: #e0f2fe;
    color: #0284c7;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 28rpx;
    font-weight: bold;
    transition: all 0.3s;
  }
  .timer-warning {
    background-color: #fee2e2;
    color: #ef4444;
    animation: pulse 1s infinite;
  }
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
    100% {
      transform: scale(1);
    }
  }
  /* #endregion */

  /* #region 问题容器 */
  .question-wrapper {
    background-color: white;
    border-radius: 24rpx;
    padding: 40rpx;
    margin-bottom: 60rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  }
  /* #endregion */

  /* #region 问题 */
  .question-card {
    border-radius: 24rpx;
    margin-bottom: 60rpx;
  }

  .question-text {
    font-size: 32rpx;
    color: #333;
    line-height: 1.6;
  }
  /* #endregion */

  /* #region 选项 */
  .options-list {
    display: flex;
    flex-direction: column;
    gap: 30rpx;
  }
  .option {
    padding: 20rpx 30rpx;
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: 400;
    font-size: 28rpx;
    color: #666666;
    line-height: 44rpx;
    display: flex;
    align-items: center;
    background: #f7f8fa;
    justify-content: space-between;
    border-radius: 20rpx 20rpx 20rpx 20rpx;
  }
  .option.active {
    background-color: #eff6ff;
    border-color: #bfdbfe;
    color: #1d4ed8;
  }
  .option-correct {
    background: #eaf2ff;
    border-radius: 20rpx 20rpx 20rpx 20rpx;
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: 400;
    font-size: 28rpx;
    color: #499ae6;
    line-height: 44rpx;
  }
  .option-wrong {
    background: #fff0ef;
    border-radius: 20rpx 20rpx 20rpx 20rpx;
    font-family:
      PingFang SC,
      PingFang SC;
    font-weight: 400;
    font-size: 28rpx;
    color: #ff6c60;
    line-height: 44rpx;
  }
  .correct-icon {
    color: #16a34a;
    font-weight: bold;
    font-size: 36rpx;
  }
  .wrong-icon {
    color: #dc2626;
    font-weight: bold;
    font-size: 36rpx;
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
  .dont-know-btn {
    background-color: #499ae6;
    color: white;
    border-radius: 50rpx;
    font-size: 32rpx;
  }
  /* #endregion */
</style>
