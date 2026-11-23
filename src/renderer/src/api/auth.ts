import request from './request'
import type { LoginResult, UserInfo } from './types'

export function login(username: string, password: string): Promise<LoginResult> {
  return request.post('/auth/login', { username, password })
}

export function fetchProfile(): Promise<UserInfo> {
  return request.get('/auth/profile')
}

/** 修改本人密码（成功后服务端吊销该用户全部会话，需要重新登录） */
export function changePassword(oldPassword: string, newPassword: string): Promise<{ ok: true }> {
  return request.post('/auth/change-password', { oldPassword, newPassword })
}

/** 登出：吊销当前 token */
export function logout(): Promise<{ ok: true }> {
  return request.post('/auth/logout')
}
