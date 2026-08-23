import { Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  Building2,
  CreditCard,
  LoaderCircle,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { PremiumCollectionVolumeChart } from '@/components/admin/PremiumCollectionVolumeChart'
import {
  superAdminDashboardService,
  type DashboardRange,
} from '@/services/superAdminDashboardService'
import type {
  DashboardBillStatus,
  DashboardRecentBill,
  DashboardTopMerchant,
} from '@/types/dashboard'
import { cn } from '@/lib/utils'

const RANGE_OPTIONS: Array<{ id: DashboardRange; label: string }> = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'custom', label: 'Custom' },
]

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthStartIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

function BillStatusDonut({ slices }: { slices: DashboardBillStatus[] }) {
  const total = slices.reduce((sum, item) => sum + item.count, 0) || 1
  const radius = 54
  const stroke = 18
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const hasData = slices.some((s) => s.count > 0)

  return (
    <div className="flex w-full min-w-0 flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <svg
        width="160"
        height="160"
        viewBox="0 0 160 160"
        className="mx-auto shrink-0 sm:mx-0"
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#f3ebfa"
          strokeWidth={stroke}
        />
        {hasData
          ? slices.map((slice) => {
              const length = (slice.count / total) * circumference
              const dashOffset = -offset
              offset += length
              return (
                <circle
                  key={slice.key}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="butt"
                  transform="rotate(-90 80 80)"
                />
              )
            })
          : null}
        <text
          x="80"
          y="76"
          textAnchor="middle"
          className="fill-foreground text-[11px] font-medium"
        >
          Status
        </text>
        <text
          x="80"
          y="96"
          textAnchor="middle"
          className="fill-primary text-lg font-bold"
        >
          {hasData ? '100%' : '0%'}
        </text>
      </svg>

      <ul className="min-w-0 flex-1 space-y-2.5">
        {slices.map((slice) => (
          <li
            key={slice.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-[#fcfaff] px-3 py-2.5 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate text-muted-foreground">
                {slice.label}
              </span>
            </span>
            <span className="shrink-0 font-semibold text-foreground">
              {slice.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'paid':
      return 'bg-[#f4efd8] text-[#5c480f]'
    case 'partial':
      return 'bg-sky-50 text-sky-800'
    case 'overdue':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-secondary text-primary'
  }
}

export default function SuperAdminDashboardPage() {
  const [range, setRange] = useState<DashboardRange>('monthly')
  const [customFrom, setCustomFrom] = useState(monthStartIso)
  const [customTo, setCustomTo] = useState(todayIso)

  const periodParams = useMemo(
    () => ({
      range,
      from: range === 'custom' ? customFrom : undefined,
      to: range === 'custom' ? customTo : undefined,
    }),
    [range, customFrom, customTo],
  )

  const dashboardQuery = useQuery({
    queryKey: ['super-admin-dashboard', periodParams],
    queryFn: () => superAdminDashboardService.get(periodParams),
    placeholderData: keepPreviousData,
    enabled:
      range !== 'custom' ||
      (Boolean(customFrom) &&
        Boolean(customTo) &&
        customFrom <= customTo),
  })

  const summary = dashboardQuery.data?.summary
  const period = dashboardQuery.data?.period
  const collectionVolume = useMemo(
    () => dashboardQuery.data?.collection_volume ?? [],
    [dashboardQuery.data],
  )
  const billStatus = useMemo(
    () => dashboardQuery.data?.bill_status ?? [],
    [dashboardQuery.data],
  )
  const recentBills = useMemo(
    () => dashboardQuery.data?.recent_bills ?? [],
    [dashboardQuery.data],
  )
  const topMerchants = useMemo(
    () => dashboardQuery.data?.top_merchants ?? [],
    [dashboardQuery.data],
  )

  const metrics = [
    {
      label: 'Total Merchants',
      value: String(summary?.merchants ?? 0),
      hint: null as string | null,
      icon: Building2,
      iconClass: 'bg-primary text-primary-foreground',
    },
    {
      label: 'Merchant Platform Commission',
      value:
        summary?.merchant_platform_commission_label ??
        summary?.total_collections_label ??
        '₱0.00',
      hint: 'Plan payments in selected period',
      icon: Sparkles,
      iconClass: 'bg-[#f7efd4] text-gold-foreground',
    },
    {
      label: 'Transactions Commission',
      value: summary?.transactions_commission_label ?? '₱0.00',
      hint: 'Member payment fees in selected period',
      icon: Wallet,
      iconClass: 'bg-[#efe6f8] text-primary',
    },
    {
      label: 'Merchant Pending Plan Payment',
      value: summary?.merchant_pending_plan_amount_label ?? '₱0.00',
      hint: `${summary?.merchant_pending_plan_count ?? 0} merchant${
        (summary?.merchant_pending_plan_count ?? 0) === 1 ? '' : 's'
      } unpaid next month`,
      icon: CreditCard,
      iconClass: 'bg-[#fce8ef] text-[#b4234a]',
    },
  ] as const

  return (
    <SuperAdminShell>
      <div className="home-rise space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Platform-wide overview of merchants, billing and commissions.
            </p>
            {period?.label ? (
              <p className="mt-2 text-sm font-medium text-primary">
                Showing: {period.label}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-white p-1">
              {RANGE_OPTIONS.map((option) => {
                const active = range === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setRange(option.id)}
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:text-sm',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>

            {range === 'custom' ? (
              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  From
                  <input
                    type="date"
                    value={customFrom}
                    max={customTo || undefined}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1 block rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </label>
                <label className="text-xs font-medium text-muted-foreground">
                  To
                  <input
                    type="date"
                    value={customTo}
                    min={customFrom || undefined}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-1 block rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-primary"
                  />
                </label>
              </div>
            ) : null}
          </div>
        </div>

        {dashboardQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white py-20 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading dashboard…
          </div>
        ) : dashboardQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
            Unable to load dashboard. Please refresh and try again.
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {metrics.map(({ label, value, hint, icon: Icon, iconClass }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                        {value}
                      </p>
                      {hint ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {hint}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        'grid size-10 place-items-center rounded-xl',
                        iconClass,
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
              <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-foreground">
                    Collection Volume
                  </h2>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-primary">
                    {period?.label ?? 'Selected period'}
                  </span>
                </div>
                <PremiumCollectionVolumeChart points={collectionVolume} />
              </section>

              <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
                <h2 className="mb-4 text-base font-semibold text-foreground">
                  Bill Status
                </h2>
                <BillStatusDonut slices={billStatus} />
              </section>
            </div>

            <TopMerchantsCard merchants={topMerchants} />

            <RecentBillsTable bills={recentBills} />
          </>
        )}
      </div>
    </SuperAdminShell>
  )
}

function TopMerchantsCard({
  merchants,
}: {
  merchants: DashboardTopMerchant[]
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Top Merchant Performers
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Ranked by completed transaction collections
          </p>
        </div>
        <Link
          to="/admin/super/merchants"
          className="inline-flex items-center gap-1 text-sm font-medium text-gold transition hover:text-primary"
        >
          View merchants
          <ArrowRight className="size-4" />
        </Link>
      </div>

      {merchants.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-[#fcfaff] px-4 py-10 text-center text-sm text-muted-foreground">
          No merchant transactions yet.
        </div>
      ) : (
        <div className="space-y-4">
          {merchants.map((merchant) => (
            <div
              key={merchant.uuid}
              className="rounded-2xl border border-border/80 bg-[#fcfaff] px-4 py-3.5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {merchant.rank}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {merchant.name}
                    </p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {merchant.code} · {merchant.transaction_count}{' '}
                      transaction
                      {merchant.transaction_count === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-foreground">
                    {merchant.collected_label}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {merchant.share_percent}% of platform · billed{' '}
                    {merchant.billed_label}
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(merchant.bar_percent, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function RecentBillsTable({ bills }: { bills: DashboardRecentBill[] }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Recent Bills</h2>
        <Link
          to="/admin/super/bills"
          className="inline-flex items-center gap-1 text-sm font-medium text-gold transition hover:text-primary"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 pr-4 font-semibold">Bill #</th>
              <th className="pb-3 pr-4 font-semibold">Merchant</th>
              <th className="pb-3 pr-4 font-semibold">Customer</th>
              <th className="pb-3 pr-4 font-semibold">Amount</th>
              <th className="pb-3 pr-4 font-semibold">Due Date</th>
              <th className="pb-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No bills yet.
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr
                  key={bill.uuid}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="py-3.5 pr-4">
                    <Link
                      to="/admin/super/bills"
                      className="font-medium text-primary hover:underline"
                    >
                      {bill.bill_number}
                    </Link>
                  </td>
                  <td className="py-3.5 pr-4 text-foreground">
                    {bill.merchant_name || '—'}
                  </td>
                  <td className="py-3.5 pr-4 text-foreground">
                    {bill.customer_name || '—'}
                  </td>
                  <td className="py-3.5 pr-4 font-medium text-foreground">
                    {bill.amount_label}
                  </td>
                  <td className="py-3.5 pr-4 text-muted-foreground">
                    {bill.due_label}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                        statusBadgeClass(bill.status),
                      )}
                    >
                      {bill.status_label}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
