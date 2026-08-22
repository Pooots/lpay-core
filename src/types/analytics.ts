export type AnalyticsSummary = {
  total_billed: number
  total_billed_label: string
  total_collected: number
  total_collected_label: string
  collection_rate: number
  collection_rate_label: string
  avg_bill_value: number
  avg_bill_value_label: string
  bill_count: number
  payment_count: number
  merchant_count?: number
  active_merchant_count?: number
}

export type AnalyticsTopMerchant = {
  uuid: string
  name: string
  code: string
  status: string
  billed: number
  billed_label: string
  collected: number
  collected_label: string
  bill_count: number
  payment_count: number
}

export type AnalyticsMonthly = {
  key: string
  label: string
  billed: number
  collected: number
}

export type AnalyticsPaymentMethod = {
  method: string
  method_label: string
  count: number
  amount: number
  amount_label: string
  percent: number
  color: string
}

export type AnalyticsBillStatus = {
  status: string
  status_label: string
  count: number
}

export type AnalyticsData = {
  summary: AnalyticsSummary
  monthly: AnalyticsMonthly[]
  payment_methods: AnalyticsPaymentMethod[]
  bill_statuses: AnalyticsBillStatus[]
  top_merchants?: AnalyticsTopMerchant[]
}
