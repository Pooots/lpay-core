export type AdminCustomerPayment = {
  uuid: string
  reference_number: string
  merchant_uuid: string
  merchant_name: string | null
  merchant_code: string | null
  bill_uuid: string | null
  bill_number: string | null
  bill_title: string | null
  customer_uuid: string | null
  customer_name: string | null
  customer_email: string | null
  account_number: string
  amount: number
  amount_label: string
  payment_method: string
  payment_method_label: string
  status: string
  paid_at: string | null
  paid_label: string | null
  paid_date_label: string | null
}

export type AdminCustomerPaymentsSummary = {
  total: number
  completed: number
  total_amount: number
  total_amount_label: string
}
