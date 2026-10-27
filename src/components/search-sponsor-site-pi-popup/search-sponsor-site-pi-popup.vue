<template>
  <bottom-sheet :visible="visible" @close="close">
    <view class="search-popup-content">
      <!-- 头部：标题 + 副标题 + 关闭 -->
      <view class="modal-head-row">
        <view class="modal-title-wrap">
          <text class="modal-title">查药企&医院</text>
          <text class="modal-sub">查药企合作医院及临床试验数</text>
        </view>
        <view class="modal-close" @click="close">
          <text>×</text>
        </view>
      </view>

      <!-- 药企名称搜索 -->
      <view class="search-wrap">
        <view class="modal-search">
          <view class="search-ico"></view>
          <input
            type="text"
            v-model="keyword"
            placeholder="输入药企名称，如：百济神州"
            placeholder-style="color: #9CA3AF"
            @input="onSearchInput"
          />
          <view class="modal-confirm" @click="handleSearch">
            <text>查询</text>
          </view>
        </view>

        <!-- 搜索下拉联想 -->
        <view class="search-dropdown" v-if="showDropdown">
          <view class="dropdown-loading" v-if="loading">
            <text>加载中...</text>
          </view>
          <template v-else>
            <!-- 结果较多时可上下滚动 -->
            <scroll-view
              scroll-y
              class="dropdown-list"
              :show-scrollbar="false"
              :style="dropdownListStyle(results.length)"
              v-if="results.length > 0"
            >
              <view
                class="dropdown-item"
                v-for="item in results"
                :key="item.parentCompanyId"
                @click="selectItem(item)"
              >
                <text class="dropdown-name">{{ item.parentCompanyShortName }}</text>
              </view>
            </scroll-view>
            <view class="dropdown-empty" v-if="results.length === 0">
              <text>未找到相关公司</text>
            </view>
          </template>
        </view>
      </view>

      <!-- 搜索历史 -->
      <view class="modal-history">
        <view class="mh-head">
          <text class="mh-title">搜索历史</text>
          <text class="mh-clear" v-if="recentList.length > 0" @click="clearRecentList">清空</text>
        </view>
        <view class="mh-chips" v-if="recentList.length > 0">
          <view
            class="mh-chip"
            v-for="item in recentList"
            :key="item.parentCompanyId"
            @click="selectRecent(item)"
          >
            <text>{{ item.parentCompanyShortName }}</text>
          </view>
        </view>
        <view class="mh-empty" v-else>
          <view class="mh-empty-ico"><view class="search-ico"></view></view>
          <text>暂无搜索记录</text>
        </view>
        <view class="modal-history-divider"></view>
      </view>
    </view>
  </bottom-sheet>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, watch } from 'vue'
  import { queryPharmaShortName } from '@/api'
  import type { ParentCompanyItem } from '@/types/api'
  // #endregion

  // #region 属性与事件
  const props = defineProps<{
    visible: boolean
  }>()

  const emit = defineEmits(['update:visible'])
  // #endregion

  // #region 状态
  const keyword = ref('')
  const results = ref<ParentCompanyItem[]>([])
  const showDropdown = ref(false)
  const loading = ref(false)
  // 当前选中的药企，未选中时不允许查询
  const selected = ref<ParentCompanyItem | null>(null)
  let timer: ReturnType<typeof setTimeout> | null = null
  // #endregion

  // #region 搜索联想
  function onSearchInput() {
    if (timer) clearTimeout(timer)
    selected.value = null // 输入时重置已选

    const kw = keyword.value.trim()
    if (!kw) {
      results.value = []
      showDropdown.value = false
      return
    }

    timer = setTimeout(() => {
      fetchCompanies()
    }, 300)
  }

  async function fetchCompanies() {
    const kw = keyword.value.trim()
    if (!kw) return

    loading.value = true
    showDropdown.value = true

    try {
      const res = await queryPharmaShortName({
        pageNum: 1,
        pageSize: 20,
        searchKey: kw
      })
      results.value = res.data?.list || []
    } catch {
      results.value = []
    } finally {
      loading.value = false
    }
  }

  function selectItem(item: ParentCompanyItem) {
    keyword.value = item.parentCompanyShortName
    selected.value = item
    showDropdown.value = false
  }
  // #endregion

  // #region 查询
  function handleSearch() {
    if (timer) clearTimeout(timer)
    showDropdown.value = false

    const company = selected.value
    if (!company) {
      uni.showToast({
        title: '请选择药企',
        icon: 'none'
      })
      return
    }

    saveRecent(company)
    gotoHospitalList(company)
  }

  /** 进入「合作医院」中间页，由该页再下钻到医院合作情况统计页 */
  function gotoHospitalList(company: ParentCompanyItem) {
    uni.navigateTo({
      url: `/pages/sponsor-hospital-list/index?companyParentId=${
        company.parentCompanyId
      }&companyName=${encodeURIComponent(company.parentCompanyShortName)}`
    })
    close()
  }
  // #endregion

  // #region 最近搜索记录
  const RECENT_STORAGE_KEY = 'searchSponsorHospitalRecentList'
  const RECENT_MAX_COUNT = 10
  const recentList = ref<ParentCompanyItem[]>([])

  function loadRecentList() {
    try {
      const data = uni.getStorageSync(RECENT_STORAGE_KEY)
      const list: ParentCompanyItem[] = Array.isArray(data)
        ? data.filter((item: any) => item && typeof item === 'object' && item.parentCompanyId)
        : []
      recentList.value = list.slice(0, RECENT_MAX_COUNT)
    } catch {
      recentList.value = []
    }
  }

  // 记录搜索药企：去重、最新的排前面、最多保留 10 条
  function saveRecent(item: ParentCompanyItem) {
    const list = [
      item,
      ...recentList.value.filter((record) => record.parentCompanyId !== item.parentCompanyId)
    ].slice(0, RECENT_MAX_COUNT)
    recentList.value = list
    uni.setStorageSync(RECENT_STORAGE_KEY, list)
  }

  // 清空搜索历史
  function clearRecentList() {
    recentList.value = []
    uni.removeStorageSync(RECENT_STORAGE_KEY)
  }

  // 点击历史记录：直接查询该药企的合作医院
  function selectRecent(item: ParentCompanyItem) {
    keyword.value = item.parentCompanyShortName
    selected.value = item
    showDropdown.value = false
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

  function close() {
    emit('update:visible', false)
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
      // 关闭时重置搜索状态
      if (timer) clearTimeout(timer)
      timer = null
      keyword.value = ''
      results.value = []
      showDropdown.value = false
      selected.value = null
    }
  )
  // #endregion
</script>

<style lang="scss" scoped>
  .search-popup-content {
    width: 100%;
    min-height: 70vh;
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
