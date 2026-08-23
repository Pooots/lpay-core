import { merchantApi } from '@/lib/api'
import type { MerchantPlanSummary } from '@/lib/merchantPlan'

export type MerchantPlanCatalogItem = {
  uuid: string
  name: string
  code: string
  description: string | null
  member_min: number
  member_max: number | null
  member_range_label: string
  monthly_fee: number
  monthly_fee_label: string
  platform_fees?: {
    tax: number
    tax_type: string
    system_fee: number
    system_fee_type: string
    other_fee: number
    other_fee_type: string
  }
  total_due: number
  total_due_label: string
  features: string[]
  is_current: boolean
  is_upgrade: boolean
  is_downgrade: boolean
  action_label: string
}

export type MerchantPlanPaymentRow = {
  uuid: string
  reference_number: string
  kind?: string
  kind_label?: string
  billing_period?: string | null
  billing_period_label?: string | null
  from_plan_name: string | null
  to_plan_name: string | null
  to_plan_uuid: string
  plan_fee?: number
  plan_fee_label?: string
  platform_commission?: number
  platform_commission_label?: string
  amount: number
  amount_label: string
  currency: string
  status: string
  payment_provider: string | null
  checkout_url: string | null
  paid_at: string | null
  paid_label: string | null
  expires_at?: string | null
  expires_at_label?: string | null
  created_at: string | null
  created_label: string | null
}

export type MerchantPlanCommissionItem = {
  uuid: string
  reference_number: string
  bill_number?: string | null
  bill_title?: string | null
  member_name?: string | null
  account_number?: string | null
  transaction_amount: number
  transaction_amount_label: string
  platform_tax: number
  platform_tax_label: string
  platform_system_fee: number
  platform_system_fee_label: string
  platform_other_fee: number
  platform_other_fee_label: string
  platform_fees_total: number
  platform_fees_total_label: string
  paid_at?: string | null
  paid_label?: string | null
}

export type MerchantPlanBilling = {
  currency: string
  gateway: string
  gateway_label: string
  note: string
  plan_fee?: number
  plan_fee_label?: string
  platform_commission?: number
  platform_commission_label?: string
  platform_commission_items?: MerchantPlanCommissionItem[]
  platform_commission_count?: number
  amount: number
  amount_label: string
  next_period: string
  next_period_label: string
  next_period_due_label: string
  paid_through: string | null
  paid_through_label: string | null
  expires_on?: string | null
  expires_on_label?: string | null
  expires_at_label?: string | null
  days_until_expiry?: number | null
  reminder_due?: boolean
  is_expired?: boolean
  needs_activation?: boolean
  can_pay_next_month: boolean
  is_free: boolean
}

export type MerchantPlanModuleData = {
  current_plan: MerchantPlanSummary | null
  plans: MerchantPlanCatalogItem[]
  payments: MerchantPlanPaymentRow[]
  billing: MerchantPlanBilling
}

type ModuleResponse = {
  data: MerchantPlanModuleData
}

type CheckoutResponse = {
  data: {
    payment: MerchantPlanPaymentRow
    checkout_url: string | null
    merchant?: {
      uuid: string
      status?: string
      plan: MerchantPlanSummary | null
    }
    billing?: MerchantPlanBilling
  }
  message?: string
}

type StatusResponse = {
  data: {
    payment: MerchantPlanPaymentRow
    merchant?: {
      uuid: string
      status?: string
      plan: MerchantPlanSummary | null
    }
    billing?: MerchantPlanBilling
  }
  message?: string
  status?: string
}

export const merchantPlanService = {
  async getModule(): Promise<MerchantPlanModuleData> {
    const { data } = await merchantApi.get<ModuleResponse>('/admin/plans')
    return data.data
  },

  async checkout(
    planUuid: string,
    paymentMethod?: string,
  ): Promise<CheckoutResponse['data']> {
    const origin = window.location.origin
    const { data } = await merchantApi.post<CheckoutResponse>(
      '/admin/plans/checkout',
      {
        plan_uuid: planUuid,
        payment_method: paymentMethod || undefined,
        return_url: `${origin}/admin/plan`,
        cancel_url: `${origin}/admin/plan`,
      },
    )
    return data.data
  },

  async renewNextMonth(
    paymentMethod?: string,
  ): Promise<CheckoutResponse['data']> {
    const origin = window.location.origin
    const { data } = await merchantApi.post<CheckoutResponse>(
      '/admin/plans/renew',
      {
        payment_method: paymentMethod || undefined,
        return_url: `${origin}/admin/plan`,
        cancel_url: `${origin}/admin/plan`,
      },
    )
    return data.data
  },

  async complete(paymentUuid: string): Promise<StatusResponse> {
    const { data } = await merchantApi.post<StatusResponse>(
      `/admin/plans/payments/${paymentUuid}/complete`,
    )
    return data
  },

  async cancel(paymentUuid: string): Promise<StatusResponse> {
    const { data } = await merchantApi.post<StatusResponse>(
      `/admin/plans/payments/${paymentUuid}/cancel`,
    )
    return data
  },
}
