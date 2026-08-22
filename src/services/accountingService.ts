import { merchantApi } from '@/lib/api'
import type { AccountingData, AccountingPayout } from '@/types/accounting'

type AccountingResponse = { data: AccountingData }

type PayoutResponse = {
  data: AccountingPayout
  message?: string
}

export const accountingService = {
  async get(): Promise<AccountingData> {
    const { data } = await merchantApi.get<AccountingResponse>(
      '/admin/accounting',
    )
    return data.data
  },

  async requestPayout(notes?: string): Promise<AccountingPayout> {
    const { data } = await merchantApi.post<PayoutResponse>(
      '/admin/accounting/payouts',
      notes ? { notes } : {},
    )
    return data.data
  },
}
