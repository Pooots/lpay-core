import { adminApi } from '@/lib/api'

export type MerchantAuthUser = {
  id: number
  name: string
  email: string
  role: string
  status: string
  phone: string | null
}

export type MerchantProfile = {
  uuid: string
  code: string
  name: string
  status: string
  email: string
}

export type MerchantAuthResponse = {
  access_token: string
  token_type: string
  expires_in: number
  user: MerchantAuthUser
  merchant: MerchantProfile | null
  role: string
}

const STORAGE_KEYS = {
  token: 'merchant_token',
  user: 'merchant_user',
  merchant: 'merchant_profile',
  role: 'merchant_role',
} as const

export const merchantAuthService = {
  async login(credentials: {
    email: string
    password: string
  }): Promise<MerchantAuthResponse> {
    this.logout()

    const { data } = await adminApi.post<MerchantAuthResponse>(
      '/admin/login',
      credentials,
    )

    localStorage.setItem(STORAGE_KEYS.token, data.access_token)
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user))
    localStorage.setItem(
      STORAGE_KEYS.merchant,
      JSON.stringify(data.merchant),
    )
    localStorage.setItem(STORAGE_KEYS.role, data.role ?? 'merchant')

    return data
  },

  logout(): void {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
  },

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.token)
  },

  getUser(): MerchantAuthUser | null {
    const raw = localStorage.getItem(STORAGE_KEYS.user)
    if (!raw) return null
    try {
      return JSON.parse(raw) as MerchantAuthUser
    } catch {
      return null
    }
  },

  getMerchant(): MerchantProfile | null {
    const raw = localStorage.getItem(STORAGE_KEYS.merchant)
    if (!raw || raw === 'null') return null
    try {
      return JSON.parse(raw) as MerchantProfile
    } catch {
      return null
    }
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken())
  },
}
