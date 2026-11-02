<!-- 商机线索 -->
<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon visibility-hidden">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">{{ '商机线索' }}</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

  <!-- #region 免费领VIP -->
  <view class="free-vip-banner-container" v-if="userInfo?.vipCode === VIP_CODE.普通">
    <free-vip-banner
      :visible="showFreeVipBanner"
      @apply="handleBannerApply"
      @close="showFreeVipBanner = false"
      @success="fetchVipApplicationStatus"
    />
  </view>

  <!-- 查询公司 -->
  <view class="search-input-section">
    <view class="input-wrapper">
      <icon type="search" size="18" color="#B2B2B2" class="search-icon" />
      <input
        type="text"
        v-model="searchKeyword"
        placeholder="搜索企业名称"
        placeholder-style="color: #B2B2B2"
        @input="onSearchInput"
      />
      <text class="clear-icon" v-if="searchKeyword" @click="clearSearchKeyword">×</text>
      <view class="search-go" @click="handleSearchClick">
        <text>搜索</text>
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
            :key="item.standardId"
            @click="selectCompany(item)"
          >
            <text class="dropdown-name">{{ item.companyStandardName }}</text>
          </view>
        </scroll-view>
        <view class="dropdown-empty" v-if="searchResults.length === 0">
          <text>未找到相关公司</text>
        </view>
      </template>
    </view>
  </view>

  <!-- #region 筛选行：线索类型 / 登记时间 -->
  <view class="lead-filter-row">
    <view
      class="lead-filter-btn"
      :class="{ on: typePicked, open: activeFilter === 'type' }"
      @click="toggleFilter('type')"
    >
      <text class="lead-filter-val">{{ typeLabel }}</text>
      <view class="lead-filter-arrow"></view>
    </view>
    <view
      class="lead-filter-btn"
      :class="{ on: timeDays > 0, open: activeFilter === 'time' }"
      @click="toggleFilter('time')"
    >
      <text class="lead-filter-val">{{ timeLabel }}</text>
      <view class="lead-filter-arrow"></view>
    </view>

    <!-- 下拉选项面板 -->
    <view
      class="cb-dropdown"
      :class="activeFilter === 'type' ? 'align-left' : 'align-right'"
      v-if="activeFilter"
    >
      <view
        class="cb-opt"
        v-for="option in activeOptions"
        :key="option.value"
        :class="{ active: option.value === activeValue }"
        @click="handleFilterSelect(option.value)"
      >
        <text>{{ option.label }}</text>
      </view>
    </view>
  </view>
  <!-- #endregion -->

  <!-- 下拉蒙层：点击收起 -->
  <view class="filter-mask" v-if="activeFilter" @click="activeFilter = null"></view>

  <!-- #region 结果条 -->
  <view class="lead-result-bar">
    <text class="lrb-count">共 {{ resultCount }} 条</text>
    <text class="lrb-sum">{{ filterSummary }}</text>
    <text class="lrb-reset" v-if="filterSummary && visibleList.length > 0" @click="clearFilters">
      清空筛选
    </text>
  </view>
  <!-- #endregion -->

  <scroll-view
    scroll-y
    class="container-scroll-view"
    :show-scrollbar="false"
    lower-threshold="100"
    @scrolltolower="loadMore"
    :style="{
      height: `calc(100vh - ${menu.top}px - ${menu.height}px - 200px)`
    }"
  >
    <view class="container">
      <!-- 列表内容 -->
      <view class="list-container">
        <view class="lead-card" v-for="(item, index) in visibleList" :key="index">
          <!-- 药品名称 + 分类/分期 -->
          <view class="lead-head">
            <text class="lead-drug">{{ item.drugStandardName }}</text>
            <text class="tag tag-lead" v-if="item.cleanedClassificationOrStages">
              {{ item.cleanedClassificationOrStages }}
            </text>
            <view class="lead-tags">
              <text class="tag" :class="getDrugTypeClass(item)" v-if="item.cleanedDrugType">
                {{ item.cleanedDrugType }}
              </text>
              <text class="tag tag-amber" v-if="item.ndaPriorityApproval">
                {{ item.ndaPriorityApproval }}
              </text>
            </view>
          </view>

          <!-- 字段信息 -->
          <view class="lead-fields">
            <view class="lf" v-for="row in getFieldRows(item)" :key="row.label">
              <text class="lf-label">{{ row.label }}：</text>
              <text class="lf-value">{{ row.value || '—' }}</text>
              <text class="tag tag-fresh" v-if="row.fresh">{{ row.fresh }}</text>
              <text class="lf-note" v-if="row.note">{{ row.note }}</text>
            </view>
          </view>

          <!-- 商机线索 -->
          <view class="lead-tip">
            <text class="tip-label">商机线索：</text>
            <text>{{ item.businessClueText }}</text>
          </view>
        </view>

        <!-- 空态 -->
        <view class="lead-empty" v-if="!loading && visibleList.length === 0">
          <view class="lead-empty-icon"></view>
          <text class="lead-empty-title">没有符合条件的线索</text>
          <text class="lead-empty-desc">换个关键词或筛选条件，或清空筛选看看全部线索</text>
          <text class="lead-empty-reset" @click="clearFilters">清空筛选</text>
        </view>

        <!-- 加载状态 -->
        <view class="load-more" v-if="loading || (finished && visibleList.length > 0)">
          <text v-if="loading">加载中...</text>
          <text v-else>没有更多了</text>
        </view>
      </view>
    </view>
  </scroll-view>

  <phone-bind-popup />

  <!-- 底部导航 -->
  <tab-bar active="opportunity" />
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, reactive, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import {
    getAfterListingBusinessClueList,
    getBeforeListingBusinessClueList,
    queryStandardCompany,
    refreshUserDetail,
    getUserInfo
  } from '@/api'
  import type { OpportunityVo, OpportunityParam, StandardCompanyItem } from '@/types/api'
  import { VIP_CODE, APPLY_STATUS } from '@/utils/enums'
  import FreeVipBanner from '@/components/free-vip-banner/free-vip-banner.vue'
  import TabBar from '@/components/tab-bar/index.vue'
  // #endregion

  // #region 页面基础状态与生命周期
  const menu = ref({ top: 0, left: 0, height: 0 })
  const companyName = ref('')
  const companyId = ref()
  // 先用本地缓存渲染，登录完成后刷新为最新用户信息
  const userInfo = ref(getUserInfo())

  const goBack = () => {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  onLoad((options: any) => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info

    if (options?.companyName) {
      companyName.value = decodeURIComponent(options.companyName)
    }
    if (options?.companyId) {
      companyId.value = Number(options.companyId)
    }
    if (options?.type) {
      type.value = options.type as ClueType
    }

    fetchList()
    fetchVipApplicationStatus()
  })
  // #endregion

  // #region 线索列表加载逻辑
  // 接口命名与线索类型相反：上市前 -> getBeforeListingBusinessClueList，上市后 -> getAfterListingBusinessClueList
  type ClueType = 'before' | 'after'
  /** 筛选维度：全部 / I期·II期·III期（上市前）/ IV期·IIT（上市后） */
  type LeadType = 'all' | ClueType

  interface FilterOption {
    value: string | number
    label: string
  }

  const LEAD_TYPE_OPTS: FilterOption[] = [
    { value: 'all', label: '全部类型' },
    { value: 'before', label: 'I期/II期/III期' },
    { value: 'after', label: 'IV期/IIT' }
  ]

  const LEAD_TIME_OPTS: FilterOption[] = [
    { value: 0, label: '全部时间' },
    { value: 7, label: '近1周' },
    { value: 30, label: '近1个月' },
    { value: 90, label: '近3个月' },
    { value: 180, label: '近6个月' },
    { value: 365, label: '近1年' }
  ]

  const type = ref<LeadType>('all')
  const timeDays = ref(0)
  const activeFilter = ref<'type' | 'time' | null>(null)

  /** 基准日（只到日），卡片时效标签与登记时间筛选共用同一口径 */
  const LEAD_REF = (() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  })()

  /** 日期距今天数，无有效日期返回 null */
  function daysFromToday(date: string) {
    if (!date) return null
    const [year, month, day] = date.split('-').map(Number)
    if (!year || !month || !day) return null
    return Math.max(0, Math.floor((LEAD_REF - new Date(year, month - 1, day).getTime()) / 86400000))
  }

  /** 时效档位标签，超过 1 年不展示 */
  function freshLabel(date: string) {
    const days = daysFromToday(date)
    if (days === null) return ''
    if (days <= 7) return '近1周'
    if (days <= 30) return '近1个月'
    if (days <= 90) return '近3个月'
    if (days <= 180) return '近6个月'
    if (days <= 365) return '近1年'
    return ''
  }

  const feeds = reactive<Record<ClueType, OpportunityVo[]>>({ before: [], after: [] })
  const feedMeta = reactive<Record<ClueType, { pageNum: number; finished: boolean }>>({
    before: { pageNum: 1, finished: false },
    after: { pageNum: 1, finished: false }
  })
  const typeCounts = ref<Record<ClueType, number>>({ before: 0, after: 0 })
  const loading = ref(false)
  const pageSize = 10

  /** 当前筛选已加载的原始列表 */
  const list = computed<OpportunityVo[]>(() =>
    type.value === 'all' ? [...feeds.before, ...feeds.after] : feeds[type.value]
  )

  /** 当前筛选命中的接口类型 */
  const targetTypes = computed<ClueType[]>(() =>
    type.value === 'all' ? (['before', 'after'] as ClueType[]) : ([type.value] as ClueType[])
  )

  /** 当前筛选是否已加载完毕 */
  const finished = computed(() => targetTypes.value.every((t) => feedMeta[t].finished))

  function getListApi(target: ClueType) {
    return target === 'before' ? getBeforeListingBusinessClueList : getAfterListingBusinessClueList
  }

  /** 清空已加载数据并复位分页与计数 */
  function resetFeeds() {
    feeds.before = []
    feeds.after = []
    feedMeta.before = { pageNum: 1, finished: false }
    feedMeta.after = { pageNum: 1, finished: false }
    typeCounts.value = { before: 0, after: 0 }
  }

  async function fetchList() {
    if (loading.value) return
    const pending = targetTypes.value.filter((t) => !feedMeta[t].finished)
    if (!pending.length) return
    loading.value = true

    try {
      const resList = await Promise.all(
        pending.map((t) =>
          getListApi(t)({
            pageNum: feedMeta[t].pageNum,
            pageSize,
            parentCompanyId: companyId.value
          } as OpportunityParam)
        )
      )

      pending.forEach((t, i) => {
        const data = resList[i].data
        if (!data) {
          feedMeta[t].finished = true
          return
        }
        const newList = data.list || []
        feeds[t] = [...feeds[t], ...newList]
        typeCounts.value[t] = data.total || 0
        if (newList.length < pageSize || feedMeta[t].pageNum >= data.pages) {
          feedMeta[t].finished = true
        }
      })
    } catch (error) {
      console.error('获取列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  function loadMore() {
    if (loading.value) return
    targetTypes.value.forEach((t) => {
      if (!feedMeta[t].finished) feedMeta[t].pageNum++
    })
    fetchList()
  }

  /** 切换线索类型：重置后重新拉取 */
  function changeType(next: LeadType) {
    if (type.value === next) return
    type.value = next
    resetFeeds()
    fetchList()
  }

  /** 按企业筛选线索列表 */
  function applyCompany(item: StandardCompanyItem) {
    companyName.value = item.companyStandardName
    companyId.value = item.parentCompanyId
    resetFeeds()
    fetchList()
  }

  /** 药品类型标签配色：生物制品用紫色，化药用青色 */
  function getDrugTypeClass(item: OpportunityVo) {
    return item.cleanedDrugType?.includes('生物') ? 'tag-bio' : 'tag-chem'
  }

  interface FieldRow {
    label: string
    value: string
    /** 时效档位标签（近1周 / 近1个月…），为空则不展示 */
    fresh?: string
    /** 值后的补充说明 */
    note?: string
  }

  const DATE_LABEL: Record<string, string> = {
    ind: '受理日期',
    cde: '登记日期',
    nda: '受理日期'
  }

  /**
   * 根据数据类型组装卡片字段行
   * ind: 申请人 + 受理日期 + 受理状态 + 获批日期 + 受理号 + 适应症
   * cde: 申请人 + 登记日期 + 试验分期 + 登记号 + 适应症
   * nda: 申请人 + 受理日期 + 申请状态 + 获批日期 + 受理号 + 适应症
   */
  function getFieldRows(item: OpportunityVo): FieldRow[] {
    const rows: FieldRow[] = [
      { label: '申请人', value: item.applicationCompany },
      {
        label: DATE_LABEL[item.dataType] || '受理日期',
        value: item.undertakeDate,
        fresh: freshLabel(item.undertakeDate)
      }
    ]

    if (item.dataType === 'cde') {
      rows.push({ label: '试验分期', value: item.cleanedClassificationOrStages })
      rows.push({ label: '登记号', value: item.acceptanceNo })
    } else {
      rows.push({
        label: item.dataType === 'nda' ? '申请状态' : '受理状态',
        value: item.applicationStatus
      })
      rows.push({
        label: '获批日期',
        value: item.approvalTime,
        fresh: freshLabel(item.approvalTime)
      })
      rows.push({ label: '受理号', value: item.acceptanceNo })
    }

    rows.push({
      label: '适应症',
      value: item.indication,
      note: item.dataType === 'ind' && !item.indication ? '（获批后适应症才会公示）' : ''
    })

    return rows
  }
  // #endregion

  // #region 筛选交互（线索类型 / 登记时间）
  /** 线索类型是否已选（用于按钮高亮） */
  const typePicked = computed(() => type.value !== 'all')

  function optionLabel(opts: FilterOption[], value: string | number) {
    return opts.find((o) => o.value === value)?.label || ''
  }

  const typeLabel = computed(() => optionLabel(LEAD_TYPE_OPTS, type.value))
  const timeLabel = computed(() =>
    timeDays.value > 0 ? optionLabel(LEAD_TIME_OPTS, timeDays.value) : '登记时间'
  )
  const activeOptions = computed(() =>
    activeFilter.value === 'type' ? LEAD_TYPE_OPTS : LEAD_TIME_OPTS
  )
  const activeValue = computed(() => (activeFilter.value === 'type' ? type.value : timeDays.value))

  function toggleFilter(key: 'type' | 'time') {
    activeFilter.value = activeFilter.value === key ? null : key
  }

  function handleFilterSelect(value: string | number) {
    if (activeFilter.value === 'type') {
      changeType(value as LeadType)
    } else {
      timeDays.value = Number(value)
    }
    activeFilter.value = null
  }

  /** 登记时间为前端过滤（接口不支持时间参数），仅过滤已加载数据 */
  const visibleList = computed<OpportunityVo[]>(() => {
    if (timeDays.value <= 0) return list.value
    return list.value.filter((item) => {
      const days = daysFromToday(item.undertakeDate)
      return days !== null && days <= timeDays.value
    })
  })

  /** 结果条条数：有时间筛选时按已加载数据统计 */
  const resultCount = computed(() => {
    if (timeDays.value > 0) return visibleList.value.length
    return targetTypes.value.reduce((sum, t) => sum + (typeCounts.value[t] || 0), 0)
  })

  const filterSummary = computed(() => {
    const conds: string[] = []
    if (type.value !== 'all') conds.push(typeLabel.value)
    if (timeDays.value > 0) conds.push(timeLabel.value)
    return conds.join(' · ')
  })

  function clearFilters() {
    const typeChanged = type.value !== 'all'
    type.value = 'all'
    timeDays.value = 0
    activeFilter.value = null
    if (typeChanged) {
      resetFeeds()
      fetchList()
    }
  }
  // #endregion

  // #region 搜索联想逻辑
  const searchKeyword = ref('')
  let searchTimer: ReturnType<typeof setTimeout> | null = null
  const selectedCompany = ref<StandardCompanyItem | null>(null)
  const searchResults = ref<StandardCompanyItem[]>([])
  const showDropdown = ref(false)
  const searchLoading = ref(false)

  const DROPDOWN_ITEM_HEIGHT = 88
  const DROPDOWN_MAX_HEIGHT = 400
  const dropdownListStyle = computed(() => {
    const count = searchResults.value.length
    const height = Math.min(count * DROPDOWN_ITEM_HEIGHT, DROPDOWN_MAX_HEIGHT)
    return { height: `${height}rpx` }
  })

  function onSearchInput() {
    if (!checkPermission()) {
      return
    }
    if (searchTimer) clearTimeout(searchTimer)
    selectedCompany.value = null

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

  /** 清空搜索关键字并复位联想状态 */
  function clearSearchKeyword() {
    searchKeyword.value = ''
    selectedCompany.value = null
    searchResults.value = []
    showDropdown.value = false
    if (searchTimer) {
      clearTimeout(searchTimer)
      searchTimer = null
    }
    fetchList()
  }

  async function fetchSearchResults() {
    const keyword = searchKeyword.value.trim()
    if (!keyword) return

    searchLoading.value = true
    showDropdown.value = true

    try {
      const res = await queryStandardCompany({
        companyStandardName: keyword,
        pageNum: 1,
        pageSize: 99
      })
      searchResults.value = res.data?.list || []
    } catch {
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }

  /** 点击「搜索」：立即查询企业联想列表 */
  function handleSearchClick() {
    if (!checkPermission()) {
      return
    }
    if (!searchKeyword.value.trim()) {
      uni.showToast({ title: '请输入企业名称', icon: 'none' })
      return
    }
    if (searchTimer) clearTimeout(searchTimer)
    fetchSearchResults()
  }

  function selectCompany(item: StandardCompanyItem) {
    searchKeyword.value = item.companyStandardName
    selectedCompany.value = item
    showDropdown.value = false
    applyCompany(item)
  }
  // #endregion

  // #region VIP 状态与权限控制
  // 申请状态：0-未申请，1-申请试用中，2-试用中，3-申请开通中，4-开通中
  const applyStatus = ref<number>(APPLY_STATUS.未申请)
  const showVipExpiredPopup = ref(false)
  const showFreeVipBanner = ref(false)

  // 是否存在待处理的申请（申请试用中 / 申请开通中）
  const hasPendingApply = computed(
    () =>
      applyStatus.value === APPLY_STATUS.申请试用中 || applyStatus.value === APPLY_STATUS.申请开通中
  )

  async function fetchVipApplicationStatus() {
    const detail = await refreshUserDetail()
    if (!detail) {
      applyStatus.value = APPLY_STATUS.未申请
      showFreeVipBanner.value = false
      return
    }
    userInfo.value = detail
    applyStatus.value = detail.applyStatus ?? APPLY_STATUS.未申请
    // 从未申请过 → 展示「免费试用」横幅
    showFreeVipBanner.value = applyStatus.value === APPLY_STATUS.未申请
  }

  function checkPermission() {
    const userInfo = getUserInfo()
    const vipCode = userInfo?.vipCode ?? 0

    if (vipCode !== 0) return true

    // 已提交申请，等待处理
    if (hasPendingApply.value) {
      uni.showToast({
        title: '您已经提交申请，请您耐心等待',
        icon: 'none',
        duration: 3000
      })
      return false
    }
    // 申请过但当前不是会员 → 会员已过期，引导重新申请
    if (applyStatus.value !== APPLY_STATUS.未申请) {
      showVipExpiredPopup.value = true
      return false
    }
    return true
  }

  function handleBannerApply() {
    if (hasPendingApply.value) {
      uni.showToast({ title: '您已提交试用申请，等待电话联系', icon: 'none' })
      return
    }
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .container {
    padding: 30rpx;
    padding-top: 0;
  }

  .note-box {
    padding: 24rpx;
    background: linear-gradient(180deg, rgba(255, 241, 241, 0.5) 0%, rgba(255, 255, 255, 0) 100%);
    border-radius: 16rpx;
    margin-bottom: 30rpx;

    .note-text {
      font-size: 24rpx;
      color: #ff4d4f;
      line-height: 1.6;
    }
  }

  /* #region 查询公司 */
  .search-input-section {
    position: relative;
    z-index: 20;
    margin: 24rpx 0 20rpx;
    padding: 0 30rpx;

    .input-wrapper {
      background: #ffffff;
      border-radius: 44rpx;
      height: 84rpx;
      padding: 0 12rpx 0 28rpx;
      display: flex;
      align-items: center;
      box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);

      .search-icon {
        margin-right: 16rpx;
      }

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
        margin-right: 16rpx;
      }

      .search-go {
        flex-shrink: 0;
        width: 116rpx;
        height: 64rpx;
        border-radius: 32rpx;
        background: #1e6fff;
        display: flex;
        align-items: center;
        justify-content: center;

        text {
          color: #ffffff;
          font-size: 26rpx;
          font-weight: 600;
        }

        &:active {
          background: #0a57eb;
        }
      }
    }

    .search-dropdown {
      position: absolute;
      top: 92rpx;
      left: 30rpx;
      right: 30rpx;
      background: #ffffff;
      border-radius: 24rpx;
      box-shadow: 0 16rpx 48rpx rgba(15, 23, 42, 0.1);
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
  /* #endregion */

  /* #region 筛选行：线索类型 / 登记时间 */
  .lead-filter-row {
    position: relative;
    z-index: 40;
    display: flex;
    align-items: center;
    margin: 0 30rpx 20rpx;

    .lead-filter-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8rpx;
      height: 64rpx;

      .lead-filter-val {
        font-size: 28rpx;
        color: #6b7280;
      }

      .lead-filter-arrow {
        width: 30rpx;
        height: 30rpx;
        flex-shrink: 0;
        transition: transform 0.15s;

        &::after {
          content: '';
          display: block;
          width: 14rpx;
          height: 14rpx;
          margin: 4rpx auto 0;
          border-right: 4rpx solid #9ca3af;
          border-bottom: 4rpx solid #9ca3af;
          transform: rotate(45deg);
        }
      }

      &.on {
        .lead-filter-val {
          color: #1e6fff;
          font-weight: 600;
        }

        .lead-filter-arrow::after {
          border-color: #1e6fff;
        }
      }

      &.open .lead-filter-arrow {
        transform: rotate(180deg);
      }
    }

    .cb-dropdown {
      position: absolute;
      top: 76rpx;
      z-index: 70;
      background: #ffffff;
      border-radius: 24rpx;
      box-shadow: 0 16rpx 48rpx rgba(15, 23, 42, 0.1);
      padding: 12rpx;
      min-width: 280rpx;
      max-height: 520rpx;
      overflow-y: auto;
      box-sizing: border-box;

      &.align-left {
        left: 0;
      }

      &.align-right {
        right: 0;
      }

      .cb-opt {
        padding: 20rpx 28rpx;
        font-size: 26rpx;
        color: #1f2329;
        border-radius: 16rpx;
        white-space: nowrap;

        &:active {
          background: #f7f8fa;
        }

        &.active {
          color: #1e6fff;
          font-weight: 600;
          background: #ebf3ff;
        }
      }
    }
  }

  /* 下拉蒙层：点击收起 */
  .filter-mask {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    z-index: 30;
  }
  /* #endregion */

  /* #region 结果条 */
  .lead-result-bar {
    display: flex;
    align-items: baseline;
    gap: 12rpx;
    margin: 0 30rpx 16rpx;
    font-size: 24rpx;
    line-height: 32rpx;

    .lrb-count {
      color: #1f2329;
      font-weight: 600;
    }

    .lrb-sum {
      flex: 1;
      min-width: 0;
      color: #9ca3af;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .lrb-reset {
      flex-shrink: 0;
      color: #1e6fff;
    }
  }
  /* #endregion */

  /* #region 空态 */
  .lead-empty {
    background: #ffffff;
    border-radius: 28rpx;
    padding: 68rpx 40rpx;
    text-align: center;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);

    .lead-empty-icon {
      position: relative;
      width: 96rpx;
      height: 96rpx;
      margin: 0 auto;

      &::before {
        content: '';
        position: absolute;
        left: 6rpx;
        top: 6rpx;
        width: 62rpx;
        height: 62rpx;
        border: 5rpx solid #c7d2e0;
        border-radius: 50%;
        box-sizing: border-box;
      }

      &::after {
        content: '';
        position: absolute;
        right: 10rpx;
        bottom: 12rpx;
        width: 34rpx;
        height: 5rpx;
        border-radius: 4rpx;
        background: #c7d2e0;
        transform: rotate(45deg);
      }
    }

    .lead-empty-title {
      display: block;
      margin-top: 20rpx;
      font-size: 28rpx;
      font-weight: 600;
      color: #1f2329;
    }

    .lead-empty-desc {
      display: block;
      margin-top: 12rpx;
      font-size: 24rpx;
      color: #9ca3af;
    }

    .lead-empty-reset {
      display: inline-block;
      margin-top: 28rpx;
      padding: 14rpx 36rpx;
      border-radius: 32rpx;
      border: 2rpx solid #1e6fff;
      color: #1e6fff;
      font-size: 26rpx;
    }
  }
  /* #endregion */

  /* #region 线索卡片 */
  .tag {
    font-size: 20rpx;
    padding: 4rpx 14rpx;
    border-radius: 10rpx;
    font-weight: 500;
  }

  .tag-lead {
    background: #1e6fff;
    color: #ffffff;
  }

  .tag-bio {
    background: #eef0fe;
    color: #6d28d9;
  }

  .tag-chem {
    background: #e6f7f1;
    color: #0b7b5b;
  }

  .tag-amber {
    background: #fdf3e3;
    color: #b45309;
  }

  .tag-fresh {
    background: #e6f7f1;
    color: #0b7b5b;
  }

  .lead-card {
    background: #ffffff;
    border-radius: 28rpx;
    padding: 28rpx 32rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 6rpx rgba(15, 23, 42, 0.06);

    .lead-head {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12rpx;

      .lead-drug {
        font-size: 30rpx;
        font-weight: 600;
        color: #1f2329;
      }

      .tag-lead {
        margin-left: auto;
        flex-shrink: 0;
      }

      .lead-tags {
        flex-basis: 100%;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12rpx;
        row-gap: 10rpx;
        margin-top: 4rpx;
      }
    }

    .lead-fields {
      display: flex;
      flex-direction: column;
      gap: 12rpx;
      margin-top: 24rpx;

      .lf {
        display: flex;
        font-size: 24rpx;
        line-height: 1.5;

        .lf-label {
          color: #9ca3af;
          flex-shrink: 0;
        }

        .lf-value {
          color: #6b7280;
          word-break: break-all;
        }

        .lf-note {
          color: #9ca3af;
          font-size: 22rpx;
        }

        .tag-fresh {
          margin-left: 12rpx;
          flex-shrink: 0;
        }
      }
    }

    .lead-tip {
      margin-top: 24rpx;
      padding: 20rpx 24rpx;
      background: #ebf3ff;
      border-radius: 18rpx;
      font-size: 24rpx;
      color: #0a57eb;
      line-height: 1.6;

      .tip-label {
        color: #1e6fff;
        font-weight: 600;
      }
    }
  }

  .load-more {
    padding: 30rpx 0;
    text-align: center;
    font-size: 24rpx;
    color: #999;
  }
  /* #endregion */
</style>
