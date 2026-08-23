import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Clock3,
  CreditCard,
  FileText,
  LoaderCircle,
  PhilippinePeso,
  Users,
  Wallet,
} from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import { PremiumCollectionVolumeChart } from '@/components/admin/PremiumCollectionVolumeChart'
import { merchantAuthService } from '@/services/merchantAuthService'
import { merchantDashboardService } from '@/services/merchantDashboardService'
import type {
  DashboardBillStatus,
  DashboardRecentBill,
} from '@/types/dashboard'
import { cn } from '@/lib/utils'

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

export default function MerchantDashboardPage() {
  const merchant = merchantAuthService.getMerchant()
  const isPendingOnboarding =
    (merchant?.status ?? '').toLowerCase() === 'pending'

  const meQuery = useQuery({
    queryKey: ['merchant-me'],
    queryFn: () => merchantAuthService.me(),
    staleTime: 60 * 1000,
  })
  const pendingFromMe =
    (meQuery.data?.merchant?.status ?? merchant?.status ?? '').toLowerCase() ===
    'pending'
  const showPending = pendingFromMe || isPendingOnboarding

  const dashboardQuery = useQuery({
    queryKey: ['merchant-dashboard'],
    queryFn: () => merchantDashboardService.get(),
  })

  const summary = dashboardQuery.data?.summary
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

  const metrics = [
    {
      label: 'Total Customers',
      value: String(summary?.customers ?? 0),
      icon: Users,
      iconClass: 'bg-primary text-primary-foreground',
    },
    {
      label: 'Bills Generated',
      value: String(summary?.bills_generated ?? 0),
      icon: FileText,
      iconClass: 'bg-[#efe6f8] text-primary',
    },
    {
      label: 'Online payment',
      value: summary?.online_payments_label ?? '₱0.00',
      icon: Wallet,
      iconClass: 'bg-[#f7efd4] text-gold-foreground',
    },
    {
      label: 'Outstanding',
      value: summary?.outstanding_label ?? '₱0.00',
      icon: Clock3,
      iconClass: 'bg-[#f8e9c8] text-[#8a6a12]',
    },
  ] as const

  return (
    <MerchantShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Merchant Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Overview of your customers, bills, and collections
            {merchant?.name ? ` for ${merchant.name}` : ''}.
          </p>
        </div>

        {showPending ? (
          <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white p-6 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700">
                <Clock3 className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                  Account status
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Pending Onboarding
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Activate your account in two ways: pay for a plan under Plan,
                  or wait for a super admin to activate you. You can explore
                  modules, but transactions stay locked until activation.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to="/admin/plan"
                    search={{ payment: undefined, status: undefined }}
                    className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground"
                  >
                    Pay plan to activate
                  </Link>
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                    Browse modules
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border">
                    Transactions locked
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

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
              {metrics.map(({ label, value, icon: Icon, iconClass }) => (
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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Overdue Payments
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      {summary?.overdue_amount_label ?? '₱0.00'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {summary?.overdue_bills ?? 0} overdue bills
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-[#fce8ef] text-[#b4234a]">
                    <AlertTriangle className="size-5" />
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Pending Payments
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      {summary?.pending_payments_label ?? '₱0.00'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {summary?.pending_payments_count ?? 0} awaiting payment
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                    <CreditCard className="size-5" />
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Manual Payments
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      {summary?.manual_payments_label ?? '₱0.00'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {summary?.manual_payments_count ?? 0} over-the-counter
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-[#f7efd4] text-gold-foreground">
                    <Banknote className="size-5" />
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-primary/25 bg-secondary p-5 shadow-[0_12px_32px_-20px_rgb(75_29_110_/_0.55)] ring-1 ring-primary/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      Total Collected amounts
                    </p>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                      {summary?.collections_label ?? '₱0.00'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Online {summary?.online_payments_label ?? '₱0.00'} · Manual{' '}
                      {summary?.manual_payments_label ?? '₱0.00'}
                    </p>
                  </div>
                  <span className="grid size-10 place-items-center rounded-xl bg-white/90 text-primary shadow-sm">
                    <PhilippinePeso className="size-5" />
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
              <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-foreground">
                    Collection Volume
                  </h2>
                  <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-primary">
                    Last 30 days
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

            <RecentBillsTable
              bills={recentBills}
              viewAllTo="/admin/generate-bills"
            />
          </>
        )}
      </div>
    </MerchantShell>
  )
}

function RecentBillsTable({
  bills,
  viewAllTo,
}: {
  bills: DashboardRecentBill[]
  viewAllTo: '/admin/generate-bills'
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-foreground">Recent Bills</h2>
        <Link
          to={viewAllTo}
          className="inline-flex items-center gap-1 text-sm font-medium text-gold transition hover:text-primary"
        >
          View all
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="pb-3 pr-4 font-semibold">Bill #</th>
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
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No bills yet. Start by adding customers and generating bills.
                </td>
              </tr>
            ) : (
              bills.map((bill) => (
                <tr
                  key={bill.uuid}
                  className="border-b border-border/70 last:border-0"
                >
                  <td className="py-3.5 pr-4">
                    <span className="font-medium text-primary">
                      {bill.bill_number}
                    </span>
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
