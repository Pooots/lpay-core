import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, LoaderCircle, Search, X } from 'lucide-react'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { adminCustomerPaymentService } from '@/services/adminCustomerPaymentService'
import type { AdminCustomerPayment } from '@/types/adminCustomerPayment'
import { cn } from '@/lib/utils'

function statusClass(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700'
    case 'pending':
      return 'bg-amber-50 text-amber-800'
    case 'failed':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-secondary text-primary'
  }
}

export default function AdminCustomerPaymentsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selected, setSelected] = useState<AdminCustomerPayment | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const paymentsQuery = useQuery({
    queryKey: ['admin-customer-payments', debouncedSearch],
    queryFn: () =>
      adminCustomerPaymentService.list({
        q: debouncedSearch || undefined,
      }),
  })

  const payments = useMemo(
    () => paymentsQuery.data?.data ?? [],
    [paymentsQuery.data],
  )
  const summary = paymentsQuery.data?.summary

  return (
    <SuperAdminShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Members Payment
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            All member payment transactions across every merchant
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Total payments"
            value={String(summary?.total ?? 0)}
            hint="All recorded payments"
          />
          <StatCard
            label="Completed"
            value={String(summary?.completed ?? 0)}
            hint="Successful transactions"
          />
          <StatCard
            label="Total amount"
            value={summary?.total_amount_label ?? '₱0.00'}
            hint="From completed payments"
          />
        </section>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reference #, bill #, account, customer, merchant..."
            className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
              Unable to load customer payments.
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No customer payments found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Paid on</th>
                    <th className="pb-3 pr-4">Reference</th>
                    <th className="pb-3 pr-4">Merchant</th>
                    <th className="pb-3 pr-4">Member</th>
                    <th className="pb-3 pr-4">Bill</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Method</th>
                    <th className="pb-3 pr-4">Status</th>
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
                        {payment.paid_label || '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-xs font-semibold text-gold-foreground">
                          {payment.reference_number}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-foreground">
                          {payment.merchant_name || '—'}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {payment.merchant_code || '—'}
                        </p>
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
                        <p className="font-mono text-xs text-foreground">
                          {payment.bill_number || '—'}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {payment.bill_title || '—'}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4 font-semibold">
                        {payment.amount_label}
                      </td>
                      <td className="py-3.5 pr-4 capitalize text-muted-foreground">
                        {payment.payment_method_label}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                            statusClass(payment.status),
                          )}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(payment)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-secondary"
                        >
                          <Eye className="size-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setSelected(null)}
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)] sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Payment details
                </h2>
                <p className="mt-1 font-mono text-xs font-semibold text-gold-foreground">
                  {selected.reference_number}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
              >
                <X className="size-5" />
              </button>
            </div>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Amount" value={selected.amount_label} />
              <Detail
                label="Status"
                value={
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                      statusClass(selected.status),
                    )}
                  >
                    {selected.status}
                  </span>
                }
              />
              <Detail label="Merchant" value={selected.merchant_name || '—'} />
              <Detail
                label="Merchant code"
                value={selected.merchant_code || '—'}
              />
              <Detail label="Member" value={selected.customer_name || '—'} />
              <Detail label="Account" value={selected.account_number} />
              <Detail label="Bill #" value={selected.bill_number || '—'} />
              <Detail label="Bill title" value={selected.bill_title || '—'} />
              <Detail
                label="Method"
                value={
                  <span className="capitalize">
                    {selected.payment_method_label}
                  </span>
                }
              />
              <Detail label="Paid on" value={selected.paid_label || '—'} />
              {selected.customer_email ? (
                <div className="sm:col-span-2">
                  <Detail label="Member email" value={selected.customer_email} />
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </SuperAdminShell>
  )
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.3)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function Detail({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium text-foreground">{value}</dd>
    </div>
  )
}
