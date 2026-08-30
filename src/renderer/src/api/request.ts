import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

// 后端 NestJS 服务地址（桌面端本地/内网部署）
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000/api'

const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000
})

// 请求拦截：附带 token
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('his_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一解包 { code, data, message }；401 清除登录态
instance.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) {
        return body.data
      }
      return Promise.reject(new Error(body.message ?? '请求失败'))
    }
    return body
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('his_token')
      localStorage.removeItem('his_user')
    }
    const message = error.response?.data?.message ?? error.message ?? '网络错误'
    return Promise.reject(new Error(message))
  }
)

/** 解包后的请求方法：返回值即后端 data 字段 */
const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get(url, config) as unknown as Promise<T>
  },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post(url, data, config) as unknown as Promise<T>
  },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.put(url, data, config) as unknown as Promise<T>
  }
}

export default request
