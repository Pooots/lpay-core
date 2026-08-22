import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, LoaderCircle, Search, X } from 'lucide-react'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { adminBillService } from '@/services/adminBillService'
import type { AdminBill, AdminBillStatus } from '@/types/adminBill'
import { cn } from '@/lib/utils'

function statusClass(status: AdminBillStatus) {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700'
    case 'overdue':
      return 'bg-rose-50 text-rose-700'
    case 'cancelled':
      return 'bg-secondary text-muted-foreground'
    case 'draft':
      return 'bg-amber-50 text-amber-800'
    case 'partial':
      return 'bg-sky-50 text-sky-800'
    default:
      return 'bg-secondary text-primary'
  }
}

function statusLabel(status: AdminBillStatus) {
  return String(status).replace(/_/g, ' ')
}

export default function AdminBillsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<AdminBill | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const billsQuery = useQuery({
    queryKey: ['admin-bills', debouncedSearch, statusFilter],
    queryFn: () =>
      adminBillService.list({
        q: debouncedSearch || undefined,
        status: statusFilter || undefined,
      }),
  })

  const bills = useMemo(() => billsQuery.data?.data ?? [], [billsQuery.data])
  const summary = billsQuery.data?.summary

  return (
    <SuperAdminShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Bills
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            View all bills across every merchant
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total bills"
            value={String(summary?.total ?? 0)}
            hint={summary?.total_amount_label ?? '₱0.00'}
          />
          <StatCard
            label="Issued"
            value={String(summary?.issued ?? 0)}
            hint="Awaiting payment"
          />
          <StatCard
            label="Paid"
            value={String(summary?.paid ?? 0)}
            hint={summary?.total_collected_label ?? '₱0.00 collected'}
          />
          <StatCard
            label="Overdue"
            value={String(summary?.overdue ?? 0)}
            hint={`${summary?.partial ?? 0} partial`}
          />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bill #, account, customer, merchant..."
              className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All statuses</option>
            <option value="issued">Issued</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          {billsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading bills…
            </div>
          ) : billsQuery.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              Unable to load bills.
            </div>
          ) : bills.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No bills found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Generated</th>
                    <th className="pb-3 pr-4">Bill #</th>
                    <th className="pb-3 pr-4">Merchant</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Balance</th>
                    <th className="pb-3 pr-4">Due</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr
                      key={bill.uuid}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {bill.generated_label || '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-mono text-xs font-semibold text-gold-foreground">
                          {bill.bill_number}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {bill.title}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-foreground">
                          {bill.merchant_name || '—'}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {bill.merchant_code || '—'}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-foreground">
                          {bill.customer_name || '—'}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {bill.account_number}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4 font-semibold">
                        {bill.amount_label}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {bill.balance_label}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {bill.due_on_label || '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                            statusClass(bill.status),
                          )}
                        >
                          {statusLabel(bill.status)}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(bill)}
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
                <h2 className="text-xl font-bold text-foreground">Bill details</h2>
                <p className="mt-1 font-mono text-xs font-semibold text-gold-foreground">
                  {selected.bill_number}
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
              <Detail label="Title" value={selected.title} />
              <Detail
                label="Status"
                value={
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                      statusClass(selected.status),
                    )}
                  >
                    {statusLabel(selected.status)}
                  </span>
                }
              />
              <Detail label="Merchant" value={selected.merchant_name} />
              <Detail label="Merchant code" value={selected.merchant_code} />
              <Detail label="Customer" value={selected.customer_name} />
              <Detail label="Account" value={selected.account_number} />
              <Detail label="Amount" value={selected.amount_label} />
              <Detail label="Paid" value={selected.amount_paid_label} />
              <Detail label="Balance" value={selected.balance_label} />
              <Detail label="Due on" value={selected.due_on_label || '—'} />
              <Detail
                label="Coverage"
                value={selected.coverage_label || '—'}
              />
              <Detail
                label="Generated"
                value={selected.generated_label || '—'}
              />
              {selected.paid_label ? (
                <Detail label="Paid on" value={selected.paid_label} />
              ) : null}
              {selected.description ? (
                <div className="sm:col-span-2">
                  <Detail label="Description" value={selected.description} />
                </div>
              ) : null}
              {selected.notes ? (
                <div className="sm:col-span-2">
                  <Detail label="Notes" value={selected.notes} />
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
