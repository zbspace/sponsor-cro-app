<!-- 药品相关企业列表（查药品 二级页） -->
<template>
  <!-- 头部导航 -->
  <view class="header" :style="{ paddingTop: `${menu.top}px`, zIndex: 999 }">
    <view class="nav-left" @click="goBack">
      <view class="back-icon">
        <view class="arrow"></view>
      </view>
    </view>
    <text class="title">相关企业</text>
    <view class="nav-right"></view>
  </view>

  <image class="bg-img" src="../../static/home/head-bg.png" mode="aspectFit" />

  <view class="container" :style="{ height: `calc(100vh - ${menu.top}px - ${menu.height}px)` }">
    <!-- 药品信息条 -->
    <view class="dcl-drug">
      <view class="dcl-drug-row">
        <text class="dcl-drug-name">{{ drugName || '查询对象' }}</text>
        <text class="dcl-tag cat" v-if="drugType">{{ drugType }}</text>
        <text class="dcl-tag reg" v-if="cleanedClassification">{{ cleanedClassification }}</text>
      </view>
    </view>

    <!-- 结果说明 -->
    <view class="dcl-note">如下企业有相关药品研发记录</view>

    <!-- 企业列表：序号 / 企业名称 -->
    <scroll-view class="list-scroll" scroll-y :show-scrollbar="false">
      <view class="dcl-card">
        <view class="dcl-loading" v-if="loading">
          <text>加载中...</text>
        </view>
        <template v-else>
          <view
            class="dcl-item"
            v-for="(item, index) in companyList"
            :key="item.parentCompanyId ?? index"
            hover-class="dcl-item-hover"
            @click="selectCompany(item)"
          >
            <text class="dcl-idx">{{ index + 1 }}</text>
            <text class="dcl-name">
              {{ item.parentCompanyShortName || item.companyStandardName || '--' }}
            </text>
            <view class="dcl-arrow"></view>
          </view>
          <view class="dcl-empty" v-if="companyList.length === 0">未找到相关企业</view>
        </template>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { queryParentCompanyByDrugName } from '@/api'
  import type { CompanyShortItem } from '@/types/api'

  // #region 路由参数
  const menu = ref({ top: 0, left: 0, height: 0 })
  const drugName = ref('')
  const drugType = ref('')
  const cleanedClassification = ref('')
  // #endregion

  // #region 列表数据
  const companyList = ref<CompanyShortItem[]>([])
  const loading = ref(false)

  async function fetchCompanyList() {
    if (!drugName.value) return
    loading.value = true
    try {
      const res = await queryParentCompanyByDrugName({
        pageNum: 1,
        pageSize: 50,
        searchKey: drugName.value
      })
      companyList.value = res.data?.list || []
    } catch (e) {
      console.error('获取相关企业失败', e)
      companyList.value = []
    } finally {
      loading.value = false
    }
  }
  // #endregion

  // #region 跳转
  /** 点击企业行，进入药品统计页 */
  function selectCompany(company: CompanyShortItem) {
    const query = [
      `drugStandardName=${encodeURIComponent(drugName.value)}`,
      `parentCompanyId=${company.parentCompanyId ?? ''}`,
      `standardCompanyName=${encodeURIComponent(
        company.parentCompanyShortName || company.companyStandardName || ''
      )}`,
      `cleanedDrugType=${encodeURIComponent(drugType.value)}`,
      `cleanedClassification=${encodeURIComponent(cleanedClassification.value)}`
    ]

    uni.navigateTo({
      url: `/pages/drug-stat/index?${query.join('&')}`
    })
  }

  function goBack() {
    uni.navigateBack({ delta: 1, fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
  }
  // #endregion

  // #region 生命周期
  onLoad((options: any) => {
    menu.value = uni.getMenuButtonBoundingClientRect()

    // 读取路由参数（来自「查药品」弹窗）
    if (options?.drugName) {
      drugName.value = decodeURIComponent(options.drugName)
    }
    if (options?.drugType) {
      drugType.value = decodeURIComponent(options.drugType)
    }
    if (options?.cleanedClassification) {
      cleanedClassification.value = decodeURIComponent(options.cleanedClassification)
    }
  })

  onMounted(() => {
    fetchCompanyList()
  })
  // #endregion
</script>

<style lang="scss" scoped>
  .container {
    display: flex;
    flex-direction: column;
    padding: 20rpx 30rpx 0;
  }

  /* #region 药品信息条 */
  .dcl-drug {
    flex-shrink: 0;
    padding: 30rpx 28rpx;
    margin-bottom: 24rpx;
    background: #ffffff;
    border-radius: 32rpx;
    box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.06);

    .dcl-drug-row {
      display: flex;
      align-items: center;
      gap: 16rpx;
      flex-wrap: wrap;
    }

    .dcl-drug-name {
      font-size: 34rpx;
      font-weight: 700;
      color: #1f2329;
    }

    .dcl-tag {
      flex-shrink: 0;
      padding: 6rpx 18rpx;
      border-radius: 12rpx;
      font-size: 22rpx;
      font-weight: 600;

      &.reg {
        background: #ebf3ff;
        color: #1e6fff;
      }

      &.cat {
        background: #fdf3e3;
        color: #b45309;
      }
    }
  }
  /* #endregion */

  /* #region 结果说明与列表 */
  .dcl-note {
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

  .dcl-card {
    padding: 12rpx 24rpx;
    margin-bottom: 24rpx;
    background: #ffffff;
    border-radius: 32rpx;
    box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.06);
  }

  .dcl-item {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 28rpx 8rpx;
    border-bottom: 1rpx solid #f0f1f3;

    &:last-child {
      border-bottom: none;
    }

    &.dcl-item-hover {
      opacity: 0.7;
    }
  }

  .dcl-idx {
    width: 44rpx;
    height: 44rpx;
    flex-shrink: 0;
    border-radius: 12rpx;
    background: #ebf3ff;
    color: #1e6fff;
    font-size: 24rpx;
    font-weight: 700;
    text-align: center;
    line-height: 44rpx;
  }

  .dcl-name {
    flex: 1;
    min-width: 0;
    font-size: 30rpx;
    font-weight: 500;
    color: #1f2329;
  }

  // 右箭头（纯 CSS 绘制）
  .dcl-arrow {
    width: 16rpx;
    height: 16rpx;
    flex-shrink: 0;
    border-top: 4rpx solid #c6cbd4;
    border-right: 4rpx solid #c6cbd4;
    transform: rotate(45deg);
  }

  .dcl-loading,
  .dcl-empty {
    padding: 60rpx 0;
    font-size: 26rpx;
    color: #9ca3af;
    text-align: center;
  }
  /* #endregion */
</style>
