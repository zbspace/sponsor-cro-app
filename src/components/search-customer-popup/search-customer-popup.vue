<template>
  <bottom-sheet :visible="visible" @close="close">
    <view class="search-popup-content">
      <view class="popup-header">
        <text class="popup-title">我的客户</text>
        <view class="close-btn" @click="close">
          <image class="close-icon" src="../../static/icons/close.png" mode="aspectFit" />
        </view>
      </view>

      <!-- 企业 -->
      <view class="search-input-section">
        <view class="input-wrapper">
          <input
            type="text"
            v-model="pharmaState.keyword"
            placeholder="输入及选择企业名称"
            placeholder-style="color: #B2B2B2"
            @input="onSearchInput(pharmaState)"
          />
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

      <!-- #region 最近搜索记录 -->
      <view class="recent-section" v-if="recentList.length > 0">
        <text class="recent-label">最近搜索记录：</text>
        <view class="recent-list">
          <view
            class="recent-item"
            v-for="item in recentList"
            :key="item.id"
            @click="selectRecent(item)"
          >
            <text>{{ item.name }}</text>
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
    min-height: 70vh;
    max-height: 86vh;
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

    .search-input-section {
      position: relative;
      margin-bottom: 60rpx;

      .input-wrapper {
        background: #f7f8fa;
        border-radius: 16rpx;
        height: 88rpx;
        padding: 0 30rpx;
        display: flex;
        align-items: center;

        input {
          flex: 1;
          font-size: 28rpx;
          color: #333333;
        }
      }

      .search-dropdown {
        position: absolute;
        top: 96rpx;
        left: 0;
        right: 0;
        background: #ffffff;
        border-radius: 12rpx;
        box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
        z-index: 10;
        max-height: 400rpx;
        overflow-y: auto;

        // 滚动列表
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

    // 最近搜索记录
    .recent-section {
      margin-bottom: 30rpx;

      .recent-label {
        font-size: 26rpx;
        color: #4096ee;
      }

      .recent-list {
        display: flex;
        flex-wrap: wrap;
        margin-top: 20rpx;
      }

      .recent-item {
        padding: 10rpx 24rpx;
        margin: 0 20rpx 20rpx 0;
        border: 1rpx solid #d9d9d9;
        border-radius: 8rpx;

        text {
          font-size: 26rpx;
          color: #333333;
        }

        &:active {
          background: #f7f8fa;
        }
      }
    }

    .search-btn {
      width: 100%;
      height: 92rpx;
      margin-top: 8rpx;
      background: linear-gradient(135deg, #3d7bff 0%, #1e5fff 100%);
      border-radius: 46rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 16rpx 36rpx rgba(30, 95, 255, 0.3);

      text {
        color: #ffffff;
        font-size: 32rpx;
        font-weight: 600;
      }

      &:active {
        background: linear-gradient(135deg, #2f6bef 0%, #1553ee 100%);
      }
    }
  }
</style>
