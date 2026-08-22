export type BillStatus =
  | 'draft'
  | 'issued'
  | 'paid'
  | 'overdue'
  | 'cancelled'

export type Bill = {
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
  due_on: string
  due_on_label: string | null
  coverage_start: string
  coverage_end: string
  coverage_label: string | null
  notes: string | null
  status: BillStatus
  generated_at: string | null
  generated_label: string | null
}

export type BillPayload = {
  customer_uuid?: string
  title: string
  description?: string
  amount: number
  due_on: string
  coverage_start: string
  coverage_end: string
  notes?: string
  status?: BillStatus
}

export type GenerateBillsPayload = {
  customer_uuids: string[]
  title: string
  description?: string
  amount: number
  due_on: string
  coverage_start: string
  coverage_end: string
  notes?: string
  status?: BillStatus
}
