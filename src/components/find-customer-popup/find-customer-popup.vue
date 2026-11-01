<template>
  <bottom-sheet ref="sheetRef" :visible="visible" @close="close">
    <view class="find-popup-content">
      <!-- 头部：标题 + 副标题 + 关闭 -->
      <view class="modal-head-row">
        <view class="modal-title-wrap">
          <text class="modal-title">找药企</text>
          <text class="modal-sub">按适应症反向匹配潜在客户</text>
        </view>
        <view class="modal-close" @click="close">
          <text>×</text>
        </view>
      </view>

      <!-- #region 搜索条件 -->
      <view class="search-wrap">
        <view class="modal-search">
          <view class="search-ico"></view>
          <input
            type="text"
            :adjust-position="false"
            v-model="indicationKeyword"
            placeholder="输入适应症名称，如：非小细胞肺癌"
            placeholder-style="color: #9CA3AF"
            @keyboardheightchange="onKeyboardHeightChange"
          />
          <text class="clear-icon" v-if="indicationKeyword" @click="clearIndicationKeyword">×</text>
          <view class="modal-confirm" @click="handleSearch">
            <text>查询</text>
          </view>
        </view>
      </view>
      <!-- #endregion -->

      <!-- #region 搜索历史 -->
      <view class="modal-history">
        <view class="mh-head">
          <text class="mh-title">搜索历史</text>
          <text class="mh-clear" v-if="recentList.length > 0" @click="clearRecentList">清空</text>
        </view>

        <view class="mh-chips" v-if="recentList.length > 0">
          <view class="mh-chip" v-for="name in recentList" :key="name" @click="selectRecent(name)">
            <text>{{ name }}</text>
          </view>
        </view>

        <view class="mh-empty" v-else>
          <view class="mh-empty-ico">
            <view class="search-ico"></view>
          </view>
          <text>暂无搜索记录</text>
        </view>

        <view class="modal-history-divider"></view>
      </view>
      <!-- #endregion -->
    </view>
  </bottom-sheet>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, watch } from 'vue'
  // #endregion

  // #region 属性与事件
  const props = defineProps<{
    visible: boolean
  }>()

  const emit = defineEmits(['update:visible'])
  // #endregion

  // #region 键盘避让
  // 弹层容器引用：input 的 keyboardheightchange 事件拿到键盘高度后上报给 bottom-sheet
  const sheetRef = ref<{ setKeyboardHeight: (height: number) => void } | null>(null)

  function onKeyboardHeightChange(e: { detail: { height: number } }) {
    sheetRef.value?.setKeyboardHeight(e.detail?.height || 0)
  }
  // #endregion

  // #region 状态
  // 适应症关键字（开放性输入）
  const indicationKeyword = ref('')
  // #endregion

  // #region 搜索条件
  // 清空适应症搜索框
  function clearIndicationKeyword() {
    indicationKeyword.value = ''
  }
  // #endregion

  // #region 最近搜索记录
  const RECENT_MAX_COUNT = 10
  const RECENT_STORAGE_KEY = 'findCustomerRecentIndication'
  const recentList = ref<string[]>([])

  function loadRecentList() {
    try {
      const data = uni.getStorageSync(RECENT_STORAGE_KEY)
      recentList.value = Array.isArray(data) ? data.slice(0, RECENT_MAX_COUNT) : []
    } catch {
      recentList.value = []
    }
  }

  // 记录搜索关键字：去重、最新的排前面、最多保留 10 条
  function saveRecent(name: string) {
    recentList.value = [name, ...recentList.value.filter((item) => item !== name)].slice(
      0,
      RECENT_MAX_COUNT
    )
    uni.setStorageSync(RECENT_STORAGE_KEY, recentList.value)
  }

  // 清空搜索历史
  function clearRecentList() {
    recentList.value = []
    uni.removeStorageSync(RECENT_STORAGE_KEY)
  }

  // 点击历史记录：回填关键字并直接搜索
  function selectRecent(name: string) {
    indicationKeyword.value = name
    handleSearch()
  }
  // #endregion

  // #region 监听
  watch(
    () => props.visible,
    (val) => {
      if (val) {
        // 打开时读取最近搜索记录
        loadRecentList()
        return
      }
      // 关闭时重置表单
      indicationKeyword.value = ''
    }
  )
  // #endregion

  // #region 方法
  function close() {
    emit('update:visible', false)
  }

  function handleSearch() {
    const keyword = indicationKeyword.value.trim()

    if (!keyword) {
      uni.showToast({ title: '请输入适应症', icon: 'none' })
      return
    }

    saveRecent(keyword)

    uni.navigateTo({
      url: `/pages/customer/matching-degree?indication=${encodeURIComponent(keyword)}`
    })
    close()
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .find-popup-content {
    width: 100%;
    min-height: 80vh;
    max-height: 88vh;
    background: #ffffff;
    border-radius: 40rpx 40rpx 0 0;
    padding: 56rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
    position: relative;
    box-sizing: border-box;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
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

  /* #region 搜索框 */
  .search-wrap {
    position: relative;
    margin-bottom: 16rpx;

    .modal-search {
      display: flex;
      align-items: center;
      gap: 16rpx;
      height: 80rpx;
      padding: 0 24rpx;
      background: #f7f8fa;
      border-radius: 20rpx;

      input {
        flex: 1;
        min-width: 0;
        font-size: 28rpx;
        color: #1f2329;
      }

      .clear-icon {
        flex-shrink: 0;
        padding-left: 10rpx;
        font-size: 32rpx;
        line-height: 1;
        color: #cccccc;
      }
    }

    .modal-confirm {
      flex-shrink: 0;
      height: 60rpx;
      padding: 0 32rpx;
      border-radius: 16rpx;
      background: #1e6fff;
      display: flex;
      align-items: center;
      justify-content: center;

      text {
        color: #ffffff;
        font-size: 26rpx;
      }

      &:active {
        opacity: 0.85;
      }
    }
  }

  // 放大镜图标（纯 CSS 绘制）
  .search-ico {
    position: relative;
    width: 34rpx;
    height: 34rpx;
    flex-shrink: 0;
    border: 4rpx solid #9ca3af;
    border-radius: 50%;
    box-sizing: border-box;

    &::after {
      content: '';
      position: absolute;
      right: -10rpx;
      bottom: -8rpx;
      width: 14rpx;
      height: 4rpx;
      border-radius: 2rpx;
      background: #9ca3af;
      transform: rotate(45deg);
    }
  }
  /* #endregion */

  /* #region 搜索历史 */
  .modal-history {
    padding-top: 4rpx;
    flex: 1;
    display: flex;
    flex-direction: column;

    .mh-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 4rpx 0 16rpx;
    }

    .mh-title {
      font-size: 24rpx;
      color: #9ca3af;
    }

    .mh-clear {
      font-size: 24rpx;
      color: #9ca3af;

      &:active {
        color: #1e6fff;
      }
    }

    .mh-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;
    }

    .mh-chip {
      padding: 12rpx 26rpx;
      background: #f7f8fa;
      border-radius: 32rpx;

      text {
        font-size: 26rpx;
        color: #1f2329;
      }

      &:active {
        background: #e8edf3;

        text {
          color: #1e6fff;
        }
      }
    }

    .mh-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20rpx;
      padding: 44rpx 0 20rpx;

      .mh-empty-ico {
        width: 104rpx;
        height: 104rpx;
        border-radius: 50%;
        background: #f7f8fa;
        display: flex;
        align-items: center;
        justify-content: center;

        .search-ico {
          width: 44rpx;
          height: 44rpx;
          border-color: #c6cbd4;

          &::after {
            right: -12rpx;
            bottom: -10rpx;
            width: 18rpx;
            height: 5rpx;
            background: #c6cbd4;
          }
        }
      }

      text {
        font-size: 24rpx;
        color: #9ca3af;
      }
    }

    .modal-history-divider {
      height: 2rpx;
      margin-top: 20rpx;
      background: #f0f1f3;
    }
  }
  /* #endregion */
</style>
