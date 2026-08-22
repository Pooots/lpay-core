export type PaymentOutcome =
  | 'full'
  | 'partial'
  | 'overpaid'
  | 'credit_applied'
  | 'voided'

export type MerchantPayment = {
  uuid: string
  reference_number: string
  bill_uuid: string
  bill_number: string
  bill_title: string | null
  bill_amount: number | null
  bill_amount_label: string | null
  customer_uuid: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  account_number: string
  amount: number
  amount_label: string
  applied_to_bill: number
  applied_to_bill_label: string
  balance_after: number | null
  balance_after_label: string | null
  credit_added: number
  credit_added_label: string
  payment_method: string
  payment_method_label: string
  payment_provider?: string | null
  status: string
  can_void?: boolean
  outcome: PaymentOutcome
  outcome_label: string
  paid_at: string | null
  paid_label: string | null
  paid_date_label: string | null
  created_at: string | null
  notes?: string | null
}

export type MerchantPaymentsSummary = {
  total_payments: number
  total_collected: number
  total_collected_label: string
  total_applied: number
  total_applied_label: string
  total_credit_added: number
  total_credit_added_label: string
}
