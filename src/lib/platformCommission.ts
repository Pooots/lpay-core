import type { PortalCommissionConfig } from '@/types/portal'

function money(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function feeAmount(
  baseAmount: number,
  value: number,
  type: 'fixed' | 'percentage',
): number {
  const safe = Math.max(value, 0)
  if (type === 'percentage') {
    return Number(((baseAmount * Math.min(safe, 100)) / 100).toFixed(2))
  }
  return Number(safe.toFixed(2))
}

export type CheckoutFeeBreakdown = {
  base_amount: number
  base_amount_label: string
  tax: number
  tax_label: string
  tax_type: 'fixed' | 'percentage'
  tax_rate: number
  system_fee: number
  system_fee_label: string
  system_fee_type: 'fixed' | 'percentage'
  system_fee_rate: number
  other_fee: number
  other_fee_label: string
  other_fee_type: 'fixed' | 'percentage'
  other_fee_rate: number
  fees_total: number
  fees_total_label: string
  total_amount: number
  total_amount_label: string
}

export function computeCheckoutFees(
  baseAmount: number,
  commission?: PortalCommissionConfig | null,
): CheckoutFeeBreakdown {
  const base = Number(Math.max(baseAmount, 0).toFixed(2))
  const taxType = commission?.tax_type === 'fixed' ? 'fixed' : 'percentage'
  const systemType =
    commission?.system_fee_type === 'fixed' ? 'fixed' : 'percentage'
  const otherType =
    commission?.other_fee_type === 'fixed' ? 'fixed' : 'percentage'

  const tax = feeAmount(base, commission?.tax ?? 0, taxType)
  const systemFee = feeAmount(base, commission?.system_fee ?? 0, systemType)
  const otherFee = feeAmount(base, commission?.other_fee ?? 0, otherType)
  const feesTotal = Number((tax + systemFee + otherFee).toFixed(2))
  const total = Number((base + feesTotal).toFixed(2))

  return {
    base_amount: base,
    base_amount_label: money(base),
    tax,
    tax_label: money(tax),
    tax_type: taxType,
    tax_rate: commission?.tax ?? 0,
    system_fee: systemFee,
    system_fee_label: money(systemFee),
    system_fee_type: systemType,
    system_fee_rate: commission?.system_fee ?? 0,
    other_fee: otherFee,
    other_fee_label: money(otherFee),
    other_fee_type: otherType,
    other_fee_rate: commission?.other_fee ?? 0,
    fees_total: feesTotal,
    fees_total_label: money(feesTotal),
    total_amount: total,
    total_amount_label: money(total),
  }
}
