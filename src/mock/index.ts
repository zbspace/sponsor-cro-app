import type {
  IndexInfoResponse,
  EnglishQuestionResponse,
  LoginResponse,
  WordDetailResponse,
  CollectListResponse,
  PayParams,
  PayQueryResponse
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
