export type AccountingTransaction = {
  uuid: string
  reference_number: string
  bill_uuid?: string
  bill_number: string
  bill_title: string | null
  customer_uuid?: string
  customer_name: string | null
  customer_email?: string | null
  account_number: string
  amount: number
  amount_label: string
  payment_method?: string
  payment_method_label?: string
  gateway_account?: 'platform' | 'merchant' | string | null
  gateway_account_label?: string | null
  settlement_status?: string
  payout_status: string
  payout_status_label: string
  available_at?: string | null
  available_label?: string | null
  paid_at?: string | null
  paid_label?: string | null
  paid_date_label?: string | null
}

export type AccountingPayout = {
  uuid: string
  reference_number: string
  amount: number
  amount_label: string
  payment_count: number
  status: string
  status_label: string
  requested_at: string | null
  requested_label: string | null
  approved_at?: string | null
  approved_label?: string | null
  released_at?: string | null
  released_label?: string | null
  notes?: string | null
  transactions: AccountingTransaction[]
  merchant?: {
    uuid?: string | null
    name?: string | null
    code?: string | null
    email?: string | null
    phone?: string | null
  }
}

export type AccountingSummary = {
  available: number
  available_label: string
  available_count: number
  pending: number
  pending_label: string
  pending_count: number
  clearing_count?: number
  request_count?: number
  paid_out: number
  paid_out_label: string
  paid_out_count: number
  merchant_direct?: number
  merchant_direct_label?: string
  merchant_direct_count?: number
}

export type AccountingGateway = {
  mode: 'lpay' | 'merchant_gateway' | 'dual' | string
  platform_channels_enabled: boolean
  using_own_gateway: boolean
  dual_gateway: boolean
  payouts_applicable: boolean
  paymongo_ready?: boolean
  paypal_ready?: boolean
}

export type AccountingData = {
  summary: AccountingSummary
  gateway?: AccountingGateway
  settlement_frequency?: string
  settlement_frequency_label?: string
  settlement_frequency_description?: string
  available_transactions: AccountingTransaction[]
  pending_transactions?: AccountingTransaction[]
  merchant_direct_transactions?: AccountingTransaction[]
  pending_payouts: AccountingPayout[]
  released_payouts?: AccountingPayout[]
}
