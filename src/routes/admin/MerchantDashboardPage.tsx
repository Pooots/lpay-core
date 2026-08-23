import { Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  LoaderCircle,
  Users,
  Wallet,
} from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import { merchantAuthService } from '@/services/merchantAuthService'
import { merchantDashboardService } from '@/services/merchantDashboardService'
import type {
  DashboardBillStatus,
  DashboardRecentBill,
  DashboardVolumePoint,
} from '@/types/dashboard'
import { cn } from '@/lib/utils'

function CollectionVolumeChart({
  points,
}: {
  points: DashboardVolumePoint[]
}) {
  const width = 560
  const height = 220
  const padX = 16
  const padY = 20
  const data = points.length > 0 ? points : [{ key: 'empty', label: '—', value: 0 }]
  const max = Math.max(...data.map((p) => p.value), 1)
  const step = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0

  const coords = data.map((point, index) => {
    const x = padX + index * step
    const y = height - padY - (point.value / max) * (height - padY * 2)
    return { x, y, ...point }
  })

  const line = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ')
  const area = `${line} L ${coords.at(-1)!.x.toFixed(1)} ${height - padY} L ${coords[0]!.x.toFixed(1)} ${height - padY} Z`

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full"
        role="img"
        aria-label="Collection volume chart"
      >
        <defs>
          <linearGradient id="merchantCollectionFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4B1D6E" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#4B1D6E" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={width - padX}
            y1={padY + t * (height - padY * 2)}
            y2={padY + t * (height - padY * 2)}
            stroke="#e8dff2"
            strokeDasharray="4 6"
          />
        ))}
        <path d={area} fill="url(#merchantCollectionFill)" />
        <path
          d={line}
          fill="none"
          stroke="#4B1D6E"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((p) => (
          <circle
            key={p.key}
            cx={p.x}
            cy={p.y}
            r="3.5"
            fill="#C9A227"
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[11px] text-muted-foreground">
        {data
          .filter((_, i) => i % 2 === 0 || i === data.length - 1)
          .map((p) => (
            <span key={p.key}>{p.label}</span>
          ))}
      </div>
    </div>
  )
}

function BillStatusDonut({ slices }: { slices: DashboardBillStatus[] }) {
  const total = slices.reduce((sum, item) => sum + item.count, 0) || 1
  const radius = 54
  const stroke = 18
  const circumference = 2 * Math.PI * radius
  let offset = 0
  const hasData = slices.some((s) => s.count > 0)

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
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

      <ul className="w-full space-y-3 sm:w-auto">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center gap-3 text-sm">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-28 text-muted-foreground">{slice.label}</span>
            <span className="font-semibold text-foreground">{slice.percent}%</span>
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
                    <CircleDollarSign className="size-5" />
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
                <CollectionVolumeChart points={collectionVolume} />
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
