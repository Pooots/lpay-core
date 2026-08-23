export type SettlementFrequency = 'bi_monthly' | 'weekly' | 't3'

export type BillCoverageMode = 'previous_month' | 'current_month'
export type BillDueMode = 'day_of_month' | 'days_after'
export type BillAmountMode = 'variable' | 'fixed'

export type MerchantBank = {
  uuid: string
  bank_name: string
  account_name: string
  account_number: string
  account_type: string
  account_type_label: string
  branch: string | null
  is_primary: boolean
  notes: string | null
  created_at: string | null
}

export type MerchantSettingsProfile = {
  uuid: string
  code: string
  name: string
  status: string
  email: string
  phone: string | null
  address: string | null
  logo_path?: string | null
  logo_url?: string | null
  joined_at: string | null
  joined_label: string | null
  settlement_frequency: SettlementFrequency
  settlement_frequency_label: string
  settlement_frequency_description: string
}

export type BillsSetPreview = {
  title: string
  description: string | null
  bill_date: string
  bill_date_label: string
  due_on: string
  due_on_label: string
  coverage_start: string
  coverage_end: string
  coverage_label: string
  coverage_period_label: string
  coverage_month?: string
}

export type BillSetPeriodPreview = {
  preview: BillsSetPreview
  customer_count: number
  billed_count: number
  already_billed: boolean
  message: string | null
}

export type BillsSetItem = {
  uuid: string
  title: string
  description: string | null
  amount_mode: BillAmountMode
  amount_mode_label: string
  fixed_amount: number | null
  fixed_amount_label: string | null
  can_run_all: boolean
  bill_day: number
  coverage_mode: BillCoverageMode
  coverage_mode_label: string
  due_mode: BillDueMode
  due_mode_label: string
  due_day: number
  due_days_after: number
  is_active: boolean
  preview: BillsSetPreview | null
  created_at: string | null
  configured?: boolean
}

export type StoreBillsSetPayload = {
  title: string
  description?: string | null
  amount_mode: BillAmountMode
  fixed_amount?: number | null
  bill_day: number
  coverage_mode: BillCoverageMode
  due_mode: BillDueMode
  due_day?: number | null
  due_days_after?: number | null
  is_active?: boolean
}

export type RunBillSetResult = {
  created_count: number
  skipped_count: number
  customer_count: number
  amount: number
  amount_label: string
  preview: BillsSetPreview
}

export type MerchantSettingsData = {
  profile: MerchantSettingsProfile
  accounting: {
    settlement_frequency: SettlementFrequency
    settlement_frequency_label: string
    settlement_frequency_description: string
  }
  banks: MerchantBank[]
  bills_sets: BillsSetItem[]
  bills_set: BillsSetItem | { configured: false; preview: null }
  commissions: MerchantCommissionView
  penalty?: MerchantPenaltySettings
  payment_gateway?: MerchantPaymentGatewaySettings
  payment_methods: MerchantPaymentMethodItem[]
  rates: MerchantRatesSettings
}

export type PenaltyAmountType = 'fixed' | 'percentage'
export type PenaltyApplyMode = 'one_time' | 'daily' | 'weekly' | 'monthly'
export type PenaltyApplyBase = 'balance' | 'original_amount'

export type MerchantPenaltySettings = {
  enabled: boolean
  amount_type: PenaltyAmountType
  amount: number
  amount_label: string
  grace_days: number
  apply_mode: PenaltyApplyMode
  apply_mode_label: string
  apply_base: PenaltyApplyBase
  apply_base_label: string
  max_penalty: number | null
  max_penalty_label: string | null
  notes: string | null
  flow_summary: string
}

export type UpdateMerchantPenaltyPayload = {
  enabled: boolean
  amount_type: PenaltyAmountType
  amount: number
  grace_days: number
  apply_mode: PenaltyApplyMode
  apply_base: PenaltyApplyBase
  max_penalty?: number | null
  notes?: string | null
}

export type MerchantPaymentGatewaySettings = {
  available_providers: Array<'paymongo' | 'paypal'>
  platform_channels_enabled: boolean
  using_own_gateway: boolean
  paymongo: {
    enabled: boolean
    connected: boolean
    ready: boolean
    public_key?: string | null
    secret_key?: string | null
    webhook_secret?: string | null
    public_key_masked: string | null
    secret_key_masked: string | null
    webhook_secret_set: boolean
    env: 'test' | 'live' | null
  }
  paypal: {
    enabled: boolean
    connected: boolean
    ready: boolean
    client_id?: string | null
    client_secret?: string | null
    client_id_masked: string | null
    client_secret_set: boolean
    mode: 'sandbox' | 'live' | null
  }
  note: string
}

export type UpdateMerchantPaymentGatewayPayload = {
  provider: 'paymongo' | 'paypal'
  enabled?: boolean
  clear?: boolean
  paymongo_public_key?: string | null
  paymongo_secret_key?: string | null
  paymongo_webhook_secret?: string | null
  paypal_client_id?: string | null
  paypal_client_secret?: string | null
  paypal_mode?: 'sandbox' | 'live' | null
}

export type MerchantCommissionView = {
  tax: number
  tax_type: 'fixed' | 'percentage'
  system_fee: number
  system_fee_type: 'fixed' | 'percentage'
  other_fee: number
  other_fee_type: 'fixed' | 'percentage'
  read_only: boolean
  note: string
}

export type MerchantPaymentMethodItem = {
  name: string
  label: string
  provider: string
  value: boolean
  admin_enabled: boolean
  locked: boolean
  source?: 'platform' | 'merchant_gateway'
}

export type MerchantCustomRate = {
  name: string
  label: string
  admin_rate: number
  admin_rate_label: string
  additional: number
  amount?: number
  total_rate: number
  total_rate_label: string
}

export type MerchantRatesSettings = {
  platform: {
    paymongo: {
      qrph: number
      card: number
      gcash: number
      grab_pay: number
      shopee_pay: number
      billease: number
      paymaya: number
      brankas: number
      dob: { percentage: number; fixed_minimum: number }
    }
    paypal: { paypal_fee: number; additional_fee: number }
    updated_at: string | null
  }
  merchant_rates: MerchantCustomRate[]
  use_custom_rates?: boolean
  can_override_platform: boolean
}

export type UpdateMerchantProfilePayload = {
  name?: string
  phone?: string | null
  address?: string | null
}

export type MerchantBankPayload = {
  bank_name: string
  account_name: string
  account_number: string
  account_type?: string
  branch?: string | null
  is_primary?: boolean
  notes?: string | null
}
