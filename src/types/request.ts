/**
 * 通用 API 响应接口
 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/**
 * 请求配置接口
 */
export interface RequestConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: any
  needToken?: boolean
  mockData?: any // 新增 mock 数据字段
}
