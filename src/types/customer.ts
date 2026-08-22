export type CustomerStatus = 'active' | 'inactive'

export type Customer = {
  uuid: string
  merchant_uuid: string
  merchant_name: string
  account_number: string
  first_name: string
  last_name: string | null
  full_name: string
  email: string | null
  has_password?: boolean
  phone: string | null
  phase: string | null
  block: string | null
  lot: string | null
  street: string | null
  address_label: string | null
  date_of_birth: string | null
  date_of_birth_label: string | null
  status: CustomerStatus
  registered_at: string | null
  registered_label: string | null
}

export type CustomerPayload = {
  first_name: string
  last_name: string
  email?: string
  password?: string
  phone?: string
  phase?: string
  block?: string
  lot?: string
  street?: string
  date_of_birth?: string
  registered_at?: string
  status?: CustomerStatus
}

export type CustomerImportRow = {
  row?: number
  first_name: string
  last_name: string
  email?: string | null
  password?: string | null
  phone?: string | null
  phase?: string | null
  block?: string | null
  lot?: string | null
  street?: string | null
  date_of_birth?: string | null
  registered_at?: string | null
  status?: CustomerStatus | string
}

export type CustomerImportPreview = {
  file_name: string
  rows: CustomerImportRow[]
  errors: Array<{ row: number; message: string }>
}

export type CustomerImportResult = {
  created: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

export type CustomerBillRow = {
  uuid: string
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
  status: string
  generated_at: string | null
  generated_label: string | null
  paid_at: string | null
  paid_label: string | null
  is_missed: boolean
  is_overdue: boolean
}

export type CustomerTransactionRow = {
  uuid: string
  reference_number: string
  bill_uuid: string | null
  bill_number: string | null
  bill_title: string | null
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
  status: string
  paid_at: string | null
  paid_label: string | null
}

export type CustomerDetail = Customer & {
  credit_balance: number
  credit_balance_label: string
  summary: {
    bill_count: number
    missed_count: number
    missed_total: number
    missed_total_label: string
    transaction_count: number
    payment_total: number
    payment_total_label: string
  }
  missed_bills: CustomerBillRow[]
  bills: CustomerBillRow[]
  transactions: CustomerTransactionRow[]
}
