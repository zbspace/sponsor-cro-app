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
// H5/App 环境从 .env 读取（变量名见 .env.example 与 src/env.d.ts）
// 未配置时回退到测试环境，避免 baseUrl 为 undefined 导致请求发到 "undefined/xxx"
baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://test.shucangyiyao.com/lyqApi'
// #endif

export default {
  baseUrl,
  envVersion
}
