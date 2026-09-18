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
 * 标准公司条目（不含母公司的标准公司信息）
 */
export interface StandardCompanyItem {
  /** 简称 */
  companyShortName: string
  /** 标准名 */
  companyStandardName: string
  /** 类型 */
  companyType: string
  /** 父级ID */
  parentCompanyId: number
  /** 父级公司简称 */
  parentCompanyShortName: string
  /** 标准库ID */
  standardId: number
}

/**
 * 标准公司列表响应
 */
export interface StandardCompanyListResponse {
  list: StandardCompanyItem[]
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
  /** 试验分期字符串 */
  trialStageStr: string
  /** 试验状态字符串 */
  trialStatusStr: string
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
  /** 会员编码：0-普通用户 1-VIP试用 100-VIP用户 */
  vipCode?: number
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
  /** 会员编码：0-普通用户 1-VIP试用 100-VIP用户 */
  vipCode?: number
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
  /** 会员编码：0-普通用户 1-VIP试用 100-VIP用户 */
  vipCode?: number
  vipExpirationTime: string
  streak: any
  lastDay: any
  createTime: any
}

// #region 查客户首页模块

/**
 * 查客户首页请求对象
 */
export interface SearchCustIndexReq {
  /** 母公司ID */
  parentCompanyId?: number
  /** 子公司ID集合 */
  standardCompanyIdList?: number[]
}

/**
 * 查客户首页商机线索总的统计返回对象
 */
export interface BusinessClueStatisticsResponse {
  /** 上市后 */
  afterListingNum: number
  /** 上市前 */
  beforeListingNum: number
  /** 企业联系人 */
  businessContactNum: number
  /** 最值得跟进产品 */
  worthyProductsNum: number
}

/**
 * 查客户首页供应商合作记录统计返回对象
 */
export interface CroAndThirdLabStatisticsResponse {
  /** CRO公司数 */
  croStatisticsNum: number
  /** 中心实验室数 */
  thirdLabStatisticsNum: number
}

/**
 * 查客户首页研发管线总的统计返回对象
 */
export interface PipelineStatisticsResponse {
  /** 新药临床试验申请（IND）数 */
  indStatisticsNum: number
  /** 临床试验登记（CDE）数 */
  cdeStatisticsNum: number
  /** 新药上市申请（NDA）数 */
  ndaStatisticsNum: number
}

/**
 * 查客户首页医院&研究者合作记录统计返回对象
 */
export interface HospitalAndMainResearcherStatisticsResponse {
  /** 医院数量 */
  hosCount: number
  /** 主要研究者数量 */
  mainResearcherCount: number
}

// #endregion

// #region 研发管线-IND模块

/**
 * 研发管线-母公司维度查询对象（子公司集合）
 */
export interface PipelineCompanyQuery {
  /** 母公司ID */
  parentCompanyId?: number
  /** 子公司ID集合 */
  standardCompanyIdList?: number[]
}

/**
 * 研发管线-IND-申请与获批数量查询对象
 */
export interface IndApplicationNumReq extends PipelineCompanyQuery {
  /** 查询类型(1:申请,2:获批) */
  queryType?: number
}

/**
 * 研发管线-IND-申请与获批数量返回对象
 */
export interface IndApplicationNumItem {
  /** 申请或获批数量 */
  number: number
  /** 年份 */
  year: number
}

/**
 * 研发管线-IND-注册分类查询对象
 */
export interface IndRegistrationCategoryNumReq extends PipelineCompanyQuery {
  /** 药品类型(中药,化药,治疗生物药,疫苗) */
  drugType?: string
}

/**
 * 研发管线-IND-注册分类/药品类型返回对象
 */
export interface RegistrationCategoryItem {
  /** 分类(药品类型)名称 */
  drugType: string
  /** 分类(药品类型)数量 */
  number: number
}

/**
 * 研发管线-IND-药品类型数量查询对象
 */
export interface DrugTypeNumReq extends PipelineCompanyQuery {
  /** 查询年份 */
  queryYear?: number
}

/**
 * 研发管线-IND-药品类型数量返回对象（与注册分类返回结构一致）
 */
export type DrugTypeNumItem = RegistrationCategoryItem

/**
 * 研发管线-IND-榜单查询对象
 */
export interface IndProductRankReq extends PipelineCompanyQuery {
  /** 当前页数 */
  pageNum?: number
  /** 每页条数 */
  pageSize?: number
  /** 查询年份 */
  queryYear?: number
}

/**
 * 研发管线-IND-榜单返回对象
 */
export interface IndProductRankItem {
  /** 清洗后分类 */
  cleanedClassification: string
  /** 清洗后的药品名称 */
  drugStandardName: string
  /** ind申请记录数量 */
  indApplicationNum: number
  /** 排名序号 */
  rankNo: number
}

/**
 * 研发管线-IND-榜单分页响应
 */
export interface IndProductRankResponse {
  list: IndProductRankItem[]
  pages: number
  total: number
}

/**
 * 研发管线-IND-列表查询对象
 */
export interface IndApplicationListReq extends PipelineCompanyQuery {
  /** 清洗后分类 */
  cleanedClassification?: string
  /** 清洗后药品类型 */
  cleanedDrugType?: string
  /** 清洗后的药品名称 */
  drugStandardName?: string
  /** 当前页数 */
  pageNum?: number
  /** 每页条数 */
  pageSize?: number
  /** 查询年份 */
  queryYear?: number
}

/**
 * 研发管线-IND-列表返回对象
 */
export interface IndApplicationItem {
  /** 受理号 */
  acceptanceNo: string
  /** 申请人(标准企业名) */
  applicationCompany: string
  /** 申请状态(审核中,备案未通过,备案通过) */
  applicationStatus: string
  /** 通过时间 */
  approvalTime: string
  /** 清洗后分类 */
  cleanedClassification: string
  /** 清洗后药品类型 */
  cleanedDrugType: string
  /** 清洗后的药品名称 */
  drugStandardName: string
  /** 适应症 */
  indication: string
  /** 承办日期 */
  undertakeDate: string
}

/**
 * 研发管线-IND-列表分页响应
 */
export interface IndApplicationListResponse {
  list: IndApplicationItem[]
  pages: number
  total: number
}

// #endregion

// #region 研发管线-CDE模块

/**
 * 研发管线-CDE-近5年临床试验公示查询对象
 */
export interface CdeApplicationNumReq extends PipelineCompanyQuery {
  /** 查询分期(BE,Ⅰ期,Ⅱ期,Ⅲ期,Ⅳ期,其他) */
  cleanedTrialStages?: string
}

/**
 * 研发管线-CDE-近5年临床试验公示返回对象（与申请与获批数量返回结构一致）
 */
export type CdeApplicationNumItem = IndApplicationNumItem

/**
 * 研发管线-CDE-试验分期/试验状态数量查询对象
 */
export interface CdeTrialStagesOrStatusNumReq extends PipelineCompanyQuery {
  /** 查询年份 */
  queryYear?: number
}

/**
 * 研发管线-CDE-试验分期返回对象
 */
export interface CdeTrialStageItem {
  /** 试验分期类型 */
  cleanedTrialStages: string
  /** 试验分期数量 */
  number: number
}

/**
 * 研发管线-CDE-试验状态返回对象
 */
export interface CdeTrialStatusItem {
  /** 试验状态类型 */
  trialStatus: string
  /** 试验状态数量 */
  number: number
}

/**
 * 研发管线-CDE-榜单查询对象
 */
export interface CdeProductRankReq extends PipelineCompanyQuery {
  /** 当前页数 */
  pageNum?: number
  /** 每页条数 */
  pageSize?: number
  /** 查询年份 */
  queryYear?: number
}

/**
 * 研发管线-CDE-榜单返回对象
 */
export interface CdeProductRankItem {
  /** cde临床试验数量 */
  cdeTrialNum: number
  /** 清洗后的药品名称 */
  drugStandardName: string
  /** 排名序号 */
  rankNo: number
}

/**
 * 研发管线-CDE-榜单分页响应
 */
export interface CdeProductRankResponse {
  list: CdeProductRankItem[]
  pages: number
  total: number
}

/**
 * 研发管线-CDE-试验列表查询对象
 */
export interface CdeTrailListReq extends PipelineCompanyQuery {
  /** 查询分期(BE,Ⅰ期,Ⅱ期,Ⅲ期,Ⅳ期,其他) */
  cleanedTrialStages?: string
  /** 清洗后的药品名称 */
  drugStandardName?: string
  /** 当前页数 */
  pageNum?: number
  /** 每页条数 */
  pageSize?: number
  /** 查询年份 */
  queryYear?: number
  /** 试验状态类型(主动暂停,已完成,被叫停,进行中) */
  trialStatus?: string
}

/**
 * 研发管线-CDE-试验列表返回对象
 */
export interface CdeTrialItem {
  /** 登记号 */
  acceptanceNo: string
  /** 申请方(标准企业名) */
  applicationCompany: string
  /** 中心及研究者数量 */
  centerAndResearcherNum: number
  /** 试验分期(Ⅰ期,Ⅱ期,Ⅲ期,Ⅳ期,BE,其他) */
  cleanedTrialStages: string
  /** 清洗后的药品名称 */
  drugStandardName: string
  /** 首次公示日期 */
  firstPublicityDate: string
  /** 适应症 */
  indication: string
  /** 申请人(申请方) */
  sponsorContacts: string
  /** 试验状态 */
  trialStatus: string
}

/**
 * 研发管线-CDE-试验列表分页响应
 */
export interface CdeTrailListResponse {
  list: CdeTrialItem[]
  pages: number
  total: number
}

/**
 * 研发管线-CDE-中心及研究者查询对象
 */
export interface CdeCenterAndResearcherReq {
  /** 登记号 */
  acceptanceNo?: string
  /** 当前页数 */
  pageNum?: number
  /** 每页条数 */
  pageSize?: number
}

// #endregion

// #region NDA模块

/**
 * NDA-统计公共查询对象
 */
export interface NdaDataStatisticsParam {
  /** 药企母公司ID */
  companyParentId?: number
  /** 当前页数 */
  pageNum?: number
  /** 每页条数 */
  pageSize?: number
  /** 试验分期 */
  trialStage?: string
  /** 年份 */
  year?: string
}

/**
 * NDA-药品类型统计返回对象
 */
export interface NdaDrugTypeVo {
  /** 药品类型统计-化药 */
  drugTypeCountHuaYao?: number
  /** 药品类型统计-其他 */
  drugTypeCountOther?: number
  /** 药品类型统计-预防用生物制品 */
  drugTypeCountYfShengWu?: number
  /** 药品类型统计-中药/天然药物 */
  drugTypeCountZhongYao?: number
  /** 药品类型统计-治疗用生物制品 */
  drugTypeCountZlShengWu?: number
  /** 年份 */
  year?: string
}

/**
 * NDA-近5年申请和获批查询对象
 */
export interface NdaApplyAndApproveParam {
  /** 药企母公司ID */
  parentCompanyId?: number
  /** 查询类型 0-申请，1-获批 */
  queryType?: number
  /** 子公司ID集合 */
  standardCompanyIdList?: number[]
}

/**
 * NDA-近5年项目统计项
 */
export interface NdaProjectSumVo {
  /** 项目数量 */
  projectCount?: number
  /** 年份 */
  year?: number
}

/**
 * NDA-近5年申请和获批返回对象
 */
export interface NdaLastYearProjectVo {
  /** 项目统计 */
  projectSumList?: NdaProjectSumVo[]
  /** 查询类型名称 0-申请，1-获批 */
  queryTypeName?: string
}

/**
 * NDA-近5年申请注册分类查询对象
 */
export interface NdaLastYearRegisterCategoryParam {
  /** 药品类型:1-化药,2-预防用生物制品,3-治疗用生物制品,4-中药/天然药物 */
  drugTypeCode?: number
  /** 药企母公司ID */
  parentCompanyId?: number
  /** 子公司ID集合 */
  standardCompanyIdList?: number[]
}

/**
 * NDA-近5年申请注册分类返回对象
 */
export interface NdaLastYearRegisterCategoryVo {
  /** 药品类型 */
  drugTypeName?: string
  /** 注册分类1 */
  registerCategory1?: number
  /** 注册分类2 */
  registerCategory2?: number
  /** 注册分类3 */
  registerCategory3?: number
  /** 注册分类4 */
  registerCategory4?: number
  /** 注册分类5 */
  registerCategory5?: number
  /** 注册分类-其他 */
  registerCategoryOther?: number
}

/**
 * NDA-列表返回对象
 */
export interface NdaProductDataVo {
  /** 受理号 */
  acceptanceNo?: string
  /** 申请日期 */
  applyDate?: string
  /** 申请状态 */
  applyStatus?: string
  /** 批准日期 */
  approveDate?: string
  /** 药品名（清洗后） */
  cleanedDrugName?: string
  /** 药品类型(清洗后) */
  cleanedDrugType?: string
  /** 签发日期 */
  issueDate?: string
  /** 注册分类 */
  registerCategoryList?: string[]
  /** 企业名称(标准名) */
  standardCompanyName?: string
}

/**
 * NDA-列表分页响应
 */
export interface NdaProductDataListResponse {
  list?: NdaProductDataVo[]
  pages?: number
  total?: number
}

/**
 * NDA-产品NDA榜单项
 */
export interface NdaProductRankVo {
  /** 申请数量 */
  applyCount?: number
  /** 母公司ID */
  companyParentId?: number
  /** 项目名称 */
  projectName?: string
  /** 注册分类 */
  registerCategory?: string
  /** 注册分类名称 */
  registerCategoryName?: string
}

// #endregion
