export type PortalCheckoutOption = {
  value: string
  label: string
  provider: 'paymongo' | 'paypal' | string
}

export type PortalCheckoutSettings = {
  platform_channels_enabled: boolean
  using_own_gateway: boolean
  dual_gateway?: boolean
  paymongo_ready: boolean
  paypal_ready: boolean
  available: boolean
  note: string
  redirect_hint: string
  options: PortalCheckoutOption[]
}

export type PortalCommissionConfig = {
  tax: number
  tax_type: 'fixed' | 'percentage'
  system_fee: number
  system_fee_type: 'fixed' | 'percentage'
  other_fee: number
  other_fee_type: 'fixed' | 'percentage'
}

export type PortalBill = {
  uuid: string
  bill_number: string
  title: string
  description: string | null
  amount: number
  amount_label: string
  principal_amount?: number
  principal_amount_label?: string
  penalty_amount?: number
  penalty_amount_label?: string
  has_penalty?: boolean
  amount_paid: number
  amount_paid_label: string
  balance: number
  balance_label: string
  due_on: string | null
  due_on_label: string | null
  coverage_start: string | null
  coverage_end: string | null
  coverage_label: string | null
  status: string
  generated_at: string | null
  generated_label: string | null
  paid_at: string | null
  paid_label: string | null
  is_overdue: boolean
  is_payable: boolean
}

export type PortalPayment = {
  uuid: string
  type: 'payment'
  reference_number: string
  bill_uuid: string
  bill_number: string
  bill_title: string | null | undefined
  amount: number
  amount_label: string
  applied_to_bill: number
  applied_to_bill_label: string
  balance_after: number | null
  balance_after_label: string | null
  credit_added: number
  credit_added_label: string
  platform_tax: number
  platform_tax_label: string
  platform_system_fee: number
  platform_system_fee_label: string
  platform_other_fee: number
  platform_other_fee_label: string
  platform_fees_total: number
  platform_fees_total_label: string
  payment_method: string
  status: string
  paid_at: string | null
  paid_label: string | null
}

export type CustomerPortalProfile = {
  customer: {
    uuid: string
    account_number: string
    first_name: string
    last_name: string | null
    full_name: string
    email: string | null
    phone: string | null
    address: string | null
    address_label?: string | null
    phase?: string | null
    block?: string | null
    lot?: string | null
    street?: string | null
    date_of_birth?: string | null
    date_of_birth_label?: string | null
    status: string
    credit_balance: number
    credit_balance_label: string
    registered_at: string | null
    registered_label: string | null
  }
  merchant: {
    uuid: string | null
    code: string | null
    name: string
    email: string | null
    phone: string | null
    commission?: PortalCommissionConfig
    checkout?: PortalCheckoutSettings
  }
  summary: {
    pending_count: number
    pending_total: number
    pending_total_label: string
    paid_count: number
    paid_total: number
    paid_total_label: string
    total_bills: number
  }
  pending_bills: PortalBill[]
  history: PortalPayment[]
}
