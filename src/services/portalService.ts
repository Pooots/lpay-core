import { api } from '@/lib/api'
import type { CustomerPortalProfile, PortalBill } from '@/types/portal'

type PortalResponse = { data: CustomerPortalProfile }

type MerchantPortalInfo = {
  uuid: string
  code: string
  name: string
  status: string
  email: string | null
  phone: string | null
  logo_url?: string | null
}

type MerchantPortalResponse = { data: MerchantPortalInfo }

export type PortalPaymentResult = {
  uuid: string
  reference_number: string
  amount: number
  amount_label: string
  payment_method: string
  status: string
  paid_at: string | null
  paid_label: string | null
  checkout_url?: string | null
  payment_provider?: string | null
  payment_id?: string | null
  gateway_status?: string | null
}

type PayBillResponse = {
  data: {
    checkout_url?: string | null
    requires_redirect?: boolean
    payment: PortalPaymentResult
    bill?: PortalBill | null
    profile?: CustomerPortalProfile | null
  }
  message?: string
  status?: string
}

export type PayBillPayload = {
  account_number: string
  bill_uuid: string
  amount: number
  payment_method?:
    | 'lpay'
    | 'merchant'
    | 'card'
    | 'gcash'
    | 'grab_pay'
    | 'paymaya'
    | 'qrph'
    | 'shopee_pay'
    | 'billease'
    | 'online'
    | 'paymongo'
    | 'paypal'
    | 'wallet'
    | 'bank_transfer'
    | 'upi'
    | 'account_credit'
  return_url?: string
  cancel_url?: string
}

export const portalService = {
  async getMerchantByCode(code: string): Promise<MerchantPortalInfo> {
    const encoded = encodeURIComponent(code.trim())
    const { data } = await api.get<MerchantPortalResponse>(
      `/portal/merchants/${encoded}`,
    )
    return data.data
  },

  async lookup(
    accountNumber: string,
    merchantCode?: string,
  ): Promise<CustomerPortalProfile> {
    const { data } = await api.post<PortalResponse>('/portal/account/lookup', {
      account_number: accountNumber.trim(),
      ...(merchantCode
        ? { merchant_code: merchantCode.trim().toUpperCase() }
        : {}),
    })
    return data.data
  },

  async getByAccountNumber(
    accountNumber: string,
  ): Promise<CustomerPortalProfile> {
    const encoded = encodeURIComponent(accountNumber.trim())
    const { data } = await api.get<PortalResponse>(
      `/portal/account/${encoded}`,
    )
    return data.data
  },

  async payBill(payload: PayBillPayload): Promise<PayBillResponse['data']> {
    const { data } = await api.post<PayBillResponse>(
      '/portal/bills/pay',
      payload,
    )
    return data.data
  },

  async completePayment(uuid: string): Promise<PayBillResponse> {
    const { data } = await api.post<PayBillResponse>(
      `/portal/payments/${uuid}/complete`,
    )
    return data
  },

  async cancelPayment(uuid: string): Promise<PayBillResponse> {
    const { data } = await api.post<PayBillResponse>(
      `/portal/payments/${uuid}/cancel`,
    )
    return data
  },
}
