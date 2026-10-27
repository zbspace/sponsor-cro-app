<!-- 药企合作医院列表（查药企&医院 二级页） -->
<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">合作医院</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/home/head-bg.png" mode="aspectFit" />

  <view
    class="container"
    :style="{ height: `calc(100vh - ${menu.top}px - ${menu.height}px)` }"
    @click="activeField = ''"
  >
    <!-- 药企信息条 -->
    <view class="hd-drug">
      <view class="hd-drug-row">
        <text class="hd-drug-name">{{ companyName || '查询对象' }}</text>
        <text class="hd-tag">药企</text>
      </view>
    </view>

    <!-- 筛选区：年份 / 试验状态 / 试验分期 / 医院名称搜索 -->
    <view class="hd-filter-card">
      <view class="hd-filter-row">
        <view class="hd-filter-wrap" v-for="f in filterDefs" :key="f.key">
          <view
            class="hd-filter"
            :class="{ on: filters[f.key] !== ALL }"
            @click.stop="toggleDropdown(f.key)"
          >
            <text class="hd-filter-label">{{ f.label }}</text>
            <text class="hd-filter-val" :class="{ on: filters[f.key] !== ALL }">
              {{ filters[f.key] }}
            </text>
            <view class="hd-caret"></view>
          </view>

          <!-- 下拉选项 -->
          <view class="hd-dropdown" v-if="activeField === f.key">
            <view
              class="hd-opt"
              :class="{ active: opt === filters[f.key] }"
              v-for="opt in filterOptions[f.key]"
              :key="opt"
              @click.stop="selectFilter(f.key, opt)"
            >
              <text>{{ opt }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 医院名称搜索 -->
      <view class="hd-search">
        <view class="hd-search-ico"></view>
        <input
          type="text"
          v-model="hospitalKeyword"
          placeholder="搜索医院名称"
          placeholder-style="color: #9ca3af"
        />
      </view>
    </view>

    <!-- 结果统计 -->
    <view class="hd-note">共 {{ noteCount }} 家医院</view>

    <!-- 医院列表：序号 / 医院名称 / 临床试验数 -->
    <scroll-view
      class="list-scroll"
      scroll-y
      :show-scrollbar="false"
      lower-threshold="100"
      @scrolltolower="loadMore"
    >
      <view class="co-card hd-table">
        <view class="cd-thead">
          <text class="cd-th cd-c1">序号</text>
          <text class="cd-th cd-c2">医院名称</text>
          <text class="cd-th cd-c3">临床试验数</text>
        </view>

        <view
          class="cd-tr"
          v-for="(item, index) in displayList"
          :key="item.hosStandardId"
          hover-class="row-hover"
          @click="onHospitalClick(item)"
        >
          <text class="cd-td cd-c1 cd-td-idx">{{ index + 1 }}</text>
          <text class="cd-td cd-c2 cd-td-name">{{ item.hosStandardName || '--' }}</text>
          <text class="cd-td cd-c3 cd-td-num">{{ item.trialCnt ?? '--' }}</text>
        </view>

        <view class="hd-empty" v-if="!loading && displayList.length === 0">暂无符合条件的医院</view>

        <view class="load-status" v-if="loading && list.length > 0">
          <text>加载中...</text>
        </view>
        <view class="load-status" v-else-if="!hasMore && list.length > 0">
          <text>没有更多了</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, onMounted } from 'vue'
  import { hospitalTrialStatistic } from '@/api'
  import type { HospitalTrialStatisticItem, HospitalTrialStatisticParam } from '@/types/api'
  import { onLoad } from '@dcloudio/uni-app'

  // #region 路由参数
  const menu = ref({ top: 0, left: 0, height: 0 })
  const companyName = ref('')
  const companyParentId = ref(0)
  // #endregion

  // #region 筛选配置
  const ALL = '全部'
  type FilterKey = 'year' | 'status' | 'phase'

  // 试验分期/试验状态取值与 CDE 接口文档保持一致
  const CDE_TRIAL_STAGES = ['Ⅰ期', 'Ⅱ期', 'Ⅲ期', 'Ⅳ期', 'BE', '其他']
  const CDE_TRIAL_STATUS = ['进行中', '已完成', '主动暂停', '被叫停']

  const filterDefs: { key: FilterKey; label: string }[] = [
    { key: 'year', label: '年份' },
    { key: 'status', label: '试验状态' },
    { key: 'phase', label: '试验分期' }
  ]

  const filters = reactive<Record<FilterKey, string>>({
    year: ALL,
    status: ALL,
    phase: ALL
  })

  const filterOptions = computed<Record<FilterKey, string[]>>(() => ({
    year: [ALL, ...Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - i))],
    status: [ALL, ...CDE_TRIAL_STATUS],
    phase: [ALL, ...CDE_TRIAL_STAGES]
  }))

  // 当前展开的下拉字段，空字符串表示未展开
  const activeField = ref<FilterKey | ''>('')

  function toggleDropdown(key: FilterKey) {
    activeField.value = activeField.value === key ? '' : key
  }

  function selectFilter(key: FilterKey, value: string) {
    activeField.value = ''
    if (filters[key] === value) return
    filters[key] = value
    fetchList(true)
  }
  // #endregion

  // #region 列表数据
  const list = ref<HospitalTrialStatisticItem[]>([])
  const pageNum = ref(1)
  const pageSize = 20
  const total = ref(0)
  const loading = ref(false)
  const hasMore = computed(() => list.value.length < total.value)

  // 医院名称前端过滤（接口未提供名称查询参数）
  const hospitalKeyword = ref('')
  const displayList = computed(() => {
    const kw = hospitalKeyword.value.trim()
    if (!kw) return list.value
    return list.value.filter((item) => (item.hosStandardName || '').includes(kw))
  })
  const noteCount = computed(() =>
    hospitalKeyword.value.trim() ? displayList.value.length : total.value
  )

  async function fetchList(refresh = false) {
    if (loading.value) return
    if (refresh) {
      pageNum.value = 1
    }
    loading.value = true

    const params: HospitalTrialStatisticParam = {
      parentCompanyId: companyParentId.value || undefined,
      year: filters.year === ALL ? undefined : filters.year,
      trialStatus: filters.status === ALL ? undefined : filters.status,
      trialStage: filters.phase === ALL ? undefined : filters.phase,
      pageNum: pageNum.value,
      pageSize
    }

    try {
      const res = await hospitalTrialStatistic(params)
      if (res.data) {
        list.value = refresh ? res.data.list || [] : [...list.value, ...(res.data.list || [])]
        total.value = res.data.total || 0
      }
    } catch (e) {
      console.error('获取合作医院列表失败', e)
    } finally {
      loading.value = false
    }
  }

  function loadMore() {
    if (hasMore.value && !loading.value) {
      pageNum.value++
      fetchList()
    }
  }
  // #endregion

  // #region 跳转
  /** 点击医院行，跳转到合作情况统计页的「试验列表」tab */
  function onHospitalClick(item: HospitalTrialStatisticItem) {
    uni.navigateTo({
      url: `/pages/hospital-stat/index?companyParentId=${
        companyParentId.value || ''
      }&companyName=${encodeURIComponent(companyName.value)}&hosStandardId=${
        item.hosStandardId
      }&tab=list`
    })
  }

  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }
  // #endregion

  // #region 生命周期
  onLoad((options: any) => {
    menu.value = uni.getMenuButtonBoundingClientRect()
    // 读取路由参数（来自「查药企&医院」弹窗）
    if (options?.companyName) {
      companyName.value = decodeURIComponent(options.companyName)
    }
    if (options?.companyParentId) {
      companyParentId.value = Number(options.companyParentId)
    }
  })

  onMounted(() => {
    fetchList(true)
  })
  // #endregion
</script>

<style lang="scss" scoped>
  .container {
    display: flex;
    flex-direction: column;
    padding: 20rpx 30rpx 0;
  }

  /* #region 药企信息条 */
  .hd-drug {
    flex-shrink: 0;
    padding: 30rpx 28rpx;
    margin-bottom: 24rpx;
    background: #ffffff;
    border-radius: 32rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);

    .hd-drug-row {
      display: flex;
      align-items: center;
      gap: 16rpx;
      flex-wrap: wrap;
    }

    .hd-drug-name {
      font-size: 34rpx;
      font-weight: 700;
      color: #1f2329;
    }

    .hd-tag {
      flex-shrink: 0;
      padding: 6rpx 18rpx;
      border-radius: 12rpx;
      font-size: 22rpx;
      font-weight: 600;
      background: #eaf2ff;
      color: #1e6fff;
    }
  }
  /* #endregion */

  /* #region 筛选区 */
  .hd-filter-card {
    flex-shrink: 0;
    padding: 24rpx;
    margin-bottom: 24rpx;
    background: #ffffff;
    border-radius: 32rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  }

  .hd-filter-row {
    display: flex;
    gap: 16rpx;
  }

  .hd-filter-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .hd-filter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    height: 76rpx;
    padding: 0 12rpx;
    background: #f5f7fa;
    border-radius: 20rpx;
    overflow: hidden;

    &:active {
      opacity: 0.8;
    }

    &.on {
      background: #eaf2ff;

      .hd-filter-label {
        display: none;
      }
    }
  }

  .hd-filter-label {
    flex-shrink: 0;
    font-size: 24rpx;
    color: #6b7280;
  }

  .hd-filter-val {
    overflow: hidden;
    font-size: 24rpx;
    color: #6b7280;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.on {
      color: #1e6fff;
      font-weight: 600;
    }
  }

  .hd-caret {
    width: 0;
    height: 0;
    flex-shrink: 0;
    border-top: 10rpx solid #9ca3af;
    border-right: 8rpx solid transparent;
    border-left: 8rpx solid transparent;
  }

  .hd-dropdown {
    position: absolute;
    top: calc(100% + 8rpx);
    left: 0;
    z-index: 70;
    min-width: 100%;
    max-height: 520rpx;
    padding: 12rpx;
    overflow-y: auto;
    background: #ffffff;
    border-radius: 20rpx;
    box-shadow: 0 12rpx 32rpx rgba(15, 23, 42, 0.16);

    .hd-opt {
      padding: 18rpx 22rpx;
      border-radius: 12rpx;

      text {
        font-size: 26rpx;
        color: #1f2329;
      }

      &:active {
        background: #f7f8fa;
      }

      &.active {
        background: #eaf2ff;

        text {
          color: #1e6fff;
          font-weight: 600;
        }
      }
    }
  }

  .hd-search {
    display: flex;
    align-items: center;
    gap: 16rpx;
    height: 76rpx;
    padding: 0 24rpx;
    margin-top: 20rpx;
    background: #f5f7fa;
    border-radius: 20rpx;

    input {
      flex: 1;
      min-width: 0;
      font-size: 26rpx;
      color: #1f2329;
    }
  }

  // 放大镜图标（纯 CSS 绘制）
  .hd-search-ico {
    position: relative;
    width: 30rpx;
    height: 30rpx;
    flex-shrink: 0;
    border: 4rpx solid #9ca3af;
    border-radius: 50%;
    box-sizing: border-box;

    &::after {
      content: '';
      position: absolute;
      right: -9rpx;
      bottom: -7rpx;
      width: 12rpx;
      height: 4rpx;
      border-radius: 2rpx;
      background: #9ca3af;
      transform: rotate(45deg);
    }
  }
  /* #endregion */

  /* #region 结果统计与列表 */
  .hd-note {
    flex-shrink: 0;
    margin: 0 8rpx 16rpx;
    font-size: 24rpx;
    color: #9ca3af;
  }

  .list-scroll {
    flex: 1;
    height: 0;
    min-height: 0;
  }

  .co-card {
    padding: 28rpx 24rpx 24rpx;
    margin-bottom: 24rpx;
    background: #ffffff;
    border-radius: 32rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  }

  .cd-thead {
    display: flex;
    padding: 20rpx 8rpx;
    border-bottom: 2rpx solid #f0f1f3;
  }

  .cd-th {
    font-size: 24rpx;
    color: #9ca3af;
    text-align: center;
  }

  .cd-tr {
    display: flex;
    align-items: center;
    border-bottom: 2rpx solid #f0f1f3;

    &:last-child {
      border-bottom: none;
    }

    &.row-hover {
      background: #f7faff;
    }
  }

  .cd-td {
    padding: 28rpx 8rpx;
    font-size: 28rpx;
    color: #1f2329;
    text-align: center;
  }

  .cd-c1 {
    width: 120rpx;
    flex-shrink: 0;
  }

  .cd-c2 {
    flex: 1;
    min-width: 0;
    padding-left: 12rpx;
    text-align: left;
  }

  .cd-c3 {
    width: 192rpx;
    flex-shrink: 0;
  }

  .cd-td-idx {
    color: #6b7280;
  }

  .cd-td-name {
    color: #1e6fff;
    font-weight: 500;
  }

  .cd-td-num {
    color: #1e6fff;
    font-weight: 600;
  }

  .hd-empty {
    padding: 60rpx 0 48rpx;
    font-size: 26rpx;
    color: #9ca3af;
    text-align: center;
  }

  .load-status {
    padding: 40rpx 0;
    text-align: center;

    text {
      font-size: 24rpx;
      color: #9ca3af;
    }
  }
  /* #endregion */
</style>
