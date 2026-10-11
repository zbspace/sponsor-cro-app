// #ifdef MP-WEIXIN
const accountInfo = uni.getAccountInfoSync()
// #endif

// 小程序运行版本：develop 开发版 / trial 体验版 / release 正式版
let envVersion = 'release'
// #ifdef MP-WEIXIN
envVersion = accountInfo.miniProgram.envVersion
// #endif

let baseUrl = ''

// #ifdef MP-WEIXIN
switch (envVersion) {
  case 'develop':
    baseUrl = 'https://test.shucangyiyao.com/lyqApi' //开发版接口
    break
  case 'trial':
    baseUrl = 'https://test.shucangyiyao.com/lyqApi' //体验版接口
    break
  case 'release':
    baseUrl = 'https://shucangyiyao.com/lyqApi' //生产正式版接口
    break
  default:
    baseUrl = 'https://test.shucangyiyao.com/lyqApi'
}
// #endif

// #ifndef MP-WEIXIN
// H5/App环境单独配置
baseUrl = import.meta.env.VITE_API_URL
// #endif

export default {
  baseUrl,
  envVersion
}
