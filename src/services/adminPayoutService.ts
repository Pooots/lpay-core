import { adminApi } from '@/lib/api'
import type { AccountingPayout } from '@/types/accounting'

type PayoutsResponse = {
  data: AccountingPayout[]
  summary: {
    approved: number
    released: number
    total_approved: number
    total_approved_label: string
    total_released: number
    total_released_label: string
  }
}

type PayoutResponse = {
  data: AccountingPayout
  message?: string
}

export const adminPayoutService = {
  async list(params?: { status?: string; q?: string }): Promise<PayoutsResponse> {
    const { data } = await adminApi.get<PayoutsResponse>('/admin/super/payouts', {
      params,
    })
    return data
  },

  async get(uuid: string): Promise<AccountingPayout> {
    const { data } = await adminApi.get<PayoutResponse>(
      `/admin/super/payouts/${uuid}`,
    )
    return data.data
  },

  async approve(uuid: string): Promise<AccountingPayout> {
    const { data } = await adminApi.post<PayoutResponse>(
      `/admin/super/payouts/${uuid}/approve`,
    )
    return data.data
  },

  async release(uuid: string): Promise<AccountingPayout> {
    const { data } = await adminApi.post<PayoutResponse>(
      `/admin/super/payouts/${uuid}/release`,
    )
    return data.data
  },
}
