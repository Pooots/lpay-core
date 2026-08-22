export type AdminBillStatus =
  | 'draft'
  | 'issued'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | 'partial'
  | string

export type AdminBill = {
  uuid: string
  merchant_uuid: string
  merchant_name: string
  merchant_code: string
  customer_uuid: string
  customer_name: string
  account_number: string
  bill_number: string
  title: string
  description: string | null
  amount: number
  amount_label: string
  amount_paid: number
  amount_paid_label: string
  balance: number
  balance_label: string
  due_on: string | null
  due_on_label: string | null
  coverage_start: string | null
  coverage_end: string | null
  coverage_label: string | null
  notes: string | null
  status: AdminBillStatus
  generated_at: string | null
  generated_label: string | null
  paid_at: string | null
  paid_label: string | null
}

export type AdminBillsSummary = {
  total: number
  issued: number
  paid: number
  overdue: number
  partial: number
  total_amount: number
  total_amount_label: string
  total_collected: number
  total_collected_label: string
}
