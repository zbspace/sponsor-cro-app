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
              'option-correct': selectedId === index && item.correctAnswer,
              'option-wrong': selectedId === index && !item.correctAnswer
            }"
            @click="handleAnswer(item, index)"
          >
            <text>{{ item.answer }}</text>
            <text v-if="selectedId === index && !item.correctAnswer" class="wrong-icon">×</text>
            <text v-if="selectedId === index && item.correctAnswer" class="correct-icon">✓</text>
          </view>
        </view>
      </view>
    </view>
  </scroll-view>
  <!-- 底部 -->
  <view class="footer">
    <button class="dont-know-btn" @click="goToExplanation">不认识</button>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, onUnmounted, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import {
    getEnglishQuestionDetailByWordId,
    reciteWord,
    getIndexInfo,
    ensureLogin,
    getVip
  } from '@/api'
  import type { EnglishQuestionResponse, QuestionAnswer } from '@/types/api'
  // #endregion

  // #region 状态
  const wordId = ref<number>(0)
  const learnedCount = ref<number>(1)
  const questionData = ref<EnglishQuestionResponse | null>(null)
  const timeLeft = ref(20)
  const timer = ref<number | null>(null)
  const selectedId = ref<number | null>(null)
  const allWordsNum = ref<number>(uni.getStorageSync('allWordsNum') || 0)
  const currentProgress = computed(() => `${wordId.value}/${allWordsNum.value}`)
  // 胶囊位置信息
  const menu = ref({
    top: 0,
    left: 0,
    height: 0
  })
  // #endregion

  // #region 生命周期
  let queryOptions: any = {}
  onLoad((options: any) => {
    // 获取胶囊位置信息（单位px）
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    queryOptions = options
    if (options.wordId) {
      wordId.value = Number(options.wordId)
      learnedCount.value = Number(options.learnedCount) || 1
      init()
    }
  })

  onUnmounted(() => {
    stopTimer()
  })
  // #endregion

  // #region 方法
  async function init() {
    await ensureLogin()

    // VIP 权限检查
    if (getVip() !== 1 && learnedCount.value > 3) {
      uni.showModal({
        title: '需开通VIP',
        content: '免费试用已达上限，请开通VIP继续学习',
        confirmText: '去开通',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ url: '/pages/vip/index' })
          } else {
            uni.reLaunch({ url: '/pages/index/index' })
          }
        }
      })
      return
    }
    await Promise.all([startTimer(), fetchQuestion()])
  }

  async function fetchQuestion() {
    if (!wordId.value) return
    try {
      const res = await getEnglishQuestionDetailByWordId(wordId.value)
      questionData.value = res.data
    } catch (err) {
      console.error('获取题目失败', err)
    }
  }

  function startTimer() {
    stopTimer()
    timeLeft.value = 20
    timer.value = setInterval(() => {
      if (timeLeft.value > 0) {
        timeLeft.value--
      } else {
        stopTimer()
        uni.showToast({
          title: '时间到，请看解析',
          icon: 'none',
          duration: 2000
        })
        setTimeout(() => {
          goToExplanation()
        }, 2000)
      }
    }, 1000) as unknown as number
  }

  function stopTimer() {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
  }

  async function handleAnswer(item: QuestionAnswer, index: number) {
    if (selectedId.value !== null) return // 防止重复点击

    stopTimer()
    selectedId.value = index

    try {
      // 调用答题接口
      await reciteWord(wordId.value, item.correctAnswer)

      if (!item.correctAnswer) {
        uni.showToast({
          title: '答错了，请看解析',
          icon: 'none',
          duration: 1500
        })
      }

      // 延迟一会处理跳转
      setTimeout(() => {
        if (item.correctAnswer) {
          // 正确，跳转到单词释义页 detail
          uni.redirectTo({
            url: `/pages/word/detail?wordId=${wordId.value}&wordType=recite&learnedCount=${learnedCount.value}`
          })
        } else {
          // 错误或者没有下一题了，进入解析页
          // 如果是答错，跳转延迟需要匹配 toast 的时间
          const delay = item.correctAnswer ? 500 : 1500
          setTimeout(() => {
            goToExplanation()
          }, delay)
        }
      }, 0)
    } catch (err) {
      console.error('提交答案失败', err)
    }
  }

  const goBack = () => {
    stopTimer()
    uni.navigateTo({
      url: `/pages/index/index`
    })
  }

  const goToExplanation = () => {
    stopTimer()
    uni.redirectTo({
      url: `/pages/learn/explanation?wordId=${wordId.value}&learnedCount=${learnedCount.value}`
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

    .timer {
      width: 72rpx;
      height: 72rpx;
      border-radius: 36rpx;
      background-color: #e0f2fe;
      color: #0284c7;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 28rpx;
      font-weight: bold;
      transition: all 0.3s;

      &.timer-warning {
        background-color: #fee2e2;
        color: #ef4444;
      }
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
    justify-content: space-between;
    background: #f7f8fa;
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

    .dont-know-btn {
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
