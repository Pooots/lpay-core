import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Eye, LoaderCircle, Search, Send, X } from 'lucide-react'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { adminPayoutService } from '@/services/adminPayoutService'
import type { AccountingPayout } from '@/types/accounting'
import { cn } from '@/lib/utils'

function statusClass(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-sky-50 text-sky-800'
    case 'released':
      return 'bg-emerald-50 text-emerald-700'
    default:
      return 'bg-secondary text-primary'
  }
}

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<AccountingPayout | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const payoutsQuery = useQuery({
    queryKey: ['admin-payouts', debouncedSearch, statusFilter],
    queryFn: () =>
      adminPayoutService.list({
        q: debouncedSearch || undefined,
        status: statusFilter || undefined,
      }),
  })

  const payouts = useMemo(
    () => payoutsQuery.data?.data ?? [],
    [payoutsQuery.data],
  )
  const summary = payoutsQuery.data?.summary

  const releaseMutation = useMutation({
    mutationFn: (uuid: string) => adminPayoutService.release(uuid),
    onSuccess: async (payout) => {
      setActionError('')
      setSelected(payout)
      await queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
    },
    onError: (err) => {
      setActionError(
        axios.isAxiosError(err)
          ? ((err.response?.data?.message as string | undefined) ??
              'Unable to release payout.')
          : 'Unable to release payout.',
      )
    },
  })

  return (
    <SuperAdminShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Payouts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Release approved payouts and track completed transfers. Merchants
            request payout from Available balance.
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Approved"
            value={String(summary?.approved ?? 0)}
            hint={summary?.total_approved_label ?? 'Awaiting release'}
          />
          <StatCard
            label="Released"
            value={String(summary?.released ?? 0)}
            hint={summary?.total_released_label ?? 'Completed transfers'}
          />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference or merchant..."
              className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All statuses</option>
            <option value="approved">Approved</option>
            <option value="released">Released</option>
          </select>
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          {payoutsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading payouts…
            </div>
          ) : payoutsQuery.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              Unable to load payouts.
            </div>
          ) : payouts.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No approved or released payouts yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Requested</th>
                    <th className="pb-3 pr-4">Reference</th>
                    <th className="pb-3 pr-4">Merchant</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Txns</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((payout) => (
                    <tr
                      key={payout.uuid}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {payout.requested_label || '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-xs font-semibold text-gold-foreground">
                          {payout.reference_number}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-foreground">
                          {payout.merchant?.name || '—'}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {payout.merchant?.code || '—'}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4 font-semibold">
                        {payout.amount_label}
                      </td>
                      <td className="py-3.5 pr-4">{payout.payment_count}</td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                            statusClass(payout.status),
                          )}
                        >
                          {payout.status_label}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setActionError('')
                            setSelected(payout)
                          }}
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
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)] sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">Payout</h2>
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

            {actionError ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {actionError}
              </div>
            ) : null}

            <dl className="mb-5 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  Merchant
                </dt>
                <dd className="mt-0.5 font-medium">
                  {selected.merchant?.name || '—'} ({selected.merchant?.code})
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  Amount
                </dt>
                <dd className="mt-0.5 text-lg font-bold">
                  {selected.amount_label}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  Status
                </dt>
                <dd className="mt-0.5">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                      statusClass(selected.status),
                    )}
                  >
                    {selected.status_label}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  Requested
                </dt>
                <dd className="mt-0.5">{selected.requested_label || '—'}</dd>
              </div>
            </dl>

            <h3 className="mb-3 text-sm font-bold text-foreground">
              Transactions ({selected.transactions.length})
            </h3>
            <div className="mb-5 space-y-2">
              {selected.transactions.map((tx) => (
                <div
                  key={tx.uuid}
                  className="rounded-xl border border-border px-3.5 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {tx.customer_name || 'Customer'}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-gold-foreground">
                        {tx.reference_number}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {tx.bill_title || 'Bill'} · {tx.paid_date_label || '—'} ·{' '}
                        {tx.payout_status_label}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold">{tx.amount_label}</p>
                  </div>
                </div>
              ))}
            </div>

            {selected.status === 'approved' ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={releaseMutation.isPending}
                  onClick={() => releaseMutation.mutate(selected.uuid)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
                >
                  {releaseMutation.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                  Release
                </button>
              </div>
            ) : null}
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
