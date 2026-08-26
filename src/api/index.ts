import { get, post } from '@/utils/request'
import {
  mockCroRankList,
  mockOutsourcingRatio,
  mockCroProjectList,
  mockParentShortNameList,
  mockSponsorRankList,
  mockRelatedCompanyList
} from '@/mock'
import * as mock from '@/mock'
import type {
  UserInfo,
  LoginResponse,
  IndexInfoResponse,
  EnglishQuestionResponse,
  ChineseQuestionResponse,
  WordDetailResponse,
  PayParams,
  PayQueryResponse,
  CollectListResponse,
  UserCollectListResponse,
  VipOption,
  VirtualPayData,
  VipRenewResponse,
  CroRankListResponse,
  OutsourcingRatioResponse,
  CroProjectListResponse,
  ParentCompanyListResponse,
  HospitalListResponse,
  ResearcherListResponse,
  SponsorRankListResponse,
  RelatedCompanyListResponse,
  HospitalStatisticsResponse,
  TrialStageResponse,
  TrialStatusResponse,
  CooperationChangeResponse,
  DrugStatisticsResponse,
  ResearcherStatisticsResponse,
  TrialListResponse,
  CenterAndResearcherListResponse,
  HospitalStatisticsQuery
} from '@/types/api'

// #region 登录模块

/**
 * 小程序登录
 * @param code 微信登录授权获取的 code
 * @returns Promise<LoginResponse>
 */
export async function wechatLogin(code: string) {
  // return post<LoginResponse>('/word/wechat/login', { jsCode: code }, false, mock.mockLogin)
  return post<LoginResponse>(
    '/api/v1/wechat/searchComCRO/login',
    { code: code, serverId: 'searchComCRO' },
    false,
    mock.mockLogin
  )
}

let loginPromise: Promise<void> | null = null

/**
 * 获取微信 code 并调用登录接口缓存 token（单例模式，确保只执行一次）
 */
export function ensureLogin(): Promise<void> {
  if (loginPromise) {
    return loginPromise
  }

  loginPromise = new Promise(async (resolve, reject) => {
    try {
      const { code } = await uni.login()

      console.log('code->', code)
      if (!code) {
        console.error('微信登录失败：未获取到 code')
        reject(new Error('未获取到 code'))
        return
      }
      // return console.log(code);
      const res = await wechatLogin(code)
      if (res.data) {
        // 存储用户信息对象
        setUserInfo(res.data)
      }
      resolve()
    } catch (err) {
      console.error('登录失败', err)
      loginPromise = null // 失败后重置，允许下次重试
      reject(err)
    }
  })

  return loginPromise
}

/**
 * 重置登录状态，下次调用 ensureLogin 时会重新执行登录
 */
export function resetEnsureLogin() {
  loginPromise = null
}

/**
 * 绑定手机号
 * @param code 微信获取的手机号 code
 * @returns Promise
 */
export async function bandPhone(code: string) {
  return post('/api/v1/wechat/searchComCRO/bandPhone', { code }, true)
}

// #endregion

// #region VIP支付模块

/**
 * 创建支付订单
 * @returns Promise<PayParams>
 */
export async function createOrder() {
  return post<PayParams>('/pay/createOrder', {}, true, mock.mockPayParams)
}

/**
 * 查询支付结果
 * @returns Promise<PayQueryResponse>
 */
export async function queryPayResult() {
  return get<PayQueryResponse>('/pay/queryPayResult', {}, true, mock.mockPayQuery)
}

/**
 * 获取VIP套餐列表
 * @returns Promise<VipOption[]>
 */
export async function getVipList() {
  return get<VipOption[]>('/api/vip/getVipList', {}, true)
}

/**
 * 获取虚拟支付验签数据
 * @param vipLevel VIP等级
 * @param jsCode 微信登录code
 * @param deviceType 设备类型
 * @returns Promise<VirtualPayData>
 */
export async function getVirtualPayData(vipLevel: number, jsCode: string, deviceType: string) {
  return post<VirtualPayData>(
    '/api/wechat/getVirtualPayData',
    { vipLevel, jsCode, deviceType },
    true
  )
}

/**
 * 查询订单状态并续期VIP
 * @param outTradeNo 订单号
 * @param deviceType 设备类型（IOS/Android）
 * @returns Promise<VipRenewResponse>
 */
export async function renewVipAndRecordOrder(outTradeNo: string, deviceType: string) {
  return post<VipRenewResponse>(
    '/api/wechat/renewVipAndRecordOrder',
    { outTradeNo, deviceType },
    true
  )
}

// #endregion

// #region VIP申请模块

/**
 * 申请试用（VIP申请）
 * @param data 申请信息：姓名、手机号必填，公司、职位选填
 * @returns Promise<ApiResponse>
 */
export async function applyVip(data: {
  userName: string
  userPhone: string
  userCompany?: string
  userPosition?: string
}) {
  return post('/api/vip/applicate', data, true)
}

/**
 * 查询VIP申请记录（是否存在待审批记录）
 * @returns Promise<ApiResponse<VipApplication | null>> approvalStatus：1-待审批，2-审批通过，3-审批不通过
 */
export async function getVipApplication() {
  return get<{
    approvalStatus?: number
    approvalRemark?: string
    applicateDate?: string
    userName?: string
    userPhone?: string
  } | null>('/api/vip/getVipApplication', {}, true)
}

// #endregion

// #region 首页模块

/**
 * 获取首页信息
 * @returns Promise<IndexInfoResponse>
 */
export async function getIndexInfo() {
  return get<IndexInfoResponse>('/word/index/getIndexInfo', {}, true, mock.mockIndexInfo)
}

/**
 * 获取中国临床CRO榜单
 * @param pageNum 页码
 * @param pageSize 每页条数
 * @param lastYear 最后一年份
 * * @returns Promise<CroRankListResponse>
 */
export async function selectClinicalCroRankList(data: any) {
  return post<CroRankListResponse>(
    '/api/v1/hgr/selectClinicalCroRankList',
    { ...data },
    true,
    mockCroRankList
  )
}

/**
 * 获取中国临床Lab榜单
 * @param pageNum 页码
 * @param pageSize 每页条数
 * @param lastYear 最后一年份
 * * @returns Promise<CroRankListResponse>
 */
export async function selectClinicalThirdLabRankList(data: any) {
  return post<CroRankListResponse>(
    '/api/v1/hgr/selectClinicalThirdLabRankList',
    { ...data },
    true,
    mockCroRankList
  )
}

/**
 * 获取外包比例
 * @param params { companyType, lastYear, sponsorParentCompanyId, sponsorStandardCompanyIdList }
 * @returns Promise<OutsourcingRatioResponse>
 */
export async function getOutsourcingRatio(params: {
  companyType: string
  lastYear?: number
  sponsorParentCompanyId: number
  sponsorStandardCompanyIdList?: number[]
}) {
  return post<OutsourcingRatioResponse>(
    '/api/v1/hgr/selectOutsourcingRatio',
    params,
    true,
    mockOutsourcingRatio
  )
}

/**
 * 获取CRO/中心实验室项目列表
 * @param params { companyType, lastYear, pageNum, pageSize, partnerParentCompanyId, partnerStandardCompanyIdList, sponsorParentCompanyIdList }
 * @returns Promise<CroProjectListResponse>
 */
export async function getCroProjectList(params: {
  companyType: string
  lastYear?: number
  pageNum?: number
  pageSize?: number
  partnerParentCompanyId?: number
  partnerStandardCompanyIdList?: number[]
  sponsorParentCompanyIdList?: number[]
}) {
  return post<CroProjectListResponse>(
    '/api/v1/hgr/selectCroProjectList',
    params,
    true,
    mockCroProjectList
  )
}

/**
 * 获取申办方项目列表
 * @param params { companyType, lastYear, pageNum, pageSize, partnerParentCompanyIdList, sponsorParentCompanyId, sponsorStandardCompanyIdList }
 * @returns Promise<CroProjectListResponse>
 */
export async function getSponsorProjectList(params: {
  companyType: string
  lastYear?: number
  pageNum?: number
  pageSize?: number
  partnerParentCompanyIdList?: number[]
  sponsorParentCompanyId?: number
  sponsorStandardCompanyIdList?: number[]
}) {
  return post<CroProjectListResponse>(
    '/api/v1/hgr/selectSponsorProjectList',
    params,
    true,
    mockCroProjectList
  )
}

/**
 * 查询母公司简称列表（搜索下拉）
 * @param params { companyType, pageNum, pageSize, shortName }
 * @returns Promise<ParentCompanyListResponse>
 */
export async function getParentShortNameList(params: {
  companyType: string
  pageNum: number
  pageSize: number
  shortName?: string
}) {
  return get<ParentCompanyListResponse>(
    '/api/v1/hgr/selectParentShortNameOfHGRList',
    params,
    true,
    mockParentShortNameList
  )
}

/**
 * 查询药企简称（搜索下拉）
 * @param params { id, pageNum, pageSize, searchKey }
 * @returns Promise<ParentCompanyListResponse>
 */
export async function queryPharmaShortName(params: {
  id?: number
  pageNum?: number
  pageSize?: number
  searchKey?: string
}) {
  return post<ParentCompanyListResponse>(
    '/api/v1/companyHospital/queryPharmaShortName',
    params,
    true
  )
}

/**
 * 查询医院信息（搜索下拉）
 * @param params { id, pageNum, pageSize, searchKey }
 * @returns Promise<HospitalListResponse>
 */
export async function queryHospitalData(params: {
  id?: number
  pageNum?: number
  pageSize?: number
  searchKey?: string
}) {
  return post<HospitalListResponse>('/api/v1/companyHospital/queryHospitalData', params, true)
}

/**
 * 查询研究者信息（搜索下拉）
 * @param params { id, pageNum, pageSize, searchKey }
 * @returns Promise<ResearcherListResponse>
 */
export async function queryResearcherData(params: {
  id?: number
  pageNum?: number
  pageSize?: number
  searchKey?: string
}) {
  return post<ResearcherListResponse>('/api/v1/companyHospital/queryResearcherData', params, true)
}

// #endregion

// #region 医院/研究者合作情况统计模块

/**
 * 合作情况统计-统计汇总
 * @param params 药企&医院统计查询参数
 * @returns Promise<HospitalStatisticsResponse>
 */
export async function queryHospitalStatistics(params: HospitalStatisticsQuery) {
  return post<HospitalStatisticsResponse>('/api/v1/companyHospital/queryStatistics', params, true)
}

/**
 * 合作情况统计-近5年试验合作变化
 * @param params 药企&医院统计查询参数
 * @returns Promise<CooperationChangeResponse>
 */
export async function queryHospitalCooperationChange(params: HospitalStatisticsQuery) {
  return post<CooperationChangeResponse>(
    '/api/v1/companyHospital/queryCooperationChange',
    params,
    true
  )
}

/**
 * 合作情况统计-合作产品
 * @param params 药企&医院统计查询参数
 * @returns Promise<DrugStatisticsResponse>
 */
export async function queryHospitalCooperationProduct(params: HospitalStatisticsQuery) {
  return post<DrugStatisticsResponse>(
    '/api/v1/companyHospital/queryCooperationProduct',
    params,
    true
  )
}

/**
 * 合作情况统计-合作研究者情况
 * @param params 药企&医院统计查询参数
 * @returns Promise<ResearcherStatisticsResponse>
 */
export async function queryHospitalCooperationResearcher(params: HospitalStatisticsQuery) {
  return post<ResearcherStatisticsResponse>(
    '/api/v1/companyHospital/queryCooperationResearcher',
    params,
    true
  )
}

/**
 * 合作情况统计-试验分期
 * @param params 药企&医院统计查询参数
 * @returns Promise<TrialStageResponse>
 */
export async function queryHospitalTrialStage(params: HospitalStatisticsQuery) {
  return post<TrialStageResponse>('/api/v1/companyHospital/queryTrialStage', params, true)
}

/**
 * 合作情况统计-试验状态
 * @param params 药企&医院统计查询参数
 * @returns Promise<TrialStatusResponse>
 */
export async function queryHospitalTrialStatus(params: HospitalStatisticsQuery) {
  return post<TrialStatusResponse>('/api/v1/companyHospital/queryTrialStatus', params, true)
}

/**
 * 实验分期枚举
 * @returns Promise<string[]>
 */
export async function getTrialStageOptions() {
  return get<string[]>('/api/v1/companyHospital/trialStageOptions', {}, true)
}

/**
 * 试验状态枚举
 * @returns Promise<string[]>
 */
export async function getTrialStatusOptions() {
  return get<string[]>('/api/v1/companyHospital/trialStatusOptions', {}, true)
}

/**
 * 合作情况统计-试验列表
 * @param params 药企&医院统计查询参数
 * @returns Promise<TrialListResponse>
 */
export async function queryHospitalTrialList(params: HospitalStatisticsQuery) {
  return post<TrialListResponse>('/api/v1/companyHospital/queryTrialList', params, true)
}

/**
 * 合作情况统计-试验列表-中心及研究者列表
 * @param params 药企&医院统计查询参数
 * @returns Promise<CenterAndResearcherListResponse>
 */
export async function queryCenterAndResearcherList(params: HospitalStatisticsQuery) {
  return post<CenterAndResearcherListResponse>(
    '/api/v1/companyHospital/queryCenterAndResearcherList',
    params,
    true
  )
}

// #endregion

/**
 * 获取CRO/中心实验室sponsor合作名单
 * @param params { companyType, lastYear, pageNum, pageSize, partnerParentCompanyId, partnerStandardCompanyIdList }
 * @returns Promise<SponsorRankListResponse>
 */
export async function getClinicalSponsorRankList(params: {
  companyType: string
  lastYear?: number
  pageNum?: number
  pageSize?: number
  partnerParentCompanyId?: number
  partnerStandardCompanyIdList?: number[]
}) {
  return post<SponsorRankListResponse>(
    '/api/v1/hgr/selectClinicalSponsorRankList',
    params,
    true,
    mockSponsorRankList
  )
}

/**
 * 获取相关公司列表
 * @param params { companyType, pageNum, pageSize, parentCompanyId }
 * @returns Promise<RelatedCompanyListResponse>
 */
export async function getRelatedCompanyList(params: {
  companyType: string
  pageNum: number
  pageSize: number
  parentCompanyId: number
}) {
  return get<RelatedCompanyListResponse>(
    '/api/v1/hgr/selectRelatedCompanyList',
    params,
    true,
    mockRelatedCompanyList
  )
}

// #endregion

// #region 用户收藏模块

/**
 * 收藏公司
 * @param companyType 收藏的公司类型：1-sponsor, 2-cro, 3-thirdLab
 * @param parentCompanyId 收藏的母公司ID
 * @returns Promise
 */
export async function userCollect(companyType: number, parentCompanyId: number) {
  return post(
    '/api/v1/userCollect/collect',
    { companyType, parentCompanyId, serverId: 'searchComCRO' },
    true
  )
}

/**
 * 取消收藏
 * @param id 收藏记录id
 * @returns Promise
 */
export async function cancelUserCollect(id: number) {
  return get('/api/v1/userCollect/cancelCollect', { id }, true)
}

/**
 * 获取用户收藏列表
 * @param pageNum 页码
 * @param pageSize 每页条数
 * @returns Promise
 */
export async function getUserCollectList(data: any) {
  return get<UserCollectListResponse>(
    '/api/v1/userCollect/getCollectList',
    { serverId: 'searchComCRO', ...data },
    true
  )
}

// #endregion

// #region 单词背诵模块

/**
 * 获取英文题目详情
 * @param wordId 单词 ID
 * @returns Promise<EnglishQuestionResponse>
 */
export async function getEnglishQuestionDetailByWordId(wordId: number) {
  return get<EnglishQuestionResponse>(
    '/word/recite/getEnglishQuestionDetailByWordId',
    { wordId },
    true,
    mock.mockEnglishQuestion
  )
}

/**
 * 提交单词背诵答题结果
 * @param wordId 单词 ID
 * @param answerResult 答题结果，true 正确，false 错误
 * @returns Promise
 */
export async function reciteWord(wordId: number, answerResult: boolean) {
  return post('/word/recite/reciteWord', { wordId, answerResult }, true, null)
}

// #endregion

// #region 单词详情模块

/**
 * 获取已背诵单词列表
 * @param pageNum 页码
 * @param pageSize 每页条数
 * @returns Promise<CollectListResponse>
 */
export async function getReciteWordList(pageNum: number = 1, pageSize: number = 20) {
  return get<CollectListResponse>(
    '/word/word/getReciteWordList',
    { pageNum, pageSize },
    true,
    mock.mockCollectList
  )
}

/**
 * 获取待复习单词列表
 * @param pageNum 页码
 * @param pageSize 每页条数
 * @returns Promise<CollectListResponse>
 */
export async function getReviewWordList(pageNum: number = 1, pageSize: number = 20) {
  return get<CollectListResponse>(
    '/word/word/getReviewWordList',
    { pageNum, pageSize },
    true,
    mock.mockCollectList
  )
}

/**
 * 获取单词详情
 * @param wordId 单词 ID
 * @param wordType 单词场景类型，recite(背诵时)，recite(已背诵)，review(待复习)，collected(已收藏)
 * @returns Promise<WordDetailResponse>
 */
export async function getWordDetailByWordId(wordId: number, wordType: string) {
  return get<WordDetailResponse>(
    '/word/word/getWordDetailByWordId',
    { wordId, wordType },
    true,
    mock.mockWordDetail
  )
}

// #endregion

// #region 收藏模块

/**
 * 获取收藏列表
 * @param pageNum 页码
 * @param pageSize 每页条数
 * @returns Promise<CollectListResponse>
 */
export async function getCollectList(pageNum: number = 1, pageSize: number = 20) {
  return get<CollectListResponse>(
    '/word/word/getCollectWordList',
    { pageNum, pageSize },
    true,
    mock.mockCollectList
  )
}

/**
 * 确认单词收藏状态
 * @param wordId 单词 ID
 * @returns Promise<{ collectResult: boolean }>
 */
export async function confirmCollect(wordId: number) {
  return get<{ collectResult: boolean }>('/word/collect/confirmCollectWord', { wordId }, true)
}

/**
 * 取消单词收藏状态
 * @param wordId 单词 ID
 * @returns Promise<{ collectResult: boolean }>
 */
export async function cancelCollect(wordId: number) {
  return get<{ collectResult: boolean }>('/word/collect/cancelCollectWord', { wordId }, true)
}

// #endregion

// #region 复习详情模块

/**
 * 获取中文题目详情
 * @param wordId 单词 ID
 * @returns Promise<ChineseQuestionResponse>
 */
export async function getChineseQuestionDetail(wordId: number) {
  return get<ChineseQuestionResponse>('/word/review/getChineseQuestionDetailByWordId', { wordId })
}

/**
 * 提交单词复习答题结果
 * @param wordId 单词 ID
 * @param answerResult 答题结果，true 正确，false 错误
 * @returns Promise
 */
export async function reviewWord(wordId: number, answerResult: boolean) {
  return post('/word/review/reviewWord', { wordId, answerResult })
}

// #endregion

// region Token 与用户信息管理

/**
 * 设置用户信息到本地存储
 * @param userInfo 用户信息对象
 */
export function setUserInfo(userInfo: UserInfo) {
  uni.setStorageSync('userInfo', userInfo)
}

/**
 * 从本地存储获取用户信息
 * @returns 用户信息对象或 null
 */
export function getUserInfo(): UserInfo | null {
  return uni.getStorageSync('userInfo') || null
}

/**
 * 从本地存储获取 Token (jwt token)
 * @returns Token 字符串
 */
export function getToken(): string {
  const userInfo = getUserInfo()
  return userInfo ? userInfo.token : ''
}

/**
 * 从本地存储获取 VIP 状态
 * @returns VIP 状态码 1=是，0=否
 */
export function getVip(): number {
  const userInfo = getUserInfo()
  return userInfo ? (userInfo.vip ? 1 : 0) : 0
}

/**
 * 从本地存储移除用户信息
 */
export function removeUserInfo() {
  uni.removeStorageSync('userInfo')
}

// endregion
