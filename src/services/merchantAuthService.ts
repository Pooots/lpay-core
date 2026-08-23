import { adminApi, merchantApi } from '@/lib/api'
import type { MerchantPlanSummary } from '@/lib/merchantPlan'

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
  plan?: MerchantPlanSummary | null
}

export type MerchantAuthResponse = {
  access_token: string
  token_type: string
  expires_in: number
  user: MerchantAuthUser
  merchant: MerchantProfile | null
  role: string
}

export type MerchantMeResponse = {
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

function persistSession(data: {
  user: MerchantAuthUser
  merchant: MerchantProfile | null
  role?: string
}): void {
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user))
  localStorage.setItem(STORAGE_KEYS.merchant, JSON.stringify(data.merchant))
  if (data.role) {
    localStorage.setItem(STORAGE_KEYS.role, data.role)
  }
}

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
    persistSession(data)
    localStorage.setItem(STORAGE_KEYS.role, data.role ?? 'merchant')

    return data
  },

  async register(payload: {
    name: string
    email: string
    password: string
    password_confirmation: string
    phone?: string
    address?: string
  }): Promise<MerchantAuthResponse> {
    this.logout()

    const { data } = await adminApi.post<MerchantAuthResponse>(
      '/merchant/register',
      payload,
    )

    localStorage.setItem(STORAGE_KEYS.token, data.access_token)
    persistSession(data)
    localStorage.setItem(STORAGE_KEYS.role, data.role ?? 'merchant')

    return data
  },

  async me(): Promise<MerchantMeResponse> {
    const { data } = await merchantApi.get<MerchantMeResponse>('/admin/me')
    persistSession(data)
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

  getPlan(): MerchantPlanSummary | null {
    return this.getMerchant()?.plan ?? null
  },

  isPendingOnboarding(): boolean {
    return (this.getMerchant()?.status ?? '').toLowerCase() === 'pending'
  },

  canTransact(): boolean {
    const status = (this.getMerchant()?.status ?? '').toLowerCase()
    return status === 'active'
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken())
  },
}
