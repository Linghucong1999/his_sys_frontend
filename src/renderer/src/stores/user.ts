import { defineStore } from 'pinia'
import { login as apiLogin } from '@/api/auth'
import { usePatientStore } from '@/stores/patient'
import type { UserInfo } from '@/api/types'

const TOKEN_KEY = 'his_token'
const USER_KEY = 'his_user'

interface UserState {
  token: string
  user: UserInfo | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem(TOKEN_KEY) ?? '',
    user: (() => {
      try {
        const raw = localStorage.getItem(USER_KEY)
        return raw ? (JSON.parse(raw) as UserInfo) : null
      } catch {
        return null
      }
    })()
  }),
  getters: {
    isLoggedIn: (s): boolean => !!s.token,
    roleLabel: (s): string => {
      const map: Record<string, string> = {
        admin: '管理员',
        doctor: '医生',
        nurse: '护士',
        pharmacist: '药房'
      }
      const role = s.user?.roles?.[0]
      return role ? (map[role] ?? role) : ''
    }
  },
  actions: {
    async login(username: string, password: string): Promise<void> {
      const result = await apiLogin(username, password)
      this.token = result.token
      this.user = result.user
      localStorage.setItem(TOKEN_KEY, result.token)
      localStorage.setItem(USER_KEY, JSON.stringify(result.user))
      // 切换账号：清空上一账号的接诊上下文（权限隔离）
      usePatientStore().reset()
    },
    logout(): void {
      this.token = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      usePatientStore().reset()
    }
  }
})
