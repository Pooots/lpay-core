export type DashboardVolumePoint = {
  key: string
  label: string
  value: number
}

export type DashboardBillStatus = {
  key: string
  label: string
  count: number
  percent: number
  value: number
  color: string
}

export type DashboardRecentBill = {
  uuid: string
  bill_number: string
  customer_name: string | null
  merchant_name?: string | null
  amount: number
  amount_label: string
  due_on: string | null
  due_label: string
  status: string
  status_label: string
}

export type MerchantDashboardSummary = {
  customers: number
  bills_generated: number
  total_billed: number
  total_billed_label: string
  collections: number
  collections_label: string
  online_payments?: number
  online_payments_label?: string
  online_payments_count?: number
  outstanding: number
  outstanding_label: string
  overdue_bills: number
  overdue_amount?: number
  overdue_amount_label?: string
  pending_payments: number
  pending_payments_label: string
  pending_payments_count: number
  manual_payments: number
  manual_payments_label: string
  manual_payments_count: number
}

export type SuperAdminDashboardSummary = {
  merchants: number
  active_merchants: number
  total_billing: number
  total_billing_label: string
  total_collections: number
  total_collections_label: string
  outstanding: number
  outstanding_label: string
  overdue_bills: number
  bills_count: number
}

export type MerchantDashboardData = {
  summary: MerchantDashboardSummary
  collection_volume: DashboardVolumePoint[]
  bill_status: DashboardBillStatus[]
  recent_bills: DashboardRecentBill[]
}

export type DashboardTopMerchant = {
  uuid: string
  name: string
  code: string
  status: string
  billed: number
  billed_label: string
  collected: number
  collected_label: string
  transaction_count: number
  bill_count: number
  rank: number
  share_percent: number
  bar_percent: number
}

export type SuperAdminDashboardData = {
  summary: SuperAdminDashboardSummary
  collection_volume: DashboardVolumePoint[]
  bill_status: DashboardBillStatus[]
  top_merchants: DashboardTopMerchant[]
  recent_bills: DashboardRecentBill[]
}
