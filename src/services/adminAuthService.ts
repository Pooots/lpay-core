import { adminApi } from '@/lib/api'
import type {
  SuperAdminAuthResponse,
  SuperAdminLoginCredentials,
  SuperAdminUser,
} from '@/types/auth'

const STORAGE_KEYS = {
  token: 'admin_token',
  user: 'admin_user',
  role: 'admin_role',
  isAdmin: 'is_admin',
} as const

export const adminAuthService = {
  async login(
    credentials: SuperAdminLoginCredentials,
  ): Promise<SuperAdminAuthResponse> {
    this.logout()

    const { data } = await adminApi.post<SuperAdminAuthResponse>(
      '/admin/super/login',
      credentials,
    )

    localStorage.setItem(STORAGE_KEYS.token, data.access_token)
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.admin_user))
    localStorage.setItem(STORAGE_KEYS.role, data.role ?? '')
    localStorage.setItem(STORAGE_KEYS.isAdmin, String(data.is_admin ?? true))

    return data
  },

  logout(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
  },

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.token)
  },

  getUser(): SuperAdminUser | null {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    if (!raw) return null
    try {
      return JSON.parse(raw) as SuperAdminUser
    } catch {
      return null
    }
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken())
  },
}
