import type {
  IndexInfoResponse,
  EnglishQuestionResponse,
  LoginResponse,
  WordDetailResponse,
  CollectListResponse,
  PayParams,
  PayQueryResponse,
  CroRankListResponse,
  OutsourcingRatioResponse,
  CroProjectListResponse,
  ParentCompanyListResponse,
  SponsorRankListResponse
} from '@/types/api'

/**
 * 模拟登录数据
 */
export const mockLogin: LoginResponse = {
  token: 'mock_jwt_token_123456',
  vip: true,
  avatarUrl:
    'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwhPtaz6ic6reZ16e4wFichyZicC6zVibKiacT9iaR1S0lKVYv1A1kYiafN7SiaicMficA0ic1S6icMficA0ic1S6icMficA0ic1S6/132',
  nickname: '微信用户'
}

/**
 * 模拟首页数据
 */
export const mockIndexInfo: IndexInfoResponse = {
  accuracy: '85.5%',
  streak: 21,
  allDays: 200,
  progress: '8.1%',
  nextWordId: 7,
  allWordsNum: 1033,
  recitedWordsNum: 88,
  toReviewWordsNum: 12,
  collectWordsNum: 5
}

/**
 * 模拟英文题目数据
 */
export const mockEnglishQuestion: EnglishQuestionResponse = {
  questionContent:
    "According to GCP guidelines, the investigator must have a qualified individual (____) the participant's signature on the informed consent form to ensure the process was properly observed.",
  questionAnswerList: [
    {
      wordId: 7,
      answer: 'Witness',
      simpleAnswer: 'Witness (见证)',
      annotation:
        '句中指出根据GCP指南，研究者必须安排合格人员"见证(witness)"受试者在知情同意书上的签名，以确保过程被正确监督。',
      correctAnswer: true
    },
    {
      wordId: 8,
      answer: 'Forge',
      simpleAnswer: 'Forge (伪造)',
      annotation: '指伪造知情书，与"伦理合规性"对立。',
      correctAnswer: false
    },
    {
      wordId: 9,
      answer: 'Ignore',
      simpleAnswer: 'Ignore (忽视)',
      annotation: '指背向监督缺失，与"知情有效性"矛盾。',
      correctAnswer: false
    },
    {
      wordId: 10,
      answer: 'Delay',
      simpleAnswer: 'Delay (延迟)',
      annotation: '指延时同意，与"流程即时性"冲突。',
      correctAnswer: false
    }
  ]
}

/**
 * 模拟单词详情数据
 */
export const mockWordDetail: WordDetailResponse = {
  id: 7,
  word: 'absence',
  phoneticSymbol: '/ˈæbsəns/',
  definition: 'n.缺席，缺勤，不在；缺乏，没有；缺席期间，休假期间；不注意',
  level: 'CET4 | CET6 | 考研 | TOEFL | SAT | 商务英语',
  exampleSentence:
    'As another example, absence of affirmative information on a condition or event does not necessarily mean the condition or event is not present.\n另一个示例为，缺乏关于病症或事件的确证信息并不一定意味着该症状或事件不存在。基于现有箱区自动化统计逻辑，为进一步精细化分析自动化设备在不同作业模式（全自动/半自动）下的效率与质量，现增加半自动数据的独立统计，并调整自动化数据的汇总逻辑基于现有箱区自动化统计逻辑，为进一步精细化分析自动化设备在不同作业模式（全自动/半自动）下的效率与质量，现增加半自动数据的独立统计，并调整自动化数据的汇总逻辑基于现有箱区自动化统计逻辑，为进一步精细化分析自动化设备在不同作业模式（全自动/半自动）下的效率与质量，现增加半自动数据的独立统计，并调整自动化数据的汇总逻辑123',
  collectResult: false,
  nextWordId: 8
}

/**
 * 模拟收藏列表数据
 */
export const mockCollectList: CollectListResponse = {
  total: 25,
  pageNum: 1,
  pageSize: 10,
  totalPage: 3,
  list: [
    {
      id: 1,
      word: 'abbreviate',
      phoneticSymbol: '/əˈbriːvieɪt/',
      definition: 'v. 缩写，使省略，使简短'
    },
    {
      id: 2,
      word: 'aberrant',
      phoneticSymbol: '/æˈberənt/',
      definition: 'adj. 脱离正道的，异常的'
    },
    { id: 3, word: 'abeyance', phoneticSymbol: '/əˈbeɪəns/', definition: 'n. 终止，暂搁' },
    { id: 4, word: 'abhor', phoneticSymbol: '/əbˈhɔː(r)/', definition: 'v. 憎恶，厌恶' },
    { id: 5, word: 'abject', phoneticSymbol: '/ˈæbdʒekt/', definition: 'adj. 极可怜的，卑下的' },
    { id: 6, word: 'abjure', phoneticSymbol: '/əbˈdʒʊə(r)/', definition: 'v. 发誓放弃，弃绝' },
    { id: 7, word: 'ablution', phoneticSymbol: '/əˈbluːʃn/', definition: 'n. 净礼，沐浴' },
    { id: 8, word: 'abnegation', phoneticSymbol: '/ˌæbnɪˈɡeɪʃn/', definition: 'n. 克制，放弃' },
    { id: 9, word: 'abolish', phoneticSymbol: '/əˈbɒlɪʃ/', definition: 'v. 废止，废除' },
    {
      id: 10,
      word: 'abominable',
      phoneticSymbol: '/əˈbɒmɪnəbl/',
      definition: 'adj. 讨厌的，可恶的'
    }
  ]
}

/**
 * 模拟中国临床CRO榜单数据
 */
const mockCroCompanies = [
  { name: '泰格医药', projects: 654, partners: 320 },
  { name: '艾昆玮', projects: 589, partners: 280 },
  { name: '来博客', projects: 523, partners: 245 },
  { name: '药明康德', projects: 487, partners: 230 },
  { name: '康龙化成', projects: 432, partners: 198 },
  { name: '昭衍新药', projects: 398, partners: 175 },
  { name: '美迪西', projects: 356, partners: 160 },
  { name: '博济医药', projects: 312, partners: 142 },
  { name: '华威医药', projects: 287, partners: 130 },
  { name: '百诚医药', projects: 256, partners: 118 },
  { name: '阳光诺和', projects: 234, partners: 105 },
  { name: '诺泰生物', projects: 210, partners: 95 },
  { name: '皓元医药', projects: 189, partners: 82 },
  { name: '成都先导', projects: 167, partners: 72 },
  { name: '南模生物', projects: 145, partners: 60 },
  { name: '和元生物', projects: 128, partners: 52 },
  { name: '吉凯基因', projects: 110, partners: 45 },
  { name: '华大基因', projects: 95, partners: 38 },
  { name: '贝瑞基因', projects: 78, partners: 30 },
  { name: '诺禾致源', projects: 62, partners: 24 }
]

export const mockCroRankList: CroRankListResponse = {
  list: mockCroCompanies.slice(0, 10).map((c, i) => ({
    cooperationEnterpriseNum: c.partners,
    parentCompanyId: i + 1,
    parentCompanyShortName: c.name,
    projectExperienceNum: c.projects,
    rankNo: i + 1
  })),
  pages: 2,
  total: 20
}

/**
 * 模拟外包比例数据
 */
export const mockOutsourcingRatio: OutsourcingRatioResponse = {
  outsourcingCroRatio: 13,
  selfRatio: 87
}

/**
 * 模拟母公司简称列表数据
 */
export const mockParentShortNameList: ParentCompanyListResponse = {
  list: [
    { parentCompanyId: 1, parentCompanyShortName: '百济神州' },
    { parentCompanyId: 2, parentCompanyShortName: '恒瑞医药' },
    { parentCompanyId: 3, parentCompanyShortName: '泰格医药' },
    { parentCompanyId: 4, parentCompanyShortName: '圣方医药' },
    { parentCompanyId: 5, parentCompanyShortName: '易启医药' }
  ],
  pages: 1,
  total: 5
}

/**
 * 模拟sponsor合作名单数据
 */
export const mockSponsorRankList: SponsorRankListResponse = {
  list: [
    {
      cooperationEnterpriseNum: 12,
      parentCompanyId: 1,
      parentCompanyShortName: '圣方医药',
      projectExperienceNum: 5,
      rankNo: 1
    },
    {
      cooperationEnterpriseNum: 8,
      parentCompanyId: 2,
      parentCompanyShortName: '易启医药',
      projectExperienceNum: 3,
      rankNo: 2
    }
  ],
  pages: 1,
  total: 2
}

/**
 * 模拟CRO/中心实验室项目列表数据
 */
export const mockCroProjectList: CroProjectListResponse = {
  list: [
    {
      approvalRecordTime: '2025-07-01',
      category: '国合审批',
      geneticInfoId: 1,
      partnerParentCompanyShortName: '圣方医药',
      projectName:
        '主方案：一项评价替雷利珠单抗联合过验用药物伴或不伴化疗用于治疗既往未经治疗的局部晚期、不可切除或转移性非小细胞肺癌患者的2期、开放...',
      projectNo: '2025GHOB04',
      sponsorStandardCompanyName: '百济神州(上海)生物科技有限公司'
    },
    {
      approvalRecordTime: '2025-06-15',
      category: '国合审批',
      geneticInfoId: 2,
      partnerParentCompanyShortName: '易启医药',
      projectName:
        '一项在成人受试者中评价重组人源化抗PD-1单克隆抗体注射液联合化疗治疗晚期实体瘤的有效性和安全性的多中心、开放、单臂临床研究',
      projectNo: '2025GHOB03',
      sponsorStandardCompanyName: '百济神州(上海)生物科技有限公司'
    }
  ],
  pages: 1,
  total: 2
}

/**
 * 模拟支付参数数据
 */
export const mockPayParams: PayParams = {
  prepay_id: 'wx1234567890',
  paySign: 'abcdefg',
  nonceStr: 'random_str',
  timeStamp: String(Math.floor(Date.now() / 1000)),
  signType: 'MD5'
}

/**
 * 模拟支付结果查询数据
 */
export const mockPayQuery: PayQueryResponse = {
  vipSetSuccess: true,
  orderStatus: 'SUCCESS'
}
