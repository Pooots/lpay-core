import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Ban,
  CreditCard,
  Eye,
  LoaderCircle,
  Search,
  Wallet,
  X,
} from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import { useDialog } from '@/components/ui/AppDialog'
import { TablePagination } from '@/components/ui/TablePagination'
import { paymentService } from '@/services/paymentService'
import type { MerchantPayment, PaymentOutcome } from '@/types/payment'
import { emptyPaginationMeta } from '@/types/pagination'
import { cn } from '@/lib/utils'

function outcomeClass(outcome: PaymentOutcome) {
  switch (outcome) {
    case 'partial':
      return 'bg-amber-50 text-amber-800'
    case 'overpaid':
      return 'bg-sky-50 text-sky-800'
    case 'credit_applied':
      return 'bg-secondary text-primary'
    case 'voided':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-emerald-50 text-emerald-700'
  }
}

function PaymentDetailsModal({
  payment,
  open,
  onClose,
}: {
  payment: MerchantPayment | null
  open: boolean
  onClose: () => void
}) {
  if (!open || !payment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)] sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">Payment details</h2>
            <p className="mt-1 font-mono text-xs font-semibold tracking-wide text-gold-foreground">
              {payment.reference_number}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
          >
            <X className="size-5" />
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <DetailRow label="Customer" value={payment.customer_name || '—'} />
          <DetailRow label="Account No." value={payment.account_number} mono />
          <DetailRow label="Bill" value={payment.bill_title || '—'} />
          <DetailRow label="Bill No." value={payment.bill_number} mono />
          <DetailRow
            label="Bill amount"
            value={payment.bill_amount_label || '—'}
          />
          <DetailRow label="Amount paid" value={payment.amount_label} />
          <DetailRow
            label="Applied to bill"
            value={payment.applied_to_bill_label}
          />
          <DetailRow
            label="Balance after"
            value={payment.balance_after_label || '₱0.00'}
          />
          <DetailRow label="Credit added" value={payment.credit_added_label} />
          <DetailRow label="Method" value={payment.payment_method_label} />
          <DetailRow label="Outcome" value={payment.outcome_label} />
          <DetailRow label="Status" value={payment.status} />
          <DetailRow label="Paid on" value={payment.paid_label || '—'} />
        </dl>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid gap-1 border-b border-border/70 pb-3 last:border-0 last:pb-0 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'font-medium text-foreground',
          mono && 'font-mono text-xs text-gold-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

export default function PaymentsPage() {
  const dialog = useDialog()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<MerchantPayment | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const paymentsQuery = useQuery({
    queryKey: ['merchant-payments', debouncedSearch, page],
    queryFn: () =>
      paymentService.list({
        q: debouncedSearch || undefined,
        page,
        per_page: 10,
      }),
  })

  const voidMutation = useMutation({
    mutationFn: (uuid: string) => paymentService.voidManual(uuid),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['merchant-payments'] })
      await queryClient.invalidateQueries({ queryKey: ['merchant-manual-payments'] })
      await queryClient.invalidateQueries({ queryKey: ['merchant-dashboard'] })
      await queryClient.invalidateQueries({ queryKey: ['merchant-bills'] })
      void dialog.alert({
        title: 'Payment voided',
        message: 'The manual payment was voided and the bill balance was restored.',
      })
    },
    onError: async (error) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string; errors?: Record<string, string[]> })
            ?.errors?.payment?.[0] ||
          (error.response?.data as { message?: string })?.message ||
          'Unable to void this payment.'
        : 'Unable to void this payment.'
      await dialog.alert({
        title: 'Void failed',
        message,
        tone: 'danger',
      })
    },
  })

  const payments = useMemo(
    () => paymentsQuery.data?.data ?? [],
    [paymentsQuery.data],
  )
  const summary = paymentsQuery.data?.summary
  const paginationMeta = paymentsQuery.data?.meta ?? emptyPaginationMeta(10)

  return (
    <MerchantShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Payments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            All payments made by your customers, including partial and overpayments
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          <SummaryCard
            label="Total payments"
            value={String(summary?.total_payments ?? 0)}
            hint="Recorded transactions"
          />
          <SummaryCard
            label="Total collected"
            value={summary?.total_collected_label ?? '₱0.00'}
            hint="All payment amounts"
            accent
          />
          <SummaryCard
            label="Credit from overpay"
            value={summary?.total_credit_added_label ?? '₱0.00'}
            hint="Saved for next bills"
          />
        </section>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, customer, account, bill number..."
            className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          {paymentsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading payments…
            </div>
          ) : paymentsQuery.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              Unable to load payments. Please refresh and try again.
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center">
              <Wallet className="mx-auto size-10 text-primary/40" />
              <p className="mt-3 font-medium text-foreground">No payments yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Customer payments from checkout will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Date</th>
                    <th className="pb-3 pr-4">Reference</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Bill</th>
                    <th className="pb-3 pr-4">Paid</th>
                    <th className="pb-3 pr-4">Applied</th>
                    <th className="pb-3 pr-4">Balance after</th>
                    <th className="pb-3 pr-4">Credit</th>
                    <th className="pb-3 pr-4">Outcome</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.uuid}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {payment.paid_date_label || '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-xs font-semibold text-gold-foreground">
                          {payment.reference_number}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-foreground">
                          {payment.customer_name || '—'}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {payment.account_number}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="text-foreground">
                          {payment.bill_title || '—'}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {payment.bill_number}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4 font-semibold text-foreground">
                        {payment.amount_label}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {payment.applied_to_bill_label}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {payment.balance_after_label || '₱0.00'}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {payment.credit_added > 0
                          ? payment.credit_added_label
                          : '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                            outcomeClass(payment.outcome),
                          )}
                        >
                          {payment.outcome_label}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelected(payment)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary"
                          >
                            <Eye className="size-3.5" />
                            View
                          </button>
                          {payment.can_void ? (
                            <button
                              type="button"
                              title="Void manual payment"
                              aria-label={`Void payment ${payment.reference_number}`}
                              disabled={voidMutation.isPending}
                              onClick={() => {
                                void (async () => {
                                  const ok = await dialog.confirm({
                                    title: 'Void manual payment',
                                    message: `Void ${payment.reference_number} for ${payment.customer_name || 'this customer'} (${payment.amount_label})? The bill balance will be restored. This cannot be undone.`,
                                    confirmLabel: 'Void',
                                    cancelLabel: 'Cancel',
                                    tone: 'danger',
                                  })
                                  if (ok) {
                                    voidMutation.mutate(payment.uuid)
                                  }
                                })()
                              }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                              <Ban className="size-3.5" />
                              Void
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!paymentsQuery.isLoading && !paymentsQuery.isError ? (
            <TablePagination
              meta={paginationMeta}
              onPageChange={setPage}
              disabled={paymentsQuery.isFetching}
              label="payments"
            />
          ) : null}
        </section>
      </div>

      <PaymentDetailsModal
        payment={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </MerchantShell>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string
  value: string
  hint: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.3)]',
        accent ? 'border-primary/20 bg-secondary' : 'border-border bg-white',
      )}
    >
      <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
        <CreditCard className="size-4" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
