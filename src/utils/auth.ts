/**
 * 登录相关工具集
 *
 * 这里只依赖 env 与类型定义，不依赖 api / request，供请求拦截器与 api 层共同复用，
 * 用于实现「登录态过期后静默重新登录」。
 */
import env from '@/utils/env'
import type { ApiResponse } from '@/types/request'
import type { LoginResponse, UserInfo } from '@/types/api'

const BASE_URL = env.baseUrl
/** 微信登录接口 */
const LOGIN_URL = '/api/v1/wechat/searchComCRO/login'
/** 本地用户信息缓存键 */
export const USER_INFO_KEY = 'userInfo'

// #region 本地用户信息读写

/**
 * 读取本地缓存的用户信息
 */
export function getStoredUserInfo(): UserInfo | null {
  return uni.getStorageSync(USER_INFO_KEY) || null
}

/**
 * 覆盖写入本地用户信息
 */
export function setStoredUserInfo(userInfo: UserInfo) {
  uni.setStorageSync(USER_INFO_KEY, userInfo)
}

/**
 * 清除本地用户信息（登录态失效且无法自动登录时调用）
 */
export function clearStoredUserInfo() {
  uni.removeStorageSync(USER_INFO_KEY)
}

/**
 * 合并写入本地用户信息
 *
 * 登录接口返回值不包含已绑定的手机号等字段，直接覆盖会丢失本地数据，
 * 因此仅用非空值覆盖，其余字段保留原值。
 */
export function mergeStoredUserInfo(patch: Partial<UserInfo>): UserInfo {
  const prev = getStoredUserInfo() || ({} as UserInfo)
  const next: Record<string, any> = { ...prev }
  Object.keys(patch).forEach((key) => {
    const value = (patch as Record<string, any>)[key]
    if (value !== null && value !== undefined && value !== '') {
      next[key] = value
    }
  })
  setStoredUserInfo(next as UserInfo)
  return next as UserInfo
}

/**
 * 是否已完善过资料（有昵称或头像即视为完成，一次填写后不再重复进入完善资料页）
 */
export function hasCompletedProfile(info: UserInfo | null = getStoredUserInfo()): boolean {
  if (!info) return false
  return !!(info.nickname || info.avatarUrl)
}

// #endregion

// #region 登录流程

/**
 * 获取微信登录 code
 */
export function getWxLoginCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.login({
      provider: 'weixin',
      success: (res: any) => {
        if (res?.code) {
          resolve(res.code)
        } else {
          reject(new Error('未获取到 code'))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * 用微信 code 换取登录态（不写入本地缓存）
 */
export function loginByCode(code: string): Promise<LoginResponse> {
  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + LOGIN_URL,
      method: 'POST',
      data: { code, serverId: 'searchComCRO' },
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        const body = res.data as ApiResponse<LoginResponse>
        if (res.statusCode === 200 && body?.code === 200 && body.data?.token) {
          resolve(body.data)
        } else {
          reject(new Error(body?.msg || '登录失败'))
        }
      },
      fail: (err) => reject(err)
    })
  })
}

/**
 * 执行一次完整的微信登录，并把登录态合并写入本地缓存
 */
export async function loginWithWx(): Promise<LoginResponse> {
  const code = await getWxLoginCode()
  const data = await loginByCode(code)
  mergeStoredUserInfo(data)
  return data
}

/**
 * 静默登录（接口返回 401 时调用）
 *
 * wx.login 无需用户操作，因此可以自动续期登录态；
 * 并发请求同时过期时共享同一个登录任务，避免重复登录。
 * @returns 登录成功返回登录信息，失败返回 null
 */
let silentLoginTask: Promise<LoginResponse | null> | null = null
export function silentLogin(): Promise<LoginResponse | null> {
  if (silentLoginTask) return silentLoginTask

  silentLoginTask = loginWithWx()
    .catch((err) => {
      console.warn('[自动登录失败]', err)
      return null
    })
    .finally(() => {
      silentLoginTask = null
    })

  return silentLoginTask
}

// #endregion
