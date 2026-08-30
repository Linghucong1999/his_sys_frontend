import request from './request'
import type { LoginResult, UserInfo } from './types'

export function login(username: string, password: string): Promise<LoginResult> {
  return request.post('/auth/login', { username, password })
}

export function fetchProfile(): Promise<UserInfo> {
  return request.get('/auth/profile')
}
