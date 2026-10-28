<template>
  <bottom-sheet ref="sheetRef" :visible="visible" @close="close">
    <view class="search-popup-content">
      <!-- 头部：标题 + 副标题 + 关闭 -->
      <view class="modal-head-row">
        <view class="modal-title-wrap">
          <text class="modal-title">查客户</text>
          <text class="modal-sub">输入药企名称，点击确定查看企业主页</text>
        </view>
        <view class="modal-close" @click="close">
          <text>×</text>
        </view>
      </view>

      <!-- 搜索框 + 确定 -->
      <view class="search-wrap">
        <view class="modal-search">
          <view class="search-ico"></view>
          <input
            type="text"
            :adjust-position="false"
            v-model="pharmaState.keyword"
            placeholder="输入药企名称"
            placeholder-style="color: #9CA3AF"
            @input="onSearchInput(pharmaState)"
            @keyboardheightchange="onKeyboardHeightChange"
          />
          <view class="modal-confirm" @click="handleSearch">
            <text>确定</text>
          </view>
        </view>

        <!-- 搜索下拉联想 -->
        <view class="search-dropdown" v-if="pharmaState.showDropdown">
          <view class="dropdown-loading" v-if="pharmaState.loading">
            <text>加载中...</text>
          </view>
          <template v-else>
            <!-- 结果较多时可上下滚动 -->
            <scroll-view
              scroll-y
              class="dropdown-list"
              :show-scrollbar="false"
              :style="dropdownListStyle(pharmaState.results.length)"
              v-if="pharmaState.results.length > 0"
            >
              <view
                class="dropdown-item"
                v-for="item in pharmaState.results"
                :key="item[pharmaState.keyField]"
                @click="selectItem(pharmaState, item)"
              >
                <text class="dropdown-name">{{ item[pharmaState.nameField] }}</text>
              </view>
            </scroll-view>
            <view class="dropdown-empty" v-if="pharmaState.results.length === 0">
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
          <view
            class="mh-chip"
            v-for="item in recentList"
            :key="item.id"
            @click="selectRecent(item)"
          >
            <text>{{ item.name }}</text>
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
  import { shallowReactive, ref, watch } from 'vue'
  import { queryPharmaShortName } from '@/api'
  import type { ParentCompanyItem } from '@/types/api'
  // #endregion

  // #region 类型定义
  type AnyItem = Record<string, any>

  interface SearchSectionState<T extends AnyItem = AnyItem> {
    keyword: string
    results: T[]
    showDropdown: boolean
    loading: boolean
    selected: T | null
    /** 列表项展示字段名 */
    nameField: keyof T & string
    /** 列表项唯一键字段名 */
    keyField: keyof T & string
    /** 查询接口 */
    api: (params: { pageNum?: number; pageSize?: number; searchKey?: string }) => Promise<{
      data?: { list?: T[] }
    }>
    timer: ReturnType<typeof setTimeout> | null
  }
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
  /**
   * 创建一个独立的搜索区块状态
   * @param nameField 列表项展示字段名
   * @param keyField 列表项唯一键字段名
   * @param api 该区块对应的查询接口
   */
  function createSectionState<T extends AnyItem>(
    nameField: string,
    keyField: string,
    api: SearchSectionState<T>['api']
  ): SearchSectionState<T> {
    return shallowReactive({
      keyword: '',
      results: [] as T[],
      showDropdown: false,
      loading: false,
      selected: null as T | null,
      nameField,
      keyField,
      api,
      timer: null
    })
  }

  // 药企申办方：queryPharmaShortName
  const pharmaState = createSectionState<ParentCompanyItem>(
    'parentCompanyShortName',
    'parentCompanyId',
    queryPharmaShortName
  )
  const sectionStates = [pharmaState]

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
        loadRecentList()
        return
      }
      // 关闭时重置所有搜索状态
      sectionStates.forEach((state) => {
        if (state.timer) clearTimeout(state.timer)
        state.timer = null
        state.keyword = ''
        state.results = []
        state.showDropdown = false
        state.selected = null
      })
    }
  )
  // #endregion

  // #region 最近搜索记录
  interface RecentCompany {
    id: number
    name: string
  }

  const RECENT_STORAGE_KEY = 'searchCustomerRecentList'
  const RECENT_MAX_COUNT = 10
  const recentList = ref<RecentCompany[]>([])

  function loadRecentList() {
    try {
      const data = uni.getStorageSync(RECENT_STORAGE_KEY)
      recentList.value = Array.isArray(data) ? data.slice(0, RECENT_MAX_COUNT) : []
    } catch {
      recentList.value = []
    }
  }

  // 记录企业：去重、最新的排前面、最多保留 10 条
  function saveRecent(company: RecentCompany) {
    if (!company.name) return
    const list = [company, ...recentList.value.filter((item) => item.id !== company.id)].slice(
      0,
      RECENT_MAX_COUNT
    )
    recentList.value = list
    uni.setStorageSync(RECENT_STORAGE_KEY, list)
  }

  // 清空最近搜索记录
  function clearRecentList() {
    recentList.value = []
    uni.removeStorageSync(RECENT_STORAGE_KEY)
  }

  // 点击历史记录：直接进入企业详情
  function selectRecent(company: RecentCompany) {
    saveRecent(company)
    uni.navigateTo({
      url: `/pages/customer/company-detail?companyId=${company.id}&companyName=${encodeURIComponent(company.name)}`
    })
    close()
  }
  // #endregion

  // #region 方法
  function close() {
    emit('update:visible', false)
  }

  function onSearchInput<T extends AnyItem>(state: SearchSectionState<T>) {
    if (state.timer) clearTimeout(state.timer)
    state.selected = null // 输入时重置已选

    const keyword = state.keyword.trim()
    if (!keyword) {
      state.results = []
      state.showDropdown = false
      return
    }

    state.timer = setTimeout(() => {
      fetchSearchResults(state)
    }, 300)
  }

  async function fetchSearchResults<T extends AnyItem>(state: SearchSectionState<T>) {
    const keyword = state.keyword.trim()
    if (!keyword) return

    state.loading = true
    state.showDropdown = true

    try {
      const res = await state.api({ pageNum: 1, pageSize: 20, searchKey: keyword })
      state.results = (res.data?.list || []) as T[]
    } catch {
      state.results = []
    } finally {
      state.loading = false
    }
  }

  function selectItem<T extends AnyItem>(state: SearchSectionState<T>, item: T) {
    state.keyword = String(item[state.nameField] ?? '')
    state.selected = item
    state.showDropdown = false
  }

  function handleSearch() {
    const pharma = pharmaState.selected

    if (!pharma) {
      uni.showToast({
        title: '请选择企业',
        icon: 'none'
      })
      return
    }

    const query: string[] = []
    if (pharma) {
      query.push(`companyId=${pharma.parentCompanyId}`)
      query.push(`companyName=${encodeURIComponent(pharma.parentCompanyShortName)}`)
      // 记录最近搜索
      saveRecent({ id: pharma.parentCompanyId, name: pharma.parentCompanyShortName })
    }

    uni.navigateTo({
      url: `/pages/customer/company-detail?${query.join('&')}`
    })

    close()
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .search-popup-content {
    width: 100%;
    min-height: 35vh;
    max-height: 86vh;
    background: #ffffff;
    border-radius: 40rpx 40rpx 0 0;
    padding: 56rpx 32rpx calc(28rpx + env(safe-area-inset-bottom));
    position: relative;
    box-sizing: border-box;
    overflow-y: auto;
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
      display: flex;
      flex-direction: column;
      align-items: center;
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
