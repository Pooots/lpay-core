import type { MerchantBank } from './settings'

export type MerchantStatus = 'active' | 'pending' | 'suspended'

export type SettlementFrequency = 'bi_monthly' | 'weekly' | 't3'

export type CommissionType = 'fixed' | 'percentage'

export type Merchant = {
  uuid: string
  user_id: number | null
  code: string
  name: string
  status: MerchantStatus
  email: string
  phone: string | null
  address: string | null
  logo_path?: string | null
  logo_url?: string | null
  role: string
  plan?: string | null
  plan_uuid?: string | null
  plan_name?: string | null
  plan_member_range_label?: string | null
  plan_member_min?: number | null
  plan_member_max?: number | null
  plan_paid_through?: string | null
  plan_paid_through_label?: string | null
  plan_expired?: boolean
  settlement_frequency: SettlementFrequency
  settlement_frequency_label: string
  settlement_frequency_description: string
  commission_tax: number
  commission_tax_type: CommissionType
  commission_system_fee: number
  commission_system_fee_type: CommissionType
  commission_other_fee: number
  commission_other_fee_type: CommissionType
  joined_at: string | null
  joined_label: string | null
}

export type CreateMerchantPayload = {
  name: string
  email: string
  password: string
  phone?: string
  address?: string
  status?: MerchantStatus
}

export type UpdateMerchantPayload = {
  name?: string
  email?: string
  password?: string
  phone?: string | null
  address?: string | null
  status?: MerchantStatus
  settlement_frequency?: SettlementFrequency
  plan_uuid?: string | null
  commission_tax?: number
  commission_tax_type?: CommissionType
  commission_system_fee?: number
  commission_system_fee_type?: CommissionType
  commission_other_fee?: number
  commission_other_fee_type?: CommissionType
}

export type MerchantTransaction = {
  uuid: string
  reference_number: string
  bill_number: string
  bill_title: string | null
  customer_name: string | null
  account_number: string
  amount: number
  amount_label: string
  payment_method: string
  payment_method_label: string
  settlement_status: string
  settlement_status_label?: string
  payout_status?: string
  payout_status_label?: string
  available_at?: string | null
  available_label?: string | null
  status: string
  paid_at: string | null
  paid_label: string | null
  paid_date_label: string | null
}

export type MerchantPayout = {
  uuid: string
  reference_number: string
  amount: number
  amount_label: string
  payment_count: number
  status: string
  status_label: string
  requested_at: string | null
  requested_label: string | null
  transactions: MerchantTransaction[]
}

export type MerchantAccountingSummary = {
  available: number
  available_label: string
  available_count: number
  pending: number
  pending_label: string
  pending_count: number
  clearing?: number
  clearing_label?: string
  clearing_count?: number
  request_count?: number
  paid_out: number
  paid_out_label: string
  paid_out_count: number
}

export type MerchantDetail = {
  merchant: Merchant
  stats: {
    customers: number
    bills: number
    payments: number
    total_collected: number
    total_collected_label: string
  }
  transactions: MerchantTransaction[]
  banks: MerchantBank[]
  accounting: {
    summary: MerchantAccountingSummary
    settlement_frequency?: SettlementFrequency
    settlement_frequency_label?: string
    settlement_frequency_description?: string
    available_transactions: MerchantTransaction[]
    pending_transactions?: MerchantTransaction[]
    pending_payouts: MerchantPayout[]
  }
}
