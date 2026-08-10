/**
 * 外包比例响应
 */
export interface OutsourcingRatioResponse {
  outsourcingCroRatio: number
  selfRatio: number
}

/**
 * CRO/中心实验室项目列表条目
 */
export interface CroProjectItem {
  approvalRecordTime: string
  category: string
  geneticInfoId: number
  partnerParentCompanyShortName: string
  projectName: string
  projectNo: string
  sponsorStandardCompanyName: string
}

/**
 * CRO/中心实验室项目列表响应
 */
export interface CroProjectListResponse {
  list: CroProjectItem[]
  pages: number
  total: number
}

/**
 * 母公司简称条目
 */
export interface ParentCompanyItem {
  parentCompanyId: number
  parentCompanyShortName: string
}

/**
 * 母公司简称列表响应
 */
export interface ParentCompanyListResponse {
  list: ParentCompanyItem[]
  pages: number
  total: number
}

/**
 * CRO/中心实验室 sponsor合作名单条目
 */
export interface SponsorRankItem {
  cooperationEnterpriseNum: number
  parentCompanyId: number
  parentCompanyShortName: string
  projectExperienceNum: number
  rankNo: number
}

/**
 * CRO/中心实验室 sponsor合作名单响应
 */
export interface SponsorRankListResponse {
  list: SponsorRankItem[]
  pages: number
  total: number
}

/**
 * 相关公司条目
 */
export interface RelatedCompanyItem {
  companyStandardName: string
  standardCompanyId: number
}

/**
 * 相关公司列表响应
 */
export interface RelatedCompanyListResponse {
  list: RelatedCompanyItem[]
  pages: number
  total: number
}

/**
 * CRO 榜单条目
 */
export interface CroRankItem {
  cooperationEnterpriseNum: number
  parentCompanyId: number
  parentCompanyShortName: string
  projectExperienceNum: number
  rankNo: number
}

/**
 * CRO 榜单分页响应
 */
export interface CroRankListResponse {
  list: CroRankItem[]
  pages: number
  total: number
}

/**
 * 用户信息接口
 */
export interface UserInfo {
  token: string
  vip: boolean
  avatarUrl?: string
  nickname?: string
  phone?: string
  vipExpirationTime?: string
}

/**
 * 登录响应接口
 */
export interface LoginResponse {
  token: string
  vip: boolean
  avatarUrl?: string
  nickname?: string
}

/**
 * 首页信息响应接口
 */
export interface IndexInfoResponse {
  accuracy: string
  streak: number
  allDays: number
  progress: string
  nextWordId: number | null
  allWordsNum: number
  recitedWordsNum: number
  toReviewWordsNum: number
  collectWordsNum: number
}

/**
 * 题目选项接口
 */
export interface QuestionAnswer {
  wordId: number
  answer: string
  simpleAnswer: string
  annotation: string
  correctAnswer: boolean
}

/**
 * 英文题目响应接口
 */
export interface EnglishQuestionResponse {
  questionContent: string
  questionAnswerList: QuestionAnswer[]
}

/**
 * 中文题目响应接口
 */
export interface ChineseQuestionResponse {
  currentOrder: number
  reviewWordsNum: number
  currentReviewIndex: number
  totalReviewNum: number
  questionContent: string
  questionAnswerList: QuestionAnswer[]
}

/**
 * 单词详情响应接口
 */
export interface WordDetailResponse {
  id: number
  wordNo: number
  word: string
  phoneticSymbol: string
  definition: string
  level: string
  exampleSentence: string
  collectResult: boolean
  nextWordId: number | null
}

/**
 * 支付参数接口
 */
export interface PayParams {
  prepay_id: string
  paySign: string
  nonceStr: string
  timeStamp: string
  signType: string
}

/**
 * 支付查询响应接口
 */
export interface PayQueryResponse {
  vipSetSuccess: boolean
  orderStatus: string
}

/**
 * 收藏单词简要信息
 */
export interface CollectWordItem {
  id: number
  word: string
  phoneticSymbol: string
  definition: string
  collectResult: boolean
  reviewResult: boolean
}

/**
 * 收藏列表响应接口
 */
export interface CollectListResponse {
  total: number
  list: CollectWordItem[]
  pageNum: number
  pageSize: number
  totalPage: number
}

/**
 * VIP 套餐选项接口
 */
export interface VipOption {
  vipName: string
  vipLevel: number
  vipPrice: number
  validityPeriod: number
  vipLabel: string
}

/**
 * 虚拟支付验签数据接口
 */
export interface VirtualPayData {
  signData: string
  mode: string
  paySig: string
  signature: string
  outTradeNo: string
}

/**
 * VIP 续期响应接口
 */
export interface VipRenewResponse {
  openid: string | null
  vip: boolean
  vipExpirationTime: string
  streak: any
  lastDay: any
  createTime: any
}
