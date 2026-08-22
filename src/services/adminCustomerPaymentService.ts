import { adminApi } from '@/lib/api'
import type {
  AdminCustomerPayment,
  AdminCustomerPaymentsSummary,
} from '@/types/adminCustomerPayment'

type ListResponse = {
  data: AdminCustomerPayment[]
  summary: AdminCustomerPaymentsSummary
}

type ItemResponse = {
  data: AdminCustomerPayment
}

export const adminCustomerPaymentService = {
  async list(params?: {
    q?: string
    status?: string
    payment_method?: string
  }): Promise<ListResponse> {
    const { data } = await adminApi.get<ListResponse>(
      '/admin/super/customer-payments',
      { params },
    )
    return data
  },

  async get(uuid: string): Promise<AdminCustomerPayment> {
    const { data } = await adminApi.get<ItemResponse>(
      `/admin/super/customer-payments/${uuid}`,
    )
    return data.data
  },
}
