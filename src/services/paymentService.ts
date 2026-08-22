import { merchantApi } from '@/lib/api'
import type {
  MerchantPayment,
  MerchantPaymentsSummary,
} from '@/types/payment'

type PaymentsResponse = {
  data: MerchantPayment[]
  summary: MerchantPaymentsSummary
}

type PaymentResponse = { data: MerchantPayment }

export const paymentService = {
  async list(q?: string): Promise<PaymentsResponse> {
    const { data } = await merchantApi.get<PaymentsResponse>(
      '/admin/payments',
      { params: q ? { q } : undefined },
    )
    return data
  },

  async listManual(): Promise<PaymentsResponse> {
    const { data } = await merchantApi.get<PaymentsResponse>(
      '/admin/payments',
      { params: { payment_method: 'cash' } },
    )
    return data
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
