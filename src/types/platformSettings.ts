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
