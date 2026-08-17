<template>
  <view class="search-popup-mask" v-if="visible" @click="close">
    <view class="search-popup-content" @click.stop>
      <view class="popup-header">
        <text class="popup-title">查药企&CRO合作关系</text>
        <view class="close-btn" @click="close">
          <icon type="clear" size="20" color="#D8D8D8" />
        </view>
      </view>

      <view class="tabs">
        <view
          class="tab-item"
          :class="{ active: currentTab === 'sponsor' }"
          @click="switchTab('sponsor')"
        >
          <text>查药企</text>
          <view class="active-line" v-if="currentTab === 'sponsor'"></view>
        </view>
        <view
          class="tab-item"
          :class="{ active: currentTab === 'thirdLab' }"
          @click="switchTab('thirdLab')"
        >
          <text>查Lab</text>
          <view class="active-line" v-if="currentTab === 'thirdLab'"></view>
        </view>
      </view>

      <view class="search-input-section">
        <view class="input-wrapper">
          <input
            type="text"
            v-model="searchKeyword"
            placeholder="输入及选择企业名称"
            placeholder-style="color: #B2B2B2"
            @input="onSearchInput"
          />
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

      <view class="search-btn" @click="handleSearch">
        <text>搜索</text>
      </view>
    </view>
  </view>
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

  // #region 状态
  const currentTab = ref<'sponsor' | 'thirdLab'>('sponsor')
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
      if (!val) {
        // 关闭时重置状态
        searchKeyword.value = ''
        searchResults.value = []
        showDropdown.value = false
        selectedCompany.value = null
      }
    }
  )
  // #endregion

  // #region 方法
  function close() {
    emit('update:visible', false)
  }

  function switchTab(tab: 'sponsor' | 'thirdLab') {
    if (currentTab.value === tab) return
    currentTab.value = tab
    searchKeyword.value = ''
    searchResults.value = []
    showDropdown.value = false
    selectedCompany.value = null
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

    if (currentTab.value === 'sponsor') {
      const id = company ? company.parentCompanyId : ''
      const name = company ? company.parentCompanyShortName : keyword
      const query = `sponsorParentCompanyId=${id}&companyName=${encodeURIComponent(name)}`
      uni.navigateTo({
        url: `/pages/sponsor-lab-stat/index?${query}`
      })
    } else {
      const id = company ? company.parentCompanyId : ''
      const name = company ? company.parentCompanyShortName : keyword
      const query = `partnerParentCompanyId=${id}&parentCompanyShortName=${encodeURIComponent(name)}`
      uni.navigateTo({
        url: `/pages/lab-stat/index?${query}`
      })
    }

    close()
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .search-popup-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999;
  }

  .search-popup-content {
    width: 600rpx;
    background: #ffffff;
    border-radius: 32rpx;
    padding: 40rpx;
    position: relative;

    .popup-header {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 40rpx;
      position: relative;

      .popup-title {
        font-size: 32rpx;
        font-weight: bold;
        color: #333333;
      }

      .close-btn {
        position: absolute;
        right: -10rpx;
        top: -10rpx;
        padding: 10rpx;
      }
    }

    .tabs {
      display: flex;
      justify-content: center;
      gap: 80rpx;
      margin-bottom: 40rpx;

      .tab-item {
        position: relative;
        font-size: 32rpx;
        color: #999999;
        padding-bottom: 12rpx;

        &.active {
          color: #333333;
          font-weight: bold;
        }

        .active-line {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 40rpx;
          height: 6rpx;
          background: #499ae6;
          border-radius: 3rpx;
        }
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

    .search-btn {
      width: 100%;
      height: 88rpx;
      background: linear-gradient(135deg, #60a8ff 0%, #499ae6 100%);
      border-radius: 16rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 8rpx 16rpx rgba(73, 154, 230, 0.3);

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
