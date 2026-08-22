export type TrackerCellStatus =
  | 'paid'
  | 'partial'
  | 'overdue'
  | 'issued'
  | string

export type TrackerCellItem = {
  bill_uuid: string
  title: string
  status: TrackerCellStatus
  status_label: string
  amount: number
  amount_label: string
  amount_paid: number
  amount_paid_label: string
  balance: number
  balance_label: string
  due_on: string | null
  is_overdue: boolean
}

export type TrackerCell = {
  bill_uuid: string | null
  bill_count: number
  status: TrackerCellStatus
  status_label: string
  amount: number
  amount_label: string
  amount_paid: number
  amount_paid_label: string
  balance: number
  balance_label: string
  due_on: string | null
  is_overdue: boolean
  display: string
  items: TrackerCellItem[]
}

export type TrackerColumn = {
  key: string
  title: string
  short_label: string
  bill_set_uuid: string | null
  coverage_month: string | null
  coverage_start: string | null
  coverage_end: string | null
}

export type TrackerRow = {
  customer_uuid: string
  full_name: string
  account_number: string
  member_status: 'active' | 'inactive' | string
  cells: Record<string, TrackerCell | null>
  total_amount: number
  total_amount_label: string
  total_paid: number
  total_paid_label: string
  total_balance: number
  total_balance_label: string
  paid_count: number
  unpaid_count: number
}

export type TrackerBillSetOption = {
  uuid: string
  title: string
  is_active: boolean
}

export type TrackerSummary = {
  members: number
  periods: number
  paid_cells: number
  unpaid_cells: number
  total_collected: number
  total_collected_label: string
  total_outstanding: number
  total_outstanding_label: string
}

export type TrackerMatrix = {
  year: number
  bill_set_uuid: string | null
  bill_sets: TrackerBillSetOption[]
  columns: TrackerColumn[]
  rows: TrackerRow[]
  summary: TrackerSummary
}
