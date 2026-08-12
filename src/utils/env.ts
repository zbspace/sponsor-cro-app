// #ifdef MP-WEIXIN
const accountInfo = uni.getAccountInfoSync()
const envVersion = accountInfo.miniProgram.envVersion
// #endif

let baseUrl = ''

// #ifdef MP-WEIXIN
switch (envVersion) {
  case 'develop':
    baseUrl = 'https://test.shucangyiyao.com/lyqApi' //开发版接口
    break
  case 'trial':
    baseUrl = 'https://test.shucangyiyao.com' //体验版接口
    break
  case 'release':
    baseUrl = 'https://shucangyiyao.com' //生产正式版接口
    break
  default:
    baseUrl = 'https://test.shucangyiyao.com'
}
// #endif

// #ifndef MP-WEIXIN
// H5/App环境单独配置
baseUrl = import.meta.env.VITE_API_URL
// #endif

export default {
  baseUrl
}
