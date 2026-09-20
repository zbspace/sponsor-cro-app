<!-- 中心实验室合作统计 -->
<template>
  <view class="page-container">
    <!-- #region 头部导航 -->
    <view class="header-nav" :style="{ paddingTop: `${statusBarHeight}px` }">
      <view class="nav-content">
        <view class="back-btn" @click="goBack">
          <uni-icons type="left" size="24" color="#333"></uni-icons>
        </view>
        <text class="title">{{ companyName || '中心实验室合作记录' }}</text>
        <view class="nav-placeholder"></view>
      </view>
    </view>
    <!-- #endregion -->

    <!-- #region 选项卡 -->
    <view class="tabs-wrapper border-b border-f0f0f0">
      <view
        class="tab-item"
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <text class="tab-text">{{ tab.label }}</text>
        <view class="active-line" v-if="activeTab === tab.key"></view>
      </view>
    </view>
    <!-- #endregion -->

    <scroll-view scroll-y class="content-scroll">
      <!-- #region 统计内容 -->
      <view v-if="activeTab === 'stat'" class="stat-content p-16px">
        <!-- 外包比例 -->
        <view class="stat-card mb-16px p-16px">
          <view class="card-header flex justify-between items-center mb-16px">
            <view class="flex items-center">
              <view class="title-indicator"></view>
              <text class="text-16px font-bold text-333">外包比例</text>
            </view>
            <view class="year-picker flex items-center">
              <text class="text-14px text-999 mr-4px">年份</text>
              <uni-icons type="bottom" size="12" color="#999"></uni-icons>
            </view>
          </view>

          <view class="chart-section flex items-center justify-around py-20px">
            <view class="donut-chart-wrapper">
              <view class="donut-chart" :style="{ background: donutGradient }"></view>
              <view class="donut-inner"></view>
            </view>
            <view class="legend-list">
              <view v-for="(item, index) in ratioData" :key="index" class="legend-item mb-16px">
                <view class="flex items-center mb-4px">
                  <view class="legend-dot mr-8px" :style="{ backgroundColor: item.color }"></view>
                  <text class="text-14px text-999">{{ item.name }}</text>
                </view>
                <text class="text-16px font-bold text-333 ml-22px">{{ item.ratio }}%</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 中心实验室合作榜单 -->
        <view class="stat-card p-16px">
          <view class="card-header flex justify-between items-center mb-16px">
            <view class="flex items-center">
              <view class="title-indicator"></view>
              <text class="text-16px font-bold text-333">中心实验室合作榜单</text>
            </view>
            <view class="year-picker flex items-center">
              <text class="text-14px text-999 mr-4px">年份</text>
              <uni-icons type="bottom" size="12" color="#999"></uni-icons>
            </view>
          </view>

          <view class="rank-table">
            <view class="table-header flex bg-f8f9fb py-10px px-12px rounded-4px">
              <text class="flex-1 text-12px text-999 text-center">排名</text>
              <text class="flex-3 text-12px text-999 text-center">CRO公司</text>
              <text class="flex-2 text-12px text-999 text-center">合作项目数</text>
            </view>
            <view class="table-body mt-8px">
              <view
                v-for="(item, index) in rankList"
                :key="index"
                class="table-row flex py-12px px-12px border-b border-f0f0f0"
                :class="{ 'border-none': index === rankList.length - 1 }"
              >
                <text class="flex-1 text-14px text-666 text-center">{{ index + 1 }}</text>
                <text class="flex-3 text-14px text-666 text-center">{{ item.companyName }}</text>
                <text class="flex-2 text-14px text-666 text-center">{{ item.count }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      <!-- #endregion -->

      <!-- #region 项目列表 -->
      <view v-if="activeTab === 'list'" class="list-content p-16px">
        <view v-for="(item, index) in projectList" :key="index" class="project-card mb-16px p-16px">
          <view class="project-title text-16px text-333 mb-12px leading-24px">
            {{ item.title }}
          </view>
          <view class="info-box bg-f8f9fb p-12px rounded-8px">
            <view class="info-row flex mb-8px">
              <text class="label w-90px text-14px text-999">申办方</text>
              <text class="value flex-1 text-14px text-666">{{ item.sponsor }}</text>
            </view>
            <view class="info-row flex mb-8px">
              <text class="label w-90px text-14px text-999">中心实验室</text>
              <text
                class="value flex-1 text-14px text-666"
                :class="{ 'text-999': item.lab === '(未使用)' }"
              >
                {{ item.lab }}
              </text>
            </view>
            <view class="info-row flex mb-8px">
              <text class="label w-90px text-14px text-999">遗传办公示记录</text>
              <text class="value flex-1 text-14px text-666">{{ item.recordCount }}</text>
            </view>
            <view class="info-row flex">
              <text class="label w-90px text-14px text-999">首次公示时间</text>
              <text class="value flex-1 text-14px text-666">{{ item.firstTime }}</text>
            </view>
          </view>
        </view>
      </view>
      <!-- #endregion -->
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  // #region 导入
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  // #endregion

  // #region 基础状态
  const statusBarHeight = ref(0)
  const companyName = ref('')
  const activeTab = ref('stat')
  const tabs = [
    { label: '统计', key: 'stat' },
    { label: '项目列表', key: 'list' }
  ]

  onLoad((options: any) => {
    companyName.value = options.companyName || ''
    const sysInfo = uni.getSystemInfoSync()
    statusBarHeight.value = sysInfo.statusBarHeight || 0
  })

  const goBack = () => {
    uni.navigateBack()
  }
  // #endregion

  // #region 统计数据 (Mock)
  const ratioData = ref([
    { name: '用中心实验室', ratio: 13, color: '#00A0E9', count: 13 },
    { name: '不用中心实验室', ratio: 87, color: '#7ED321', count: 87 }
  ])

  const donutGradient = computed(() => {
    let currentPercentage = 0
    const stops = ratioData.value.map((item) => {
      const start = currentPercentage
      currentPercentage += item.ratio
      return `${item.color} ${start}% ${currentPercentage}%`
    })
    return `conic-gradient(${stops.join(', ')})`
  })

  const rankList = ref([
    { companyName: '圣方医药', count: 2 },
    { companyName: '圣方医药', count: 2 },
    { companyName: '圣方医药', count: 2 },
    { companyName: '圣方医药', count: 2 },
    { companyName: '圣方医药', count: 2 },
    { companyName: '圣方医药', count: 2 }
  ])
  // #endregion

  // #region 项目列表数据 (Mock)
  const projectList = ref([
    {
      title:
        '一项在晚期恶性肿瘤受试者中评价替雷利珠单抗、帕米帕利和其他研究药物治疗的开放性、多中心、长期扩展研究',
      sponsor: '广州百济神州生物制药有限公司',
      lab: '(未使用)',
      recordCount: 3,
      firstTime: '2026-04-13'
    },
    {
      title:
        '一项在携带有害胚系或体系同源重组修复(HRR)基因突变的转移性去势敏感性前列腺癌(mCSPC)受试者中比较Niraparib联合醋酸阿比特龙+泼尼松与醋酸阿比特龙..',
      sponsor: '广州百济神州生物制药有限公司',
      lab: '广州百济神州生物制药有限公司',
      recordCount: 3,
      firstTime: '2026-04-13'
    }
  ])
  // #endregion
</script>

<style lang="scss" scoped>
  .page-container {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #f8f9fb;

    .header-nav {
      background-color: #fff;
      flex-shrink: 0;
      .nav-content {
        height: 44px;
        display: flex;
        align-items: center;
        padding: 0 16px;
        .back-btn {
          width: 40px;
        }
        .title {
          flex: 1;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          color: #333;
        }
        .nav-placeholder {
          width: 40px;
        }
      }
    }

    .tabs-wrapper {
      display: flex;
      background-color: #fff;
      padding: 10px 0;
      flex-shrink: 0;
      .tab-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
        .tab-text {
          font-size: 16px;
          color: #999;
          margin-bottom: 6px;
        }
        &.active {
          .tab-text {
            color: #00a0e9;
            font-weight: bold;
          }
          .active-line {
            width: 24px;
            height: 3px;
            background-color: #00a0e9;
            border-radius: 2px;
          }
        }
      }
    }

    .content-scroll {
      flex: 1;
      overflow: hidden;
    }

    .stat-card {
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    }

    .title-indicator {
      width: 4px;
      height: 16px;
      background-color: #00a0e9;
      border-radius: 2px;
      margin-right: 8px;
    }

    .donut-chart-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      .donut-chart {
        width: 100%;
        height: 100%;
        border-radius: 50%;
      }
      .donut-inner {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 70px;
        height: 70px;
        background-color: #fff;
        border-radius: 50%;
      }
    }

    .legend-dot {
      width: 12px;
      height: 8px;
      border-radius: 2px;
    }

    .project-card {
      background-color: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
    }

    .bg-f8f9fb {
      background-color: #f8f9fb;
    }
    .text-333 {
      color: #333;
    }
    .text-666 {
      color: #666;
    }
    .text-999 {
      color: #999;
    }
    .border-f0f0f0 {
      border-color: #f0f0f0;
    }
  }
</style>
