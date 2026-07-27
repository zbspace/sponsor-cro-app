import type { ApiResponse, RequestConfig } from '@/types/request'

// #region 常量定义

/**
 * API 基础地址
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL

// #endregion

// #region Token 管理

/**
 * 从本地存储获取 Token
 * @returns Token 字符串
 */
function getToken(): string {
  const userInfo = uni.getStorageSync('userInfo')
  return userInfo ? userInfo.token : ''
}

// #endregion

// #region 响应和错误处理

/**
 * 处理响应结果
 * @param res uni.request 成功回调结果
 * @returns Promise<ApiResponse<T>>
 */
function handleResponse<T>(res: UniApp.RequestSuccessCallbackResult): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    const response = res.data as ApiResponse<T>
    if (response.code === 200) {
      resolve(response)
    } else {
      uni.showToast({
        title: response.msg || '请求失败',
        icon: 'none'
      })
      reject(response)
    }
  })
}

/**
 * 处理请求错误
 * @param err uni.request 失败回调结果
 * @returns Promise.reject
 */
function handleError(err: any) {
  uni.showToast({
    title: err.errMsg || '网络错误',
    icon: 'none'
  })
  return Promise.reject(err)
}

// #endregion

// #region 请求方法

/**
 * 通用请求方法
 * @param config 请求配置
 * @returns Promise<ApiResponse<T>>
 */
export function request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
  const { url, method = 'GET', data, needToken = true, mockData } = config

  // region Mock 逻辑
  const useMock = import.meta.env.VITE_USE_MOCK === 'true'
  if (useMock && mockData) {
    console.log(`[Mock Request] ${url}`, mockData)
    return Promise.resolve({
      code: 200,
      msg: 'success (mock)',
      data: mockData as T
    })
  }
  // endregion

  const header: any = {
    'Content-Type': 'application/json'
  }

  // 如果需要 Token，自动添加到请求头
  if (needToken) {
    const token = getToken()
    if (token) {
      header.Authorization = `Bearer_${token}`;
      header.token = token
    }
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header,
      success: (res) => {
        handleResponse<T>(res).then(resolve).catch(reject)
      },
      fail: (err) => {
        handleError(err)
      }
    })
  })
}

/**
 * GET 请求快捷方法
 * @param url 请求地址
 * @param data 请求参数
 * @param needToken 是否需要 Token
 * @param mockData 可选的 mock 数据
 * @returns Promise<ApiResponse<T>>
 */
export function get<T = any>(
  url: string,
  data?: any,
  needToken = true,
  mockData?: any
): Promise<ApiResponse<T>> {
  return request<T>({
    url,
    method: 'GET',
    data,
    needToken,
    mockData
  })
}

/**
 * POST 请求快捷方法
 * @param url 请求地址
 * @param data 请求参数
 * @param needToken 是否需要 Token
 * @param mockData 可选的 mock 数据
 * @returns Promise<ApiResponse<T>>
 */
export function post<T = any>(
  url: string,
  data?: any,
  needToken = true,
  mockData?: any
): Promise<ApiResponse<T>> {
  return request<T>({
    url,
    method: 'POST',
    data,
    needToken,
    mockData
  })
}

// #endregion
