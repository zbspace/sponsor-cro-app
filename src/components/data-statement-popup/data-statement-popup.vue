<template>
  <view class="popup-mask" v-if="visible" @click="close">
    <view class="popup-content" @click.stop>
      <view class="popup-header">
        <text class="popup-title">数据声明</text>
        <image
          class="close-icon"
          src="../../static/icons/close.png"
          @click="close"
          mode="aspectFit"
        />
      </view>
      <scroll-view scroll-y="true" class="popup-body" :show-scrollbar="false">
        <view class="scroll-content">
          <!-- 一、词汇数据整理者简介 -->
          <view class="section">
            <view class="section-title">
              <view class="index-box">一</view>
              <text>词汇数据整理者简介</text>
            </view>
            <view class="highlight-card">
              <text>
                本小程序临床研究核心词汇数据库，由行业从业者
                <text class="bold">汤安邦</text>
                独立整理、校对、优化并编撰完成。
              </text>
            </view>
            <view class="paragraph">
              <text>
                整理者自
                <text class="bold">2011 年</text>
                正式进入临床研究行业，长期就职于外资医药研发企业，积累了
                <text class="bold">多年一线国际临床研究实操经验</text>
                。
              </text>
            </view>
            <view class="paragraph">
              <text>
                依托外资企业国际化、标准化的工作体系，日常工作需高频研读、运用各类原版英文行业资料，深度接触
                ICH-GCP
                规范、国际项目文件等权威英文内容，熟练掌握临床研究专属英文用语与句式体系，为本次词汇库整理的
                <text class="bold">专业性、精准性、实用性</text>
                提供了扎实的一线实践支撑。
              </text>
            </view>
          </view>

          <!-- 二、词汇数据来源 -->
          <view class="section">
            <view class="section-title">
              <view class="index-box">二</view>
              <text>词汇数据来源</text>
            </view>
            <view class="paragraph">
              <text>
                本次词汇库所有词汇释义、固定搭配及配套例句，均来源于临床研究权威官方资料与真实一线工作场景，素材来源严格遵循行业标准，具备
                <text class="bold">高专业性、高权威性、高适配性</text>
                三大特点，核心素材覆盖范围如下：
              </text>
            </view>
            <view class="sub-label">核心素材来源</view>
            <view class="list-item">
              <view class="dot green"></view>
              <view class="list-content">
                <text class="list-title">国际权威规范</text>
                <text class="list-desc">ICH-GCP 国际药物临床试验质量管理规范</text>
              </view>
            </view>
            <view class="list-item">
              <view class="dot blue"></view>
              <view class="list-content">
                <text class="list-title">项目核心文件</text>
                <text class="list-desc">原版临床试验方案、知情同意书 (ICF)、临床试验报告等</text>
              </view>
            </view>
            <view class="list-item">
              <view class="dot gray"></view>
              <view class="list-content">
                <text class="list-title">行业官方资料</text>
                <text class="list-desc">国内外药监指导原则、行业标准化技术文件</text>
              </view>
            </view>
            <view class="list-item">
              <view class="dot orange"></view>
              <view class="list-content">
                <text class="list-title">企业实操文件</text>
                <text class="list-desc">外资药企通用的标准化工作文书、项目沟通材料等</text>
              </view>
            </view>
          </view>

          <!-- 三、词汇整理初心与核心意义 -->
          <view class="section">
            <view class="section-title">
              <view class="index-box">三</view>
              <text>词汇整理初心与核心意义</text>
            </view>
            <view class="paragraph">
              <text>
                临床研究是高度国际化、标准化的医药细分领域。绝大多数国际项目规范、核心技术文件、官方指导原则均以英文为标准载体，
                <text class="bold">专业英文能力是临床研究从业者的必备基础职业素养</text>
                ，贯穿项目立项、执行、核查、结题的全工作流程。
              </text>
            </view>
            <view class="sub-label">专业英文能力的关键价值</view>
            <view class="value-card">
              <text>
                从职业发展角度来看，专业英文能力是从业者
                <text class="bold">拉开差距、突破职业瓶颈</text>
                的核心竞争力：
              </text>
            </view>
            <view class="icon-item">
              <!-- <view class="icon-box green">
                <text class="check">✓</text>
              </view> -->
              <view class="icon-content">
                <text class="bold">对于行业新人</text>
                ：可快速扫清英文资料阅读障碍，夯实专业基础，缩短入门成长周期
              </view>
            </view>
            <view class="icon-item">
              <!-- <view class="icon-box blue">
                <view class="user-icon"></view>
              </view> -->
              <view class="icon-content">
                <text class="bold">对于在职从业者</text>
                ：可精进国际项目适配能力，熟练对接海外项目、研读原版权威资料，拓展职业发展边界与晋升空间
              </view>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
  defineProps<{
    visible: boolean
  }>()

  const emit = defineEmits(['update:visible'])

  const close = () => {
    emit('update:visible', false)
  }
</script>

<style lang="scss" scoped>
  .popup-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    padding: 20rpx;
  }

  .popup-content {
    width: 100%;
    max-height: 85vh;
    background-color: #fff;
    border-radius: 24rpx;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .popup-header {
    padding: 20rpx 30rpx;
    border-bottom: 2rpx solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #fff;

    .popup-title {
      font-weight: bold;
      font-size: 28rpx;
      color: #293959;
      line-height: 52rpx;
    }

    .close-btn {
      font-size: 44rpx;
      color: #999;
      padding: 20rpx;
      line-height: 1;
    }
  }

  .popup-body {
    height: 70vh; // 使用相对高度，确保在内容超出时可以滚动
    padding: 20rpx 30rpx;
    background-color: #f8fafc;
    box-sizing: border-box;

    .scroll-content {
      padding-bottom: 20rpx; // 底部留白
    }

    .section {
      background-color: #fff;
      border-radius: 16rpx;
      padding: 20rpx;
      margin-bottom: 30rpx;
      box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.03);

      &:last-child {
        margin-bottom: 0;
      }
    }

    .section-title {
      display: flex;
      align-items: center;
      margin-bottom: 30rpx;
      font-size: 30rpx;
      font-weight: bold;
      color: #333;

      .index-box {
        width: 44rpx;
        height: 44rpx;
        background-color: #e0f2fe;
        color: #0ea5e9;
        border-radius: 8rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 24rpx;
        margin-right: 20rpx;
      }
    }

    .highlight-card {
      background-color: #f0fdf4;
      border-left: 8rpx solid #22c55e;
      padding: 20rpx;
      border-radius: 8rpx;
      margin-bottom: 24rpx;
      font-size: 26rpx;
      line-height: 1.6;
      color: #374151;
    }

    .paragraph {
      font-size: 26rpx;
      line-height: 1.6;
      color: #4b5563;
      margin-bottom: 24rpx;

      &:last-child {
        margin-bottom: 0;
      }
    }

    .bold {
      font-weight: bold;
      color: #111827;
    }

    .sub-label {
      font-size: 24rpx;
      color: #9ca3af;
      margin-bottom: 20rpx;
    }

    .list-item {
      display: flex;
      background-color: #f9fafb;
      padding: 20rpx;
      border-radius: 12rpx;
      margin-bottom: 16rpx;
      align-items: flex-start;

      .dot {
        width: 12rpx;
        height: 12rpx;
        border-radius: 50%;
        margin-top: 14rpx;
        margin-right: 20rpx;
        flex-shrink: 0;

        &.green {
          background-color: #22c55e;
        }
        &.blue {
          background-color: #3b82f6;
        }
        &.gray {
          background-color: #94a3b8;
        }
        &.orange {
          background-color: #f97316;
        }
      }

      .list-content {
        flex: 1;
      }

      .list-title {
        display: block;
        font-size: 26rpx;
        font-weight: bold;
        color: #374151;
        margin-bottom: 4rpx;
      }

      .list-desc {
        font-size: 24rpx;
        color: #6b7280;
      }
    }

    .value-card {
      background-color: #f5f3ff;
      padding: 24rpx;
      border-radius: 12rpx;
      margin-bottom: 24rpx;
      font-size: 26rpx;
      line-height: 1.6;
      color: #5b21b6;
    }

    .icon-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 24rpx;

      .icon-box {
        width: 52rpx;
        height: 52rpx;
        border-radius: 12rpx;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-right: 20rpx;
        flex-shrink: 0;

        &.green {
          background-color: #dcfce7;
          color: #15803d;
        }
        &.blue {
          background-color: #dbeafe;
          color: #1d4ed8;
        }
      }

      .check {
        font-size: 28rpx;
        font-weight: bold;
      }

      .user-icon {
        width: 20rpx;
        height: 20rpx;
        border: 4rpx solid #1d4ed8;
        border-radius: 50%;
        position: relative;

        &::after {
          content: '';
          position: absolute;
          top: 20rpx;
          left: -4rpx;
          width: 28rpx;
          height: 12rpx;
          border: 4rpx solid #1d4ed8;
          border-bottom: none;
          border-radius: 12rpx 12rpx 0 0;
        }
      }

      .icon-content {
        font-size: 26rpx;
        line-height: 1.6;
        color: #4b5563;
        flex: 1;
      }
    }
  }
</style>
