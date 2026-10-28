<template>
  <bottom-sheet ref="sheetRef" :visible="visible" @close="close">
    <view class="search-popup-content">
      <!-- 头部：标题 + 副标题 + 关闭 -->
      <view class="modal-head-row">
        <view class="modal-title-wrap">
          <text class="modal-title">查药企&CRO</text>
          <text class="modal-sub">双向查药企与临床 CRO 合作记录</text>
        </view>
        <view class="modal-close" @click="close">
          <text>×</text>
        </view>
      </view>

      <!-- 查询方向切换 -->
      <view class="fc-mode">
        <view
          class="fc-mode-tab"
          :class="{ active: currentTab === 'sponsor' }"
          @click="switchTab('sponsor')"
        >
          <text>按药企查CRO</text>
        </view>
        <view
          class="fc-mode-tab"
          :class="{ active: currentTab === 'cro' }"
          @click="switchTab('cro')"
        >
          <text>按CRO查药企</text>
        </view>
      </view>

      <!-- 搜索框 + 确定 -->
      <view class="search-wrap">
        <view class="modal-search">
          <view class="search-ico"></view>
          <input
            type="text"
            :adjust-position="false"
            v-model="searchKeyword"
            :placeholder="
              currentTab === 'sponsor' ? '输入药企名称，如：百济神州' : '输入CRO名称，如：泰格医药'
            "
            placeholder-style="color: #9CA3AF"
            @input="onSearchInput"
            @keyboardheightchange="onKeyboardHeightChange"
          />
          <view class="modal-confirm" @click="handleSearch">
            <text>确定</text>
          </view>
        </view>

        <!-- 搜索下拉联想 -->
        <view class="search-dropdown" v-if="showDropdown">
          <view class="dropdown-loading" v-if="searchLoading">
            <text>加载中...</text>
          </view>
          <template v-else>
            <!-- 结果较多时可上下滚动 -->
            <scroll-view
              scroll-y
              class="dropdown-list"
              :show-scrollbar="false"
              :style="dropdownListStyle"
              v-if="searchResults.length > 0"
            >
              <view
                class="dropdown-item"
                v-for="item in searchResults"
                :key="item.parentCompanyId"
                @click="selectCompany(item)"
              >
                <text class="dropdown-name">{{ item.parentCompanyShortName }}</text>
              </view>
            </scroll-view>
            <view class="dropdown-empty" v-if="searchResults.length === 0">
              <text>未找到相关公司</text>
            </view>
          </template>
        </view>
      </view>

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
      </view>
      <!-- #endregion -->
    </view>
  </bottom-sheet>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, watch, computed } from 'vue'
  import { getParentShortNameList } from '@/api'
  import type { ParentCompanyItem } from '@/types/api'
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
  const currentTab = ref<'sponsor' | 'cro'>('sponsor')
  const searchKeyword = ref('')
  const searchResults = ref<ParentCompanyItem[]>([])
  const showDropdown = ref(false)
  const searchLoading = ref(false)
  const selectedCompany = ref<ParentCompanyItem | null>(null)
  let searchTimer: ReturnType<typeof setTimeout> | null = null

  // 下拉列表高度：单行约 88rpx，最多展示约 400rpx，超出可上下滚动
  const DROPDOWN_ITEM_HEIGHT = 88
  const DROPDOWN_MAX_HEIGHT = 400
  const dropdownListStyle = computed(() => {
    const count = searchResults.value.length
    const height = Math.min(count * DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT)
    return { height: `${height}rpx` }
  })
  // #endregion

  // #region 监听
  watch(
    () => props.visible,
    (val) => {
      if (val) {
        // 打开时读取当前 Tab 的最近搜索记录
        loadRecentList()
        return
      }
      // 关闭时重置状态
      searchKeyword.value = ''
      searchResults.value = []
      showDropdown.value = false
      selectedCompany.value = null
    }
  )
  // #endregion

  // #region 最近搜索记录
  const RECENT_MAX_COUNT = 10
  const recentList = ref<string[]>([])

  // 最近搜索记录按 Tab 分开存储
  function getRecentStorageKey() {
    return `searchCompanyCroRecent_${currentTab.value}`
  }

  function loadRecentList() {
    try {
      const data = uni.getStorageSync(getRecentStorageKey())
      recentList.value = Array.isArray(data) ? data.slice(0, RECENT_MAX_COUNT) : []
    } catch {
      recentList.value = []
    }
  }

  // 记录公司名：去重、最新的排前面、最多保留 10 条
  function saveRecent(name: string) {
    if (!name) return
    const list = [name, ...recentList.value.filter((item) => item !== name)].slice(
      0,
      RECENT_MAX_COUNT
    )
    recentList.value = list
    uni.setStorageSync(getRecentStorageKey(), list)
  }

  // 清空当前 Tab 的搜索历史
  function clearRecentList() {
    recentList.value = []
    uni.removeStorageSync(getRecentStorageKey())
  }

  // 点击历史记录：回填公司名并直接搜索
  function selectRecent(name: string) {
    searchKeyword.value = name
    selectedCompany.value = null
    showDropdown.value = false
    handleSearch()
  }
  // #endregion

  // #region 方法
  function close() {
    emit('update:visible', false)
  }

  function switchTab(tab: 'sponsor' | 'cro') {
    if (currentTab.value === tab) return
    currentTab.value = tab
    searchKeyword.value = ''
    searchResults.value = []
    showDropdown.value = false
    selectedCompany.value = null
    // 切换 Tab 后读取对应 Tab 的最近搜索记录
    loadRecentList()
  }

  function onSearchInput() {
    if (searchTimer) clearTimeout(searchTimer)
    selectedCompany.value = null // 输入时重置已选公司

    const keyword = searchKeyword.value.trim()
    if (!keyword) {
      searchResults.value = []
      showDropdown.value = false
      return
    }

    searchTimer = setTimeout(() => {
      fetchSearchResults()
    }, 300)
  }

  async function fetchSearchResults() {
    const keyword = searchKeyword.value.trim()
    if (!keyword) return

    searchLoading.value = true
    showDropdown.value = true

    try {
      const res = await getParentShortNameList({
        companyType: currentTab.value,
        pageNum: 1,
        pageSize: 20,
        shortName: keyword
      })
      searchResults.value = res.data?.list || []
    } catch {
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  function selectCompany(item: ParentCompanyItem) {
    searchKeyword.value = item.parentCompanyShortName
    selectedCompany.value = item
    showDropdown.value = false
  }

  function handleSearch() {
    if (!selectedCompany.value && !searchKeyword.value.trim()) {
      uni.showToast({
        title: '请输入并选择公司',
        icon: 'none'
      })
      return
    }

    // 如果用户输入了但没在下拉选，尝试使用当前输入的关键词（虽然逻辑上最好选下拉，但这里兼容下）
    const company = selectedCompany.value
    const keyword = searchKeyword.value.trim()
    const id = company ? company.parentCompanyId : ''
    const name = company ? company.parentCompanyShortName : keyword

    // 记录最近搜索
    saveRecent(name)

    if (currentTab.value === 'sponsor') {
      const query = `sponsorParentCompanyId=${id}&companyName=${encodeURIComponent(name)}`
      uni.navigateTo({
        url: `/pages/sponsor-stat/index?${query}`
      })
    } else {
      const query = `partnerParentCompanyId=${id}&parentCompanyShortName=${encodeURIComponent(name)}`
      uni.navigateTo({
        url: `/pages/cro-stat/index?${query}`
      })
    }

    close()
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .search-popup-content {
    width: 100%;
    min-height: 80vh;
    max-height: 86vh;
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

  /* #region 查询方向切换 */
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
  }
  /* #endregion */
</style>
