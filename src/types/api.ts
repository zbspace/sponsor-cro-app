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
 * 医院信息条目
 */
export interface HospitalItem {
  hosStandardId: number
  hosStandardName: string
}

/**
 * 医院信息列表响应
 */
export interface HospitalListResponse {
  list: HospitalItem[]
  pages: number
  total: number
}

/**
 * 研究者信息条目
 */
export interface ResearcherItem {
  hosStandardId: number
  hosStandardName: string
  researcherId: number
  researcherName: string
}

/**
 * 研究者信息列表响应
 */
export interface ResearcherListResponse {
  list: ResearcherItem[]
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
 * 药企&医院统计查询参数
 */
export interface HospitalStatisticsQuery {
  /** 登记号 */
  acceptanceNo?: string
  /** 药企母公司ID */
  companyParentId?: number
  /** 医院标准ID */
  hosStandardId?: number
  /** 研究者ID（页面筛选条件，后端扩展字段） */
  researcherId?: number
  /** 研究者姓名 */
  researcherName?: string
  /** 当前页数 */
  pageNum?: number
  /** 每页条数 */
  pageSize?: number
  /** 试验分期（注册分类） */
  trialStage?: string
  /** 试验状态 */
  trialStatus?: string
  /** 年份 */
  year?: string
}

/**
 * 汇总统计响应
 */
export interface HospitalStatisticsResponse {
  /** 合作试验数 */
  coopTrialNum: number
  /** 合作研究者数 */
  coopResearcherNum: number
  /** 合作产品数 */
  coopProductNum: number
}

/**
 * 试验分期响应
 */
export interface TrialStageResponse {
  /** 1类数量 */
  oneClassCount: number
  /** 2类数量 */
  twoClassCount: number
  /** 3类数量 */
  threeClassCount: number
  /** 4类数量 */
  fourClassCount: number
  /** BE类数量 */
  beClassCount: number
  /** 其他类数量 */
  otherClassCount: number
}

/**
 * 试验状态响应
 */
export interface TrialStatusResponse {
  /** 已完成-数量 */
  completed: number
  /** 进行中-尚未招募-数量 */
  trialing: number
  /** IEC/IRB暂停/终止-数量 */
  trialingIecTerminated: number
  /** 责令暂停/终止-数量 */
  trialingNoticeTerminated: number
  /** 进行中-招募完成-数量 */
  trialingRecruited: number
  /** 进行中-招募中-数量 */
  trialingRecruiting: number
  /** 主动暂停/终止-数量 */
  trialingTerminated: number
}

/**
 * 近五年试验合作变化-合作统计条目
 */
export interface CooperationSumItem {
  /** 合作数量 */
  cooperationCount: number
  /** 年份 */
  year: string
}

/**
 * 近五年试验合作变化响应
 */
export interface CooperationChangeResponse {
  /** 合作统计 */
  cooperationSumList: CooperationSumItem[]
  /** 试验分期 */
  trialStage: string
}

/**
 * 合作产品统计条目
 */
export interface DrugStatisticsItem {
  /** 药品名(标准名) */
  drugStandardName: string
  /** 试验数量 */
  trialCount: number
}

/**
 * 合作产品统计分页响应
 */
export interface DrugStatisticsResponse {
  list: DrugStatisticsItem[]
  pages: number
  total: number
}

/**
 * 合作研究者统计条目
 */
export interface ResearcherStatisticsItem {
  /** 中心 */
  hosStandardName: string
  /** 研究者 */
  researcherName: string
  /** 试验数量 */
  trialCount: number
}

/**
 * 合作研究者统计分页响应
 */
export interface ResearcherStatisticsResponse {
  list: ResearcherStatisticsItem[]
  pages: number
  total: number
}

/**
 * 试验列表条目
 */
export interface TrialItem {
  /** 登记号 */
  acceptanceNo: string
  /** 中心及研究者数量 */
  centerAndResearcherCount: number
  /** 药品名称 */
  drugName: string
  /** 适应症 */
  indication: string
  /** 发布日期 */
  publishDate: string
  /** 申请人 */
  sponsorContacts: string
  /** 申办方 */
  sponsorName: string
  /** 试验分期 */
  trialStage: string
  /** 试验状态 */
  trialStatus: string
}

/**
 * 试验列表分页响应
 */
export interface TrialListResponse {
  list: TrialItem[]
  pages: number
  total: number
}

/**
 * 中心及研究者条目
 */
export interface CenterAndResearcherItem {
  /** 中心名称 */
  hosStandardName: string
  /** 研究者姓名 */
  researcherName: string
}

/**
 * 中心及研究者列表分页响应
 */
export interface CenterAndResearcherListResponse {
  list: CenterAndResearcherItem[]
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
 * 用户收藏返回对象（公司收藏）
 */
export interface UserCollectItem {
  /** 收藏的公司类型：1-sponsor, 2-cro, 3-thirdLab */
  companyType: number
  /** 收藏记录时间 */
  createTime: string
  /** 收藏记录id */
  id: number
  /** 收藏的母公司ID */
  parentCompanyId: number
  /** 收藏的母公司简称 */
  parentCompanyShortName: string
}

/**
 * 用户收藏列表响应
 */
export interface UserCollectListResponse {
  list: UserCollectItem[]
  pages: number
  total: number
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
