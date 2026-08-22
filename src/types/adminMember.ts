export type AdminMember = {
  uuid: string
  account_number: string
  first_name: string
  last_name: string | null
  full_name: string
  email: string | null
  phone: string | null
  status: string
  merchant_uuid: string | null
  merchant_name: string | null
  merchant_code: string | null
  bill_count: number
  registered_at: string | null
  registered_label: string | null
}

export type AdminMemberPayment = {
  uuid: string
  reference_number: string
  bill_number: string | null
  bill_title: string | null
  amount: number
  amount_label: string
  payment_method: string
  payment_method_label: string
  status: string
  paid_at: string | null
  paid_label: string | null
}

export type AdminMemberDetail = AdminMember & {
  phase: string | null
  block: string | null
  lot: string | null
  street: string | null
  address: string | null
  address_label: string | null
  date_of_birth: string | null
  date_of_birth_label: string | null
  credit_balance: number
  credit_balance_label: string
  merchant_email: string | null
  merchant_phone: string | null
  summary: {
    payment_count: number
    completed_count: number
    payment_total: number
    payment_total_label: string
  }
  payments: AdminMemberPayment[]
}

export type AdminMembersSummary = {
  total: number
  active: number
  merchants: number
}
