<template>
  <bottom-sheet ref="sheetRef" :visible="visible" @close="close">
    <view class="find-popup-content">
      <!-- 头部：标题 + 副标题 + 关闭 -->
      <view class="modal-head-row">
        <view class="modal-title-wrap">
          <text class="modal-title">找客户</text>
          <text class="modal-sub">按适应症或药品反向匹配潜在客户</text>
        </view>
        <view class="modal-close" @click="close">
          <text>×</text>
        </view>
      </view>

      <!-- #region 模式切换 -->
      <view class="fc-mode">
        <view
          class="fc-mode-tab"
          :class="{ active: activeTab === 'indication' }"
          @click="switchTab('indication')"
        >
          <text>按适应症</text>
        </view>
        <view
          class="fc-mode-tab"
          :class="{ active: activeTab === 'drug' }"
          @click="switchTab('drug')"
        >
          <text>按药品</text>
        </view>
      </view>
      <!-- #endregion -->

      <!-- #region 搜索条件 -->
      <view class="search-wrap">
        <view class="modal-search">
          <view class="search-ico"></view>
          <template v-if="activeTab === 'indication'">
            <input
              type="text"
              :adjust-position="false"
              v-model="indicationKeyword"
              placeholder="输入适应症名称，如：非小细胞肺癌"
              placeholder-style="color: #9CA3AF"
              @keyboardheightchange="onKeyboardHeightChange"
            />
            <text class="clear-icon" v-if="indicationKeyword" @click="clearIndicationKeyword">
              ×
            </text>
          </template>
          <template v-else>
            <input
              type="text"
              :adjust-position="false"
              v-model="drugState.keyword"
              placeholder="输入通用名或研发代号"
              placeholder-style="color: #9CA3AF"
              @input="onDrugInput"
              @keyboardheightchange="onKeyboardHeightChange"
            />
            <text class="clear-icon" v-if="drugState.keyword" @click="clearDrugKeyword">×</text>
          </template>
          <view class="modal-confirm" @click="handleSearch">
            <text>查询</text>
          </view>
        </view>

        <!-- 药品 tab 的下拉联想 -->
        <view class="search-dropdown" v-if="drugState.showDropdown">
          <view class="dropdown-loading" v-if="drugState.loading">
            <text>加载中...</text>
          </view>
          <template v-else>
            <scroll-view
              scroll-y
              class="dropdown-list"
              :show-scrollbar="false"
              :style="dropdownListStyle(drugState.results.length)"
              v-if="drugState.results.length > 0"
            >
              <view
                class="dropdown-item"
                v-for="item in drugState.results"
                :key="item.cleanedDrugName"
                @click="selectDrug(item)"
              >
                <text class="dropdown-name">{{ item.cleanedDrugName }}</text>
              </view>
            </scroll-view>
            <view class="dropdown-empty" v-if="drugState.results.length === 0">
              <text>未找到相关药品</text>
            </view>
          </template>
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
  import { reactive, ref, computed, watch } from 'vue'
  import { queryCleanedDrugName } from '@/api'
  import type { CleanedDrugItem } from '@/types/api'
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
  type SearchTab = 'indication' | 'drug'

  // 当前 tab
  const activeTab = ref<SearchTab>('indication')
  // 适应症关键字（开放性输入）
  const indicationKeyword = ref('')

  // 药品搜索状态
  const drugState = reactive({
    keyword: '',
    results: [] as CleanedDrugItem[],
    showDropdown: false,
    loading: false,
    selected: null as CleanedDrugItem | null,
    timer: null as ReturnType<typeof setTimeout> | null
  })
  // #endregion

  // #region Tab 切换
  function switchTab(tab: SearchTab) {
    if (activeTab.value === tab) return
    if (drugState.timer) clearTimeout(drugState.timer)
    drugState.showDropdown = false
    activeTab.value = tab
  }
  // #endregion

  // #region 药品搜索
  function onDrugInput() {
    if (drugState.timer) clearTimeout(drugState.timer)
    drugState.selected = null // 输入时重置已选

    const keyword = drugState.keyword.trim()
    if (!keyword) {
      drugState.results = []
      drugState.showDropdown = false
      return
    }

    drugState.timer = setTimeout(() => {
      fetchDrugNames()
    }, 300)
  }

  // 清空适应症搜索框：适应症仅有开放输入，复位关键字即可
  function clearIndicationKeyword() {
    indicationKeyword.value = ''
  }

  // 清空药品搜索框：复位关键字、联想下拉、已选药品并清理防抖
  function clearDrugKeyword() {
    if (drugState.timer) clearTimeout(drugState.timer)
    drugState.timer = null
    drugState.keyword = ''
    drugState.results = []
    drugState.showDropdown = false
    drugState.selected = null
  }

  async function fetchDrugNames() {
    const keyword = drugState.keyword.trim()
    if (!keyword) return

    drugState.loading = true
    drugState.showDropdown = true

    try {
      const res = await queryCleanedDrugName({
        pageNum: 1,
        pageSize: 20,
        searchKey: keyword
      })
      drugState.results = res.data?.list || []
    } catch {
      drugState.results = []
    } finally {
      drugState.loading = false
    }
  }

  function selectDrug(item: CleanedDrugItem) {
    drugState.keyword = item.cleanedDrugName
    drugState.selected = item
    drugState.showDropdown = false
  }
  // #endregion

  // #region 最近搜索记录
  const RECENT_MAX_COUNT = 10
  const RECENT_KEYS: Record<SearchTab, string> = {
    indication: 'findCustomerRecentIndication',
    drug: 'findCustomerRecentDrug'
  }
  const recentIndicationList = ref<string[]>([])
  const recentDrugList = ref<string[]>([])

  // 当前 tab 对应的最近搜索记录
  const recentList = computed(() =>
    activeTab.value === 'indication' ? recentIndicationList.value : recentDrugList.value
  )

  function readRecent(key: string) {
    try {
      const data = uni.getStorageSync(key)
      return Array.isArray(data) ? data.slice(0, RECENT_MAX_COUNT) : []
    } catch {
      return []
    }
  }

  function loadRecentLists() {
    recentIndicationList.value = readRecent(RECENT_KEYS.indication)
    recentDrugList.value = readRecent(RECENT_KEYS.drug)
  }

  // 记录搜索关键字：去重、最新的排前面、最多保留 10 条
  function saveRecent(name: string) {
    const list = [name, ...recentList.value.filter((item) => item !== name)].slice(
      0,
      RECENT_MAX_COUNT
    )
    if (activeTab.value === 'indication') {
      recentIndicationList.value = list
    } else {
      recentDrugList.value = list
    }
    uni.setStorageSync(RECENT_KEYS[activeTab.value], list)
  }

  // 清空当前 tab 的搜索历史
  function clearRecentList() {
    if (activeTab.value === 'indication') {
      recentIndicationList.value = []
    } else {
      recentDrugList.value = []
    }
    uni.removeStorageSync(RECENT_KEYS[activeTab.value])
  }

  // 点击历史记录：回填关键字并直接搜索
  function selectRecent(name: string) {
    if (activeTab.value === 'indication') {
      indicationKeyword.value = name
    } else {
      drugState.keyword = name
      drugState.selected = null
      drugState.showDropdown = false
    }
    handleSearch()
  }
  // #endregion

  // #region UI 辅助逻辑
  // 下拉列表高度：单行约 88rpx，最多展示约 400rpx，超出可上下滚动
  const DROPDOWN_ITEM_HEIGHT = 88
  const DROPDOWN_MAX_HEIGHT = 400
  function dropdownListStyle(count: number) {
    const height = Math.min(count * DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT)
    return { height: `${height}rpx` }
  }
  // #endregion

  // #region 监听
  watch(
    () => props.visible,
    (val) => {
      if (val) {
        // 打开时读取最近搜索记录
        loadRecentLists()
        return
      }
      // 关闭时重置表单
      if (drugState.timer) clearTimeout(drugState.timer)
      drugState.timer = null
      indicationKeyword.value = ''
      drugState.keyword = ''
      drugState.results = []
      drugState.showDropdown = false
      drugState.selected = null
    }
  )
  // #endregion

  // #region 方法
  function close() {
    emit('update:visible', false)
  }

  function handleSearch() {
    const isIndication = activeTab.value === 'indication'
    const keyword = (isIndication ? indicationKeyword.value : drugState.keyword).trim()

    if (!keyword) {
      uni.showToast({
        title: isIndication ? '请输入适应症' : '请输入药品名',
        icon: 'none'
      })
      return
    }

    saveRecent(keyword)

    const query = `indication=${encodeURIComponent(isIndication ? keyword : '')}&drugName=${encodeURIComponent(isIndication ? '' : keyword)}`
    uni.navigateTo({
      url: `/pages/customer/matching-degree?${query}`
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

  /* #region 模式切换 */
  .fc-mode {
    display: flex;
    padding: 6rpx;
    margin-bottom: 16rpx;
    background: #f7f8fa;
    border-radius: 20rpx;

    .fc-mode-tab {
      flex: 1;
      padding: 14rpx 0;
      text-align: center;
      font-size: 26rpx;
      color: #6b7280;
      border-radius: 16rpx;

      &.active {
        background: #ffffff;
        color: #1e6fff;
        font-weight: 600;
        box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.06);
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

    .search-dropdown {
      position: absolute;
      top: 92rpx;
      left: 0;
      right: 0;
      padding: 8rpx 12rpx;
      background: #ffffff;
      border-radius: 20rpx;
      box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.1);
      z-index: 10;

      .dropdown-list {
        width: 100%;
      }

      .dropdown-item {
        padding: 22rpx 16rpx;
        border-radius: 16rpx;

        &:active {
          background: #f7f8fa;
        }

        .dropdown-name {
          font-size: 28rpx;
          color: #1f2329;
        }
      }

      .dropdown-loading,
      .dropdown-empty {
        padding: 30rpx 0;
        text-align: center;
        font-size: 26rpx;
        color: #9ca3af;
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
