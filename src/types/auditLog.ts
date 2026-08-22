export type AuditLogCategory = 'auth' | 'merchant' | 'bank' | 'payout' | string

export type AuditLog = {
  uuid: string
  actor_uuid: string | null
  actor_name: string | null
  actor_email: string | null
  action: string
  action_label: string
  category: AuditLogCategory
  category_label: string
  subject_type: string | null
  subject_uuid: string | null
  subject_label: string | null
  description: string
  ip_address: string | null
  user_agent: string | null
  meta: Record<string, unknown> | null
  created_at: string | null
  created_label: string | null
  created_date_label: string | null
  created_time_label: string | null
}

export type AuditLogSummary = {
  total: number
  today: number
  auth: number
  merchant: number
  payout: number
  bank: number
}

export type AuditLogFilterOption = {
  value: string
  label: string
}

export type AuditLogsResponse = {
  data: AuditLog[]
  summary: AuditLogSummary
  filters: {
    categories: AuditLogFilterOption[]
    actions: AuditLogFilterOption[]
  }
}
