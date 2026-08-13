<template>
  <view class="page-wrapper">
    <!-- 头部导航 -->
    <view class="header" :style="{ paddingTop: `${menu.top}px` }">
      <view class="nav-left" @click="goBack">
        <view class="back-icon">
          <view class="arrow"></view>
        </view>
      </view>
      <text class="title">试验列表</text>
      <view class="nav-right"></view>
    </view>

    <image class="bg-img" src="../../static/icons/header-bg.png" mode="aspectFit" />

    <!-- 搜索和筛选区域 -->
    <view class="fixed-top-section" :style="{ top: `${menu.top + menu.height + 10}px` }">
      <view class="search-bar">
        <icon type="search" size="18" color="#CCCCCC" class="search-icon" />
        <input
          type="text"
          v-model="searchKeyword"
          placeholder="搜索试验名称、批入号"
          placeholder-style="color: #CCCCCC"
          @confirm="onSearch"
          @input="onInput"
        />
        <text class="search-btn" @click="onSearch">搜索</text>
      </view>

      <view class="filter-row">
        <view class="filter-item">
          <uni-data-select
            v-model="currentYear"
            :localdata="yearOptions"
            :clear="true"
            placeholder="年份"
            @change="onFilterChange"
          ></uni-data-select>
        </view>
        <view class="filter-item">
          <uni-data-select
            v-model="currentType"
            :localdata="typeOptions"
            :clear="false"
            placeholder="类型"
            @change="onFilterChange"
          ></uni-data-select>
        </view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="container-scroll-view"
      :show-scrollbar="false"
      enhanced
      :style="{
        height: `calc(100vh - ${menu.top + menu.height + 120}px)`,
        marginTop: `${menu.top + menu.height + 110}px`
      }"
      @scrolltolower="onScrollToLower"
    >
      <view class="list-container">
        <view class="project-card" v-for="(item, index) in list" :key="index">
          <view class="project-title">{{ item.title }}</view>
          <view class="info-list">
            <view class="info-item">
              <view class="info-icon time">
                <image src="../../static/icons/time.png" mode="aspectFit" />
              </view>
              <text class="info-text">批入时间：{{ item.approveTime }}</text>
            </view>
            <view class="info-item">
              <view class="info-icon sponsor">
                <image src="../../static/icons/sponsor.png" mode="aspectFit" />
              </view>
              <text class="info-text">合作申办方：{{ item.sponsor }}</text>
            </view>
            <view class="info-item">
              <view class="info-icon no">
                <image src="../../static/icons/no.png" mode="aspectFit" />
              </view>
              <text class="info-text">审批号/备案号：{{ item.approveNo }}</text>
            </view>
            <view class="info-item" v-if="item.cro">
              <view class="info-icon cro">
                <image src="../../static/icons/cro.png" mode="aspectFit" />
              </view>
              <text class="info-text">CRO：{{ item.cro }}</text>
            </view>
          </view>
          <view class="action-btn">{{ item.tag }}</view>
        </view>

        <!-- 加载状态 -->
        <view class="load-status" v-if="loading">
          <text>加载中...</text>
        </view>
        <view class="load-status" v-else-if="noMore && list.length > 0">
          <text>没有更多了</text>
        </view>
        <view class="empty-status" v-else-if="!loading && list.length === 0">
          <image src="../../static/home/empty.png" mode="aspectFit" v-if="false" />
          <text>暂无相关试验数据</text>
        </view>
      </view>
    </scroll-view>

    <phone-bind-popup />
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, reactive, onMounted } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import PhoneBindPopup from '@/components/phone-bind-popup/phone-bind-popup.vue'
  import { getCroProjectList } from '@/api'
  // #endregion

  // #region 状态
  const menu = ref({ top: 0, left: 0, height: 0 })
  const searchKeyword = ref('')
  const currentYear = ref('')
  const currentType = ref('cro')

  const yearOptions = ref([
    { value: '', text: '全部年份' },
    ...Array.from({ length: 5 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), text: `${year}年度` }
    })
  ])

  const typeOptions = [
    { value: 'cro', text: 'CRO项目' },
    { value: 'thirdLab', text: '中心实验室' }
  ]

  const list = ref<any[]>([])
  const pageNum = ref(1)
  const pageSize = ref(10)
  const loading = ref(false)
  const noMore = ref(false)
  let timer: any = null
  // #endregion

  // #region 生命周期
  onLoad(() => {
    const info = uni.getMenuButtonBoundingClientRect()
    menu.value = info
    fetchList()
  })
  // #endregion

  // #region 方法
  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }

  async function fetchList(reset = false) {
    if (loading.value) return
    if (reset) {
      pageNum.value = 1
      noMore.value = false
      list.value = []
    }
    if (noMore.value) return

    loading.value = true
    try {
      const res = await getCroProjectList({
        companyType: currentType.value,
        lastYear: currentYear.value ? Number(currentYear.value) : undefined,
        pageNum: pageNum.value,
        pageSize: pageSize.value
      })

      if (res.data?.list) {
        const newList = res.data.list.map((item) => ({
          title: item.projectName,
          approveTime: item.approvalRecordTime,
          sponsor: item.sponsorStandardCompanyName,
          approveNo: item.projectNo,
          cro: item.partnerParentCompanyShortName,
          tag: item.category
        }))
        
        list.value = reset ? newList : [...list.value, ...newList]
        noMore.value = list.value.length >= res.data.total
        pageNum.value++
      } else {
        noMore.value = true
      }
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  function onSearch() {
    fetchList(true)
  }

  function onInput() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fetchList(true)
    }, 500)
  }

  function onFilterChange() {
    fetchList(true)
  }

  function onScrollToLower() {
    fetchList()
  }
  // #endregion
</script>

<style lang="scss" scoped>
  .page-wrapper {
    background: #f8f9fb;
    min-height: 100vh;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 30rpx;
    height: 88rpx;
    position: relative;
    z-index: 100;

    .nav-left {
      width: 60rpx;
      height: 60rpx;
      display: flex;
      align-items: center;
      .back-icon {
        width: 40rpx;
        height: 40rpx;
        .arrow {
          width: 20rpx;
          height: 20rpx;
          border-top: 4rpx solid #333;
          border-left: 4rpx solid #333;
          transform: rotate(-45deg);
        }
      }
    }

    .title {
      font-size: 34rpx;
      font-weight: 500;
      color: #333;
    }

    .nav-right {
      width: 60rpx;
    }
  }

  .bg-img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 300rpx;
    z-index: 1;
  }

  .fixed-top-section {
    position: fixed;
    left: 30rpx;
    right: 30rpx;
    z-index: 90;
    display: flex;
    flex-direction: column;
    gap: 20rpx;
  }

  .search-bar {
    background: #ffffff;
    border-radius: 20rpx;
    height: 88rpx;
    display: flex;
    align-items: center;
    padding: 0 30rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);

    .search-icon {
      margin-right: 16rpx;
    }

    input {
      flex: 1;
      font-size: 28rpx;
      color: #333;
    }

    .search-btn {
      font-size: 28rpx;
      color: #499ae6;
      font-weight: 500;
      padding-left: 20rpx;
      border-left: 1rpx solid #eee;
    }
  }

  .filter-row {
    display: flex;
    gap: 20rpx;

    .filter-item {
      flex: 1;
      background: #ffffff;
      height: 80rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      padding: 0 20rpx;
      box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03);

      :deep(.uni-select) {
        border: none;
        padding: 0;
        .uni-select__input-text {
          font-size: 26rpx;
          color: #666;
        }
      }
    }
  }

  .container-scroll-view {
    position: relative;
    z-index: 10;
  }

  .list-container {
    padding: 0 30rpx 30rpx;
  }

  .project-card {
    background: #ffffff;
    border-radius: 24rpx;
    padding: 30rpx;
    margin-bottom: 30rpx;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
    position: relative;

    .project-title {
      font-size: 30rpx;
      color: #333;
      font-weight: 500;
      line-height: 1.5;
      margin-bottom: 30rpx;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;
      overflow: hidden;
    }

    .info-list {
      display: flex;
      flex-direction: column;
      gap: 20rpx;

      .info-item {
        display: flex;
        align-items: center;
        gap: 16rpx;

        .info-icon {
          width: 32rpx;
          height: 32rpx;
          image {
            width: 100%;
            height: 100%;
          }
        }

        .info-text {
          font-size: 26rpx;
          color: #999;
        }
      }
    }

    .action-btn {
      position: absolute;
      right: 30rpx;
      bottom: 30rpx;
      background: #499ae6;
      color: #ffffff;
      font-size: 24rpx;
      padding: 8rpx 24rpx;
      border-radius: 30rpx;
      box-shadow: 0 4rpx 12rpx rgba(73, 154, 230, 0.3);
    }
  }

  .load-status, .empty-status {
    padding: 60rpx 0;
    text-align: center;
    color: #999;
    font-size: 26rpx;
  }
</style>
