export type CommissionType = 'fixed' | 'percentage'

export type MerchantCommissionSettings = {
  tax: number
  tax_type: CommissionType
  system_fee: number
  system_fee_type: CommissionType
  other_fee: number
  other_fee_type: CommissionType
  updated_at: string | null
}

export type CommissionHistoryRow = {
  uuid: string
  previous_value: Omit<MerchantCommissionSettings, 'updated_at'>
  current_value: Omit<MerchantCommissionSettings, 'updated_at'>
  changed_by: string
  changed_at: string | null
  changed_at_label: string | null
}

export type PaymentMethodItem = {
  name: string
  value: boolean
  provider: string
  label: string
}

export type PaymentMethodsSettings = {
  payment_methods: PaymentMethodItem[]
  updated_at: string | null
}

export type DobRate = {
  percentage: number
  fixed_minimum: number
}

export type GatewayRatesSettings = {
  paymongo: {
    qrph: number
    card: number
    gcash: number
    grab_pay: number
    shopee_pay: number
    billease: number
    paymaya: number
    brankas: number
    dob: DobRate
  }
  paypal: {
    paypal_fee: number
    additional_fee: number
  }
  updated_at: string | null
  paymongo_updated_at: string | null
  paypal_updated_at: string | null
}

export type CurrencyRateRow = {
  code: string
  label: string
  rate: number
}

export type CurrencyConversionSettings = {
  base_currency: string
  enabled: boolean
  rates: CurrencyRateRow[]
  updated_at: string | null
}

export type PlanPlatformFees = {
  tax: number
  tax_type: CommissionType
  system_fee: number
  system_fee_type: CommissionType
  other_fee: number
  other_fee_type: CommissionType
}

export type MerchantPlan = {
  uuid: string
  name: string
  code: string
  description: string | null
  member_min: number
  member_max: number | null
  member_range_label: string
  monthly_fee: number
  monthly_fee_label: string
  commission_tax: number
  commission_tax_type: CommissionType
  commission_system_fee: number
  commission_system_fee_type: CommissionType
  commission_other_fee: number
  commission_other_fee_type: CommissionType
  platform_fees: PlanPlatformFees
  total_due: number
  total_due_label: string
  is_active: boolean
  is_default: boolean
  sort_order: number
  features: string[]
  merchants_count: number
  created_at: string | null
  updated_at: string | null
}

export type MerchantPlanPayload = {
  name: string
  code?: string
  description?: string | null
  member_min: number
  member_max?: number | null
  monthly_fee?: number
  commission_tax?: number
  commission_tax_type?: CommissionType
  commission_system_fee?: number
  commission_system_fee_type?: CommissionType
  commission_other_fee?: number
  commission_other_fee_type?: CommissionType
  is_active?: boolean
  is_default?: boolean
  sort_order?: number
  features?: string[]
}
