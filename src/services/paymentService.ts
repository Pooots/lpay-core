import { merchantApi } from '@/lib/api'
import type {
  MerchantPayment,
  MerchantPaymentsSummary,
} from '@/types/payment'
import type { PaginationMeta } from '@/types/pagination'
import { DEFAULT_PAGE_SIZE, emptyPaginationMeta } from '@/types/pagination'

type PaymentsResponse = {
  data: MerchantPayment[]
  summary: MerchantPaymentsSummary
  meta?: PaginationMeta
}

type PaymentResponse = { data: MerchantPayment }

export type PaymentListParams = {
  q?: string
  page?: number
  per_page?: number
  status?: string
  payment_method?: string
}

export const paymentService = {
  async list(params: PaymentListParams = {}): Promise<PaymentsResponse> {
    const { data } = await merchantApi.get<PaymentsResponse>(
      '/admin/payments',
      {
        params: {
          q: params.q || undefined,
          page: params.page ?? 1,
          per_page: params.per_page ?? DEFAULT_PAGE_SIZE,
          status: params.status || undefined,
          payment_method: params.payment_method || undefined,
        },
      },
    )

    return {
      ...data,
      meta: data.meta ?? emptyPaginationMeta(params.per_page ?? DEFAULT_PAGE_SIZE),
    }
  },

  async listManual(params: { page?: number; per_page?: number } = {}): Promise<PaymentsResponse> {
    return this.list({
      payment_method: 'cash',
      page: params.page ?? 1,
      per_page: params.per_page ?? DEFAULT_PAGE_SIZE,
    })
  },

  async get(uuid: string): Promise<MerchantPayment> {
    const { data } = await merchantApi.get<PaymentResponse>(
      `/admin/payments/${uuid}`,
    )
    return data.data
  },

  async recordManual(payload: {
    customer_uuid: string
    bill_uuid: string
    amount: number
    notes?: string
  }): Promise<MerchantPayment> {
    const { data } = await merchantApi.post<PaymentResponse>(
      '/admin/payments/manual',
      payload,
    )
    return data.data
  },

  async voidManual(uuid: string): Promise<MerchantPayment> {
    const { data } = await merchantApi.post<PaymentResponse>(
      `/admin/payments/${uuid}/void`,
    )
    return data.data
  },
}
