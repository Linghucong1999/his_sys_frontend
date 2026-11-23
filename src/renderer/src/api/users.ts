import request from './request'
import type { UserInfo } from './types'

export interface AdminUser extends UserInfo {
  _id: string
  enabled: boolean
  failedLoginCount?: number
  createdAt?: string
  updatedAt?: string
}

export function listUsers(): Promise<AdminUser[]> {
  return request.get('/users')
}

export function updateUser(
  id: string,
  patch: { realName?: string; department?: string; roles?: string[]; enabled?: boolean }
): Promise<AdminUser> {
  return request.patch(`/users/${id}`, patch)
}

/** 管理员重置密码：返回一次性临时密码（仅展示一次） */
export function resetUserPassword(id: string): Promise<{ password: string; mustChangePassword: boolean }> {
  return request.post(`/users/${id}/reset-password`)
}
