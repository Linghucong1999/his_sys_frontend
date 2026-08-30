import axios from 'axios'

// 后端 NestJS 服务地址（桌面端本地/内网部署）
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:3000/api'

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 15000
})

// 请求拦截：附带 token（登录后由 auth store 写入 localStorage）
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('his_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截：统一解包 { code, data, message } 结构
request.interceptors.response.use(
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
    return Promise.reject(error)
  }
)

export default request
