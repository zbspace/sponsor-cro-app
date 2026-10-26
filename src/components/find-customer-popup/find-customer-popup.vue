<template>
  <bottom-sheet :visible="visible" @close="close">
    <view class="find-popup-content">
      <view class="popup-header">
        <text class="popup-title">找客户</text>
        <view class="close-btn" @click="close">
          <image class="close-icon" src="../../static/icons/close.png" mode="aspectFit" />
        </view>
      </view>

      <!-- #region Tab 切换 -->
      <view class="tab-switch">
        <view
          class="tab-item"
          :class="{ active: activeTab === 'indication' }"
          @click="switchTab('indication')"
        >
          <text>按照适应症</text>
        </view>
        <view class="tab-item" :class="{ active: activeTab === 'drug' }" @click="switchTab('drug')">
          <text>按药品</text>
        </view>
      </view>
      <!-- #endregion -->

      <!-- #region 搜索条件 -->
      <view class="form-section">
        <!-- 适应症：开放性输入 -->
        <view class="search-input-section" v-if="activeTab === 'indication'">
          <text class="field-label">适应症：</text>
          <view class="input-wrapper">
            <view class="search-icon"></view>
            <input
              type="text"
              v-model="indicationKeyword"
              placeholder="输入适应症名称"
              placeholder-style="color: #B2B2B2"
            />
          </view>
        </view>

        <!-- 药品名：通用名或研发代号（搜索 + 选择） -->
        <view class="search-input-section" v-else>
          <text class="field-label">药品名：</text>
          <view class="input-wrapper">
            <view class="search-icon"></view>
            <input
              type="text"
              v-model="drugState.keyword"
              placeholder="输入通用名或研发代号"
              placeholder-style="color: #B2B2B2"
              @input="onDrugInput"
            />
          </view>

          <!-- 搜索下拉联想 -->
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
      </view>
      <!-- #endregion -->

      <!-- #region 最近搜索记录 -->
      <view class="recent-section" v-if="recentList.length > 0">
        <text class="recent-label">最近搜索记录：</text>
        <view class="recent-list">
          <view
            class="recent-item"
            v-for="name in recentList"
            :key="name"
            @click="selectRecent(name)"
          >
            <text>{{ name }}</text>
          </view>
        </view>
      </view>
      <!-- #endregion -->

      <view class="search-btn" @click="handleSearch">
        <text>搜索</text>
      </view>
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
    max-height: 88vh;
    background: #ffffff;
    border-radius: 40rpx 40rpx 0 0;
    padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
    position: relative;
    box-sizing: border-box;

    .popup-header {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 40rpx;
      position: relative;

      .popup-title {
        font-weight: bold;
        font-size: 28rpx;
        color: #293959;
        line-height: 52rpx;
      }

      .close-btn {
        position: absolute;
        right: -10rpx;
        top: -10rpx;
        padding: 10rpx;
      }
    }

    /* #region Tab 切换样式 */
    .tab-switch {
      display: flex;
      background: #f2f3f5;
      border-radius: 16rpx;
      padding: 6rpx;
      margin-bottom: 40rpx;

      .tab-item {
        flex: 1;
        height: 68rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 12rpx;

        text {
          font-size: 28rpx;
          color: #333333;
        }

        &.active {
          background: #ffffff;
          box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.08);

          text {
            font-weight: bold;
          }
        }
      }
    }
    /* #endregion */

    /* #region 搜索条件样式 */
    .form-section {
      margin-bottom: 30rpx;
    }

    .search-input-section {
      position: relative;

      .field-label {
        display: block;
        font-size: 28rpx;
        color: #333333;
        margin-bottom: 20rpx;
      }

      .input-wrapper {
        background: #ffffff;
        border: 1rpx solid #d9d9d9;
        border-radius: 8rpx;
        height: 88rpx;
        padding: 0 24rpx;
        display: flex;
        align-items: center;

        .search-icon {
          width: 24rpx;
          height: 24rpx;
          border: 3rpx solid #333333;
          border-radius: 50%;
          position: relative;
          margin-right: 18rpx;
          flex-shrink: 0;

          &::after {
            content: '';
            position: absolute;
            right: -10rpx;
            bottom: -8rpx;
            width: 14rpx;
            height: 3rpx;
            background: #333333;
            transform: rotate(45deg);
          }
        }

        input {
          flex: 1;
          font-size: 28rpx;
          color: #333333;
        }
      }

      .search-dropdown {
        position: absolute;
        top: 140rpx;
        left: 0;
        right: 0;
        background: #ffffff;
        border-radius: 12rpx;
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
        z-index: 10;
        max-height: 400rpx;
        overflow-y: auto;

        .dropdown-list {
          width: 100%;
        }

        .dropdown-item {
          padding: 24rpx 30rpx;
          border-bottom: 1rpx solid #f5f5f5;

          &:last-child {
            border-bottom: none;
          }

          &:active {
            background: #f7f8fa;
          }

          .dropdown-name {
            font-size: 28rpx;
            color: #333333;
          }
        }

        .dropdown-loading,
        .dropdown-empty {
          padding: 30rpx 0;
          text-align: center;
          font-size: 26rpx;
          color: #999999;
        }
      }
    }
    /* #endregion */

    /* #region 最近搜索记录样式 */
    .recent-section {
      margin-bottom: 30rpx;

      .recent-label {
        font-size: 28rpx;
        color: #333333;
      }

      .recent-list {
        display: flex;
        flex-wrap: wrap;
        margin-top: 20rpx;
      }

      .recent-item {
        padding: 12rpx 30rpx;
        margin: 0 20rpx 20rpx 0;
        border: 1rpx solid #d9d9d9;
        border-radius: 4rpx;

        text {
          font-size: 26rpx;
          color: #333333;
        }

        &:active {
          background: #f7f8fa;
        }
      }
    }
    /* #endregion */

    .search-btn {
      width: 266rpx;
      height: 100rpx;
      background: linear-gradient(90deg, #4295f3 0%, #2b66ef 100%);
      border-radius: 20rpx 20rpx 20rpx 20rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 20rpx auto 0;

      text {
        color: #ffffff;
        font-size: 32rpx;
        font-weight: bold;
      }

      &:active {
        opacity: 0.9;
      }
    }
  }
</style>
