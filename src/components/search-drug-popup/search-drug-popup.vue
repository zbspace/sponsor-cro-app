<template>
  <bottom-sheet :visible="visible" @close="close">
    <view class="search-popup-content">
      <!-- 药品搜索 -->
      <template v-if="!showCompanyList">
        <view class="popup-header">
          <text class="popup-title">查药品</text>
          <view class="close-btn" @click="close">
            <image class="close-icon" src="../../static/icons/close.png" mode="aspectFit" />
          </view>
        </view>

        <!-- 药品 -->
        <view class="search-input-section">
          <view class="input-wrapper">
            <input
              type="text"
              v-model="drugState.keyword"
              placeholder="输入及选择药品"
              placeholder-style="color: #B2B2B2"
              @input="onSearchInput"
            />
          </view>

          <!-- 搜索下拉联想 -->
          <view class="search-dropdown" v-if="drugState.showDropdown">
            <view class="dropdown-loading" v-if="drugState.loading">
              <text>加载中...</text>
            </view>
            <template v-else>
              <!-- 结果较多时可上下滚动 -->
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

        <!-- #region 最近搜索记录 -->
        <view class="recent-section" v-if="recentList.length > 0">
          <text class="recent-label">最近搜索记录：</text>
          <view class="recent-list">
            <view
              class="recent-item"
              v-for="item in recentList"
              :key="item.cleanedDrugName"
              @click="selectRecent(item)"
            >
              <text>{{ item.cleanedDrugName }}</text>
            </view>
          </view>
        </view>
        <!-- #endregion -->

        <view class="search-btn" @click="handleSearch">
          <text>搜索</text>
        </view>
      </template>

      <!-- 相关企业列表 -->
      <template v-else>
        <view class="popup-header company-header">
          <view class="back-btn" @click="backToDrug">
            <text>‹</text>
          </view>
          <text class="popup-title">选择相关企业</text>
        </view>

        <view class="company-loading" v-if="companyLoading">
          <text>加载中...</text>
        </view>
        <template v-else>
          <scroll-view
            scroll-y
            class="company-list"
            :show-scrollbar="false"
            v-if="companyList.length > 0"
          >
            <view class="company-table">
              <view class="table-row table-head">
                <view class="col-index"><text>序号</text></view>
                <view class="col-company"><text>企业</text></view>
              </view>
              <view
                class="table-row"
                v-for="(item, index) in companyList"
                :key="item.parentCompanyId"
                @click="selectCompany(item)"
              >
                <view class="col-index">
                  <text>{{ index + 1 }}</text>
                </view>
                <view class="col-company">
                  <text>{{ item.parentCompanyShortName || item.companyStandardName }}</text>
                </view>
              </view>
            </view>
          </scroll-view>
          <view class="company-empty" v-if="companyList.length === 0">
            <text>未找到相关企业</text>
          </view>
        </template>
      </template>
    </view>
  </bottom-sheet>
</template>

<script setup lang="ts">
  // #region 导入
  import { shallowReactive, ref, watch } from 'vue'
  import { queryCleanedDrugName, queryParentCompanyByDrugName } from '@/api'
  import type { CleanedDrugItem, CompanyShortItem } from '@/types/api'
  // #endregion

  // #region 类型定义
  interface DrugSearchState {
    keyword: string
    results: CleanedDrugItem[]
    showDropdown: boolean
    loading: boolean
    selected: CleanedDrugItem | null
    timer: ReturnType<typeof setTimeout> | null
  }
  // #endregion

  // #region 属性与事件
  const props = defineProps<{
    visible: boolean
  }>()

  const emit = defineEmits(['update:visible'])
  // #endregion

  // #region 药品搜索
  const drugState = shallowReactive<DrugSearchState>({
    keyword: '',
    results: [],
    showDropdown: false,
    loading: false,
    selected: null,
    timer: null
  })

  function onSearchInput() {
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

  // #region 相关企业列表
  const showCompanyList = ref(false)
  const companyLoading = ref(false)
  const companyList = ref<CompanyShortItem[]>([])
  // 当前搜索的药品名，用于企业查询与跳转
  const currentDrugName = ref('')

  // 第一步：按药品名查询相关企业
  async function handleSearch() {
    const drugName = (drugState.selected?.cleanedDrugName || drugState.keyword).trim()
    if (!drugName) {
      uni.showToast({
        title: '请选择药品',
        icon: 'none'
      })
      return
    }

    if (drugState.timer) clearTimeout(drugState.timer)
    drugState.showDropdown = false
    currentDrugName.value = drugName
    saveRecent(drugState.selected || { cleanedDrugName: drugName })

    // 第二步：展示相关企业列表
    showCompanyList.value = true
    companyList.value = []
    companyLoading.value = true

    try {
      const res = await queryParentCompanyByDrugName({
        pageNum: 1,
        pageSize: 50,
        searchKey: drugName
      })
      companyList.value = res.data?.list || []
    } catch {
      companyList.value = []
    } finally {
      companyLoading.value = false
    }
  }

  function backToDrug() {
    showCompanyList.value = false
    companyList.value = []
    companyLoading.value = false
  }

  // 第三步：选择企业后进入药品统计主页
  function selectCompany(company: CompanyShortItem) {
    const drug = drugState.selected
    const query = [
      `drugStandardName=${encodeURIComponent(currentDrugName.value)}`,
      `parentCompanyId=${company.parentCompanyId ?? ''}`,
      `standardCompanyName=${encodeURIComponent(company.parentCompanyShortName || '')}`,
      `cleanedDrugType=${encodeURIComponent(drug?.drugType || '')}`,
      `cleanedClassification=${encodeURIComponent((drug?.registrationCategoryList || []).join('、'))}`
    ]

    uni.navigateTo({
      url: `/pages/drug-stat/index?${query.join('&')}`
    })

    close()
  }
  // #endregion

  // #region 最近搜索记录
  const RECENT_STORAGE_KEY = 'searchDrugRecentList'
  const RECENT_MAX_COUNT = 10
  const recentList = ref<CleanedDrugItem[]>([])

  function loadRecentList() {
    try {
      const data = uni.getStorageSync(RECENT_STORAGE_KEY)
      // 兼容旧版本仅存药品名的记录
      const list: CleanedDrugItem[] = Array.isArray(data)
        ? data.filter((item: any) => item && typeof item === 'object')
        : []
      recentList.value = list.slice(0, RECENT_MAX_COUNT)
    } catch {
      recentList.value = []
    }
  }

  // 记录搜索药品信息：去重、最新的排前面、最多保留 10 条
  function saveRecent(item: CleanedDrugItem) {
    const list = [
      item,
      ...recentList.value.filter((record) => record.cleanedDrugName !== item.cleanedDrugName)
    ].slice(0, RECENT_MAX_COUNT)
    recentList.value = list
    uni.setStorageSync(RECENT_STORAGE_KEY, list)
  }

  // 点击历史记录：回填药品信息并直接查询相关企业
  function selectRecent(item: CleanedDrugItem) {
    drugState.keyword = item.cleanedDrugName
    drugState.selected = item
    drugState.showDropdown = false
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
      // 关闭时重置药品与企业列表状态
      if (drugState.timer) clearTimeout(drugState.timer)
      drugState.timer = null
      drugState.keyword = ''
      drugState.results = []
      drugState.showDropdown = false
      drugState.selected = null
      backToDrug()
      currentDrugName.value = ''
    }
  )
  // #endregion
</script>

<style lang="scss" scoped>
  .search-popup-content {
    width: 100%;
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

    // 相关企业列表头部返回按钮
    .company-header {
      .back-btn {
        position: absolute;
        left: -10rpx;
        top: -14rpx;
        padding: 10rpx;

        text {
          font-size: 52rpx;
          line-height: 52rpx;
          color: #293959;
        }
      }
    }

    .search-input-section {
      position: relative;
      margin-bottom: 30rpx;

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
      width: 266rpx;
      height: 100rpx;
      background: linear-gradient(90deg, #4295f3 0%, #2b66ef 100%);
      border-radius: 20rpx 20rpx 20rpx 20rpx;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto;

      text {
        color: #ffffff;
        font-size: 32rpx;
        font-weight: bold;
      }

      &:active {
        opacity: 0.9;
      }
    }

    // 相关企业列表
    .company-list {
      max-height: 640rpx;

      .company-table {
        border: 1rpx solid #4096ee;
        border-bottom: none;
      }

      .table-row {
        display: flex;
        align-items: center;
        height: 88rpx;
        border-bottom: 1rpx solid #4096ee;

        &.table-head {
          background: #4096ee;

          text {
            color: #ffffff;
            font-weight: bold;
          }
        }

        .col-index {
          width: 140rpx;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          border-right: 1rpx solid #4096ee;

          text {
            font-size: 26rpx;
            color: #333333;
          }
        }

        .col-company {
          flex: 1;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 16rpx;
          overflow: hidden;

          text {
            font-size: 26rpx;
            color: #333333;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
        }
      }
    }

    .company-loading,
    .company-empty {
      padding: 60rpx 0;
      text-align: center;
      font-size: 26rpx;
      color: #999999;
    }
  }
</style>
