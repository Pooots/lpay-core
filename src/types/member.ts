export type MemberStatus = 'active' | 'inactive'

export type Member = {
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
  custom_fields?: Record<
    string,
    { label: string; value: string | null; type?: string; url?: string | null }
  >
  status: MemberStatus
  registered_at: string | null
  registered_label: string | null
}

export type MemberPayload = {
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
  status?: MemberStatus
}

export type MemberImportRow = {
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
  status?: MemberStatus | string
}

export type MemberImportPreview = {
  file_name: string
  rows: MemberImportRow[]
  errors: Array<{ row: number; message: string }>
}

export type MemberImportResult = {
  created: number
  skipped: number
  errors: Array<{ row: number; message: string }>
}

export type MemberBillRow = {
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
  is_missed: boolean
  is_overdue: boolean
}

export type MemberTransactionRow = {
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

export type MemberDetail = Member & {
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
  missed_bills: MemberBillRow[]
  bills: MemberBillRow[]
  transactions: MemberTransactionRow[]
}

export type MemberRegistrationFieldKey =
  | 'first_name'
  | 'last_name'
  | 'email'
  | 'phone'
  | 'phase'
  | 'block'
  | 'lot'
  | 'street'
  | 'date_of_birth'
  | (string & {})

export type MemberRegistrationField = {
  key: MemberRegistrationFieldKey
  label: string
  enabled: boolean
  required: boolean
  type: 'text' | 'email' | 'date' | 'number' | 'textarea' | 'image'
  is_custom?: boolean
}

export type MemberRegistrationSettings = {
  enabled: boolean
  fields: MemberRegistrationField[]
  registration_url: string
  merchant: {
    uuid: string
    code: string
    name: string
  }
}

export type PublicMemberRegistrationForm = {
  merchant: {
    uuid: string
    code: string
    name: string
    email: string | null
    phone: string | null
    logo_url?: string | null
  }
  enabled: boolean
  fields: MemberRegistrationField[]
}

export type PublicMemberRegistrationPayload = Partial<
  Record<MemberRegistrationFieldKey, string>
>

export type PublicMemberRegistrationResult = {
  uuid: string
  account_number: string
  full_name: string
  merchant: {
    code: string
    name: string
  }
}
