<template>
  <view class="search-popup-mask" v-if="visible" @click="close">
    <view class="search-popup-content" @click.stop>
      <view class="popup-header">
        <text class="popup-title">查药企&医院/研究者合作关系</text>
        <view class="close-btn" @click="close">
          <icon type="clear" size="20" color="#D8D8D8" />
        </view>
      </view>

      <!-- 药企申办方 -->
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

      <!-- 医院 -->
      <view class="search-input-section">
        <view class="input-wrapper">
          <input
            type="text"
            v-model="hospitalState.keyword"
            placeholder="输入及选择医院名称"
            placeholder-style="color: #B2B2B2"
            @input="onSearchInput(hospitalState)"
          />
        </view>

        <!-- 搜索下拉联想 -->
        <view class="search-dropdown" v-if="hospitalState.showDropdown">
          <view class="dropdown-loading" v-if="hospitalState.loading">
            <text>加载中...</text>
          </view>
          <template v-else>
            <!-- 结果较多时可上下滚动 -->
            <scroll-view
              scroll-y
              class="dropdown-list"
              :show-scrollbar="false"
              :style="dropdownListStyle(hospitalState.results.length)"
              v-if="hospitalState.results.length > 0"
            >
              <view
                class="dropdown-item"
                v-for="item in hospitalState.results"
                :key="item[hospitalState.keyField]"
                @click="selectItem(hospitalState, item)"
              >
                <text class="dropdown-name">{{ item[hospitalState.nameField] }}</text>
              </view>
            </scroll-view>
            <view class="dropdown-empty" v-if="hospitalState.results.length === 0">
              <text>未找到相关医院</text>
            </view>
          </template>
        </view>
      </view>

      <!-- 研究者 -->
      <view class="search-input-section">
        <view class="input-wrapper">
          <input
            type="text"
            v-model="researcherState.keyword"
            placeholder="输入及选择研究者姓名"
            placeholder-style="color: #B2B2B2"
            @input="onSearchInput(researcherState)"
          />
        </view>

        <!-- 搜索下拉联想 -->
        <view class="search-dropdown" v-if="researcherState.showDropdown">
          <view class="dropdown-loading" v-if="researcherState.loading">
            <text>加载中...</text>
          </view>
          <template v-else>
            <!-- 结果较多时可上下滚动 -->
            <scroll-view
              scroll-y
              class="dropdown-list"
              :show-scrollbar="false"
              :style="dropdownListStyle(researcherState.results.length)"
              v-if="researcherState.results.length > 0"
            >
              <view
                class="dropdown-item"
                v-for="item in researcherState.results"
                :key="item[researcherState.keyField]"
                @click="selectItem(researcherState, item)"
              >
                <text class="dropdown-name">{{ item[researcherState.nameField] }}</text>
              </view>
            </scroll-view>
            <view class="dropdown-empty" v-if="researcherState.results.length === 0">
              <text>未找到相关研究者</text>
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
  import { shallowReactive, watch } from 'vue'
  import { queryPharmaShortName, queryHospitalData, queryResearcherData } from '@/api'
  import type { ParentCompanyItem, HospitalItem, ResearcherItem } from '@/types/api'
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
    api: (params: {
      id?: number
      pageNum?: number
      pageSize?: number
      searchKey?: string
    }) => Promise<{
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
  // 医院：queryHospitalData
  const hospitalState = createSectionState<HospitalItem>(
    'hosStandardName',
    'hosStandardId',
    queryHospitalData
  )
  // 研究者：queryResearcherData
  const researcherState = createSectionState<ResearcherItem>(
    'researcherName',
    'researcherId',
    queryResearcherData
  )

  const sectionStates = [pharmaState, hospitalState, researcherState]

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
      if (!val) {
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
    }
  )
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
      const params: { id?: number; pageNum?: number; pageSize?: number; searchKey?: string } = {
        pageNum: 1,
        pageSize: 20,
        searchKey: keyword
      }
      // 研究者查询需携带所选医院的 id
      if (
        state === (researcherState as unknown as SearchSectionState<T>) &&
        hospitalState.selected
      ) {
        params.id = hospitalState.selected.hosStandardId
      }
      const res = await state.api(params)
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
    const hospital = hospitalState.selected
    const researcher = researcherState.selected

    if (!pharma) {
      uni.showToast({
        title: '请选择药企申办方',
        icon: 'none'
      })
      return
    }
    if (!hospital) {
      uni.showToast({
        title: '请选择医院',
        icon: 'none'
      })
      return
    }

    // 携带已选中的参数跳转到医院/研究者合作统计页
    const query: string[] = []
    if (pharma) {
      query.push(`companyParentId=${pharma.parentCompanyId}`)
      query.push(`companyName=${encodeURIComponent(pharma.parentCompanyShortName)}`)
    }
    if (hospital) {
      query.push(`hosStandardId=${hospital.hosStandardId}`)
      query.push(`hosStandardName=${encodeURIComponent(hospital.hosStandardName)}`)
    }
    if (researcher) {
      query.push(`researcherId=${researcher.researcherId}`)
      query.push(`researcherName=${encodeURIComponent(researcher.researcherName)}`)
    }

    uni.navigateTo({
      url: `/pages/hospital-stat/index?${query.join('&')}`
    })

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
