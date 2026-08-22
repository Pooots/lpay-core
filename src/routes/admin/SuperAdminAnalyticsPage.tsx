import { useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Building2,
  Download,
  FileText,
  LoaderCircle,
  Percent,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { superAdminAnalyticsService } from '@/services/superAdminAnalyticsService'
import { cn } from '@/lib/utils'

const PRIMARY = '#4B1D6E'
const PRIMARY_SOFT = '#8B5AA8'
const GOLD = '#C9A227'

export default function SuperAdminAnalyticsPage() {
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const analyticsQuery = useQuery({
    queryKey: ['super-admin-analytics'],
    queryFn: () => superAdminAnalyticsService.get(),
  })

  const summary = analyticsQuery.data?.summary
  const monthly = useMemo(
    () => analyticsQuery.data?.monthly ?? [],
    [analyticsQuery.data],
  )
  const paymentMethods = useMemo(
    () => analyticsQuery.data?.payment_methods ?? [],
    [analyticsQuery.data],
  )
  const billStatuses = useMemo(
    () => analyticsQuery.data?.bill_statuses ?? [],
    [analyticsQuery.data],
  )
  const topMerchants = useMemo(
    () => analyticsQuery.data?.top_merchants ?? [],
    [analyticsQuery.data],
  )

  const handleExport = async () => {
    setExportError('')
    setExporting(true)
    try {
      await superAdminAnalyticsService.exportReport()
    } catch {
      setExportError('Unable to export report. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <SuperAdminShell>
      <div className="home-rise space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Analytics
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Platform-wide billing performance across all merchants
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting || analyticsQuery.isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:opacity-60"
          >
            {exporting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Export Report
          </button>
        </div>

        {exportError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {exportError}
          </div>
        ) : null}

        {analyticsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white py-20 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading analytics…
          </div>
        ) : analyticsQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
            Unable to load analytics. Please refresh and try again.
          </div>
        ) : (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard
                label="Merchants"
                value={`${summary?.active_merchant_count ?? 0} / ${summary?.merchant_count ?? 0}`}
                hint="Active / total"
                icon={Building2}
                tone="purple"
              />
              <MetricCard
                label="Total Billed"
                value={summary?.total_billed_label ?? '₱0.00'}
                icon={FileText}
                tone="blue"
              />
              <MetricCard
                label="Total Collected"
                value={summary?.total_collected_label ?? '₱0.00'}
                icon={Wallet}
                tone="green"
              />
              <MetricCard
                label="Collection Rate"
                value={summary?.collection_rate_label ?? '0.0%'}
                icon={Percent}
                tone="purple"
              />
              <MetricCard
                label="Avg. Bill Value"
                value={summary?.avg_bill_value_label ?? '₱0.00'}
                icon={TrendingUp}
                tone="gold"
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <ChartCard
                title="Billed vs Collected"
                subtitle="Monthly comparison for the last 6 months"
              >
                {monthly.every((m) => m.billed === 0 && m.collected === 0) ? (
                  <EmptyChart text="No billing activity in the last 6 months." />
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthly} barGap={6}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e8dff2" />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#6b5a7a', fontSize: 12 }}
                          axisLine={{ stroke: '#e8dff2' }}
                        />
                        <YAxis
                          tick={{ fill: '#6b5a7a', fontSize: 12 }}
                          axisLine={{ stroke: '#e8dff2' }}
                          tickFormatter={(v) =>
                            `₱${Number(v).toLocaleString('en-PH')}`
                          }
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            `₱${Number(value).toLocaleString('en-PH', {
                              minimumFractionDigits: 2,
                            })}`,
                            name === 'billed' ? 'Billed' : 'Collected',
                          ]}
                          contentStyle={{
                            borderRadius: 12,
                            borderColor: '#e8dff2',
                          }}
                        />
                        <Bar
                          dataKey="billed"
                          name="billed"
                          fill={PRIMARY_SOFT}
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          dataKey="collected"
                          name="collected"
                          fill={PRIMARY}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Payment Methods"
                subtitle="Share of collected amount by method"
              >
                {paymentMethods.length === 0 ? (
                  <EmptyChart text="No payments recorded yet." />
                ) : (
                  <div className="flex h-72 flex-col">
                    <div className="min-h-0 flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentMethods}
                            dataKey="amount"
                            nameKey="method_label"
                            cx="50%"
                            cy="45%"
                            innerRadius={55}
                            outerRadius={90}
                            paddingAngle={2}
                          >
                            {paymentMethods.map((entry) => (
                              <Cell key={entry.method} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: number, _name, item) => [
                              `₱${Number(value).toLocaleString('en-PH', {
                                minimumFractionDigits: 2,
                              })} (${item?.payload?.percent ?? 0}%)`,
                              item?.payload?.method_label ?? 'Method',
                            ]}
                            contentStyle={{
                              borderRadius: 12,
                              borderColor: '#e8dff2',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3 pb-1">
                      {paymentMethods.map((method) => (
                        <div
                          key={method.method}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <span
                            className="size-2.5 rounded-full"
                            style={{ backgroundColor: method.color }}
                          />
                          <span className="capitalize">
                            {method.method_label} ({method.percent}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ChartCard>
            </section>

            <ChartCard
              title="Bill Status Distribution"
              subtitle="Count of bills by current status across all merchants"
            >
              {billStatuses.length === 0 ? (
                <EmptyChart text="No bills generated yet." />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={billStatuses}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8dff2" />
                      <XAxis
                        dataKey="status_label"
                        tick={{ fill: '#6b5a7a', fontSize: 12 }}
                        axisLine={{ stroke: '#e8dff2' }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: '#6b5a7a', fontSize: 12 }}
                        axisLine={{ stroke: '#e8dff2' }}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value} bill${value === 1 ? '' : 's'}`,
                          'Count',
                        ]}
                        contentStyle={{
                          borderRadius: 12,
                          borderColor: '#e8dff2',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke={PRIMARY}
                        strokeWidth={3}
                        dot={{
                          r: 5,
                          fill: GOLD,
                          stroke: PRIMARY,
                          strokeWidth: 2,
                        }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </ChartCard>

            <ChartCard
              title="Top Merchants"
              subtitle="Highest collections across the platform"
            >
              {topMerchants.length === 0 ? (
                <EmptyChart text="No merchant billing activity yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="pb-3 pr-3 font-semibold">Merchant</th>
                        <th className="pb-3 pr-3 font-semibold">Billed</th>
                        <th className="pb-3 pr-3 font-semibold">Collected</th>
                        <th className="pb-3 pr-3 font-semibold">Bills</th>
                        <th className="pb-3 font-semibold">Payments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topMerchants.map((merchant) => (
                        <tr
                          key={merchant.uuid}
                          className="border-b border-border/70 last:border-0"
                        >
                          <td className="py-3 pr-3">
                            <p className="font-semibold text-foreground">
                              {merchant.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {merchant.code}
                            </p>
                          </td>
                          <td className="py-3 pr-3 font-medium text-foreground">
                            {merchant.billed_label}
                          </td>
                          <td className="py-3 pr-3 font-medium text-foreground">
                            {merchant.collected_label}
                          </td>
                          <td className="py-3 pr-3 text-muted-foreground">
                            {merchant.bill_count}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {merchant.payment_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ChartCard>
          </>
        )}
      </div>
    </SuperAdminShell>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string
  value: string
  hint?: string
  icon: typeof FileText
  tone: 'blue' | 'green' | 'purple' | 'gold'
}) {
  const toneClass = {
    blue: 'bg-sky-50 text-sky-700',
    green: 'bg-emerald-50 text-emerald-700',
    purple: 'bg-secondary text-primary',
    gold: 'bg-[#f7f1da] text-[#8a7018]',
  }[tone]

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.3)]">
      <div
        className={cn(
          'mb-3 flex size-10 items-center justify-center rounded-xl',
          toneClass,
        )}
      >
        <Icon className="size-5" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-[#fcfaff] px-4 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
