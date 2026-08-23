export type MerchantPlanFeature =
  | 'members'
  | 'generate_bills'
  | 'tracker'
  | 'payments'
  | 'manual_payment'
  | 'accounting'
  | 'analytics'
  | 'priority_support'

export const PLAN_FEATURE_LABELS: Record<string, string> = {
  members: 'Members',
  generate_bills: 'Generate bills',
  tracker: 'Payment tracker',
  payments: 'Payments',
  manual_payment: 'Manual payment',
  accounting: 'Accounting',
  analytics: 'Analytics',
  priority_support: 'Priority support',
}

export type MerchantPlanSummary = {
  uuid: string
  name: string
  code: string
  description: string | null
  member_min: number
  member_max: number | null
  member_range_label: string
  monthly_fee: number
  monthly_fee_label: string
  platform_fees?: {
    tax: number
    tax_type: string
    system_fee: number
    system_fee_type: string
    other_fee: number
    other_fee_type: string
  }
  total_due?: number
  total_due_label?: string
  features: string[]
  features_enforced: boolean
  paid_through?: string | null
  paid_through_label?: string | null
  expires_on?: string | null
  expires_on_label?: string | null
  expires_at_label?: string | null
  days_until_expiry?: number | null
  reminder_due?: boolean
  is_expired?: boolean
}

/** Nav path → plan feature. Dashboard & Settings are always available. */
export const MERCHANT_PATH_FEATURES: Record<string, MerchantPlanFeature> = {
  '/admin/member': 'members',
  '/admin/customers': 'members',
  '/admin/generate-bills': 'generate_bills',
  '/admin/tracker': 'tracker',
  '/admin/payments': 'payments',
  '/admin/manual-payments': 'manual_payment',
  '/admin/accounting': 'accounting',
  '/admin/analytics': 'analytics',
}

export function merchantHasPlanFeature(
  plan: MerchantPlanSummary | null | undefined,
  feature: string,
): boolean {
  // No plan yet: show all modules (pending is view-only via write gate / API).
  if (!plan || !plan.features_enforced) {
    return true
  }
  return plan.features.includes(feature)
}

export function merchantCanAccessPath(
  plan: MerchantPlanSummary | null | undefined,
  path: string,
): boolean {
  const feature = MERCHANT_PATH_FEATURES[path]
  if (!feature) return true
  return merchantHasPlanFeature(plan, feature)
}
