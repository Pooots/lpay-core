import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, LoaderCircle, Search, X } from 'lucide-react'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { adminAuditLogService } from '@/services/adminAuditLogService'
import type { AuditLog } from '@/types/auditLog'
import { cn } from '@/lib/utils'

function categoryClass(category: string) {
  switch (category) {
    case 'auth':
      return 'bg-sky-50 text-sky-700'
    case 'merchant':
      return 'bg-secondary text-primary'
    case 'bank':
      return 'bg-amber-50 text-amber-800'
    case 'payout':
      return 'bg-emerald-50 text-emerald-700'
    default:
      return 'bg-secondary text-muted-foreground'
  }
}

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [selected, setSelected] = useState<AuditLog | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const logsQuery = useQuery({
    queryKey: [
      'admin-audit-logs',
      debouncedSearch,
      categoryFilter,
      actionFilter,
    ],
    queryFn: () =>
      adminAuditLogService.list({
        q: debouncedSearch || undefined,
        category: categoryFilter || undefined,
        action: actionFilter || undefined,
      }),
  })

  const logs = useMemo(() => logsQuery.data?.data ?? [], [logsQuery.data])
  const summary = logsQuery.data?.summary
  const filterOptions = logsQuery.data?.filters

  return (
    <SuperAdminShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Track admin sign-ins, merchant changes, bank updates, and payout
            actions
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Total events"
            value={String(summary?.total ?? 0)}
            hint="All recorded actions"
          />
          <StatCard
            label="Today"
            value={String(summary?.today ?? 0)}
            hint="Events logged today"
          />
          <StatCard
            label="Auth"
            value={String(summary?.auth ?? 0)}
            hint="Login activity"
          />
          <StatCard
            label="Merchant / Bank"
            value={String((summary?.merchant ?? 0) + (summary?.bank ?? 0))}
            hint={`${summary?.merchant ?? 0} merchant · ${summary?.bank ?? 0} bank`}
          />
          <StatCard
            label="Payouts"
            value={String(summary?.payout ?? 0)}
            hint="Approvals & releases"
          />
        </section>

        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor, action, subject, IP..."
              className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">All categories</option>
            {(filterOptions?.categories ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 lg:min-w-[220px]"
          >
            <option value="">All actions</option>
            {(filterOptions?.actions ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          {logsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading audit logs…
            </div>
          ) : logsQuery.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              Unable to load audit logs.
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No audit events yet. Admin actions will appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">When</th>
                    <th className="pb-3 pr-4">Actor</th>
                    <th className="pb-3 pr-4">Action</th>
                    <th className="pb-3 pr-4">Subject</th>
                    <th className="pb-3 pr-4">Description</th>
                    <th className="pb-3 pr-4">IP</th>
                    <th className="pb-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.uuid}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        <p className="font-medium text-foreground">
                          {log.created_date_label || '—'}
                        </p>
                        <p className="mt-0.5 text-xs">
                          {log.created_time_label || '—'}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-foreground">
                          {log.actor_name || 'System'}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {log.actor_email || '—'}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                            categoryClass(log.category),
                          )}
                        >
                          {log.action_label}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-foreground">
                          {log.subject_label || '—'}
                        </p>
                        <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                          {log.subject_type || log.category_label}
                        </p>
                      </td>
                      <td className="max-w-[280px] py-3.5 pr-4 text-muted-foreground">
                        <p className="line-clamp-2">{log.description}</p>
                      </td>
                      <td className="py-3.5 pr-4 font-mono text-xs text-muted-foreground">
                        {log.ip_address || '—'}
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(log)}
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
        <DetailModal log={selected} onClose={() => setSelected(null)} />
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
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function DetailModal({
  log,
  onClose,
}: {
  log: AuditLog
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-white p-5 shadow-xl sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Audit event
            </p>
            <h2 className="mt-1 text-xl font-bold text-foreground">
              {log.action_label}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {log.created_label || '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border p-2 text-muted-foreground hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailField label="Category" value={log.category_label} />
          <DetailField label="Action" value={log.action} />
          <DetailField label="Actor" value={log.actor_name || 'System'} />
          <DetailField label="Actor email" value={log.actor_email || '—'} />
          <DetailField label="Subject" value={log.subject_label || '—'} />
          <DetailField
            label="Subject type"
            value={log.subject_type || '—'}
          />
          <DetailField label="IP address" value={log.ip_address || '—'} />
          <DetailField
            label="Subject ID"
            value={log.subject_uuid || '—'}
            mono
          />
        </div>

        <div className="mt-4">
          <DetailField label="Description" value={log.description} />
        </div>

        {log.user_agent ? (
          <div className="mt-4">
            <DetailField label="User agent" value={log.user_agent} />
          </div>
        ) : null}

        {log.meta && Object.keys(log.meta).length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Metadata
            </p>
            <pre className="overflow-x-auto rounded-2xl border border-border bg-[#fcfaff] p-4 text-xs text-foreground">
              {JSON.stringify(log.meta, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-[#fcfaff] px-3.5 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 break-words text-sm font-medium text-foreground',
          mono && 'font-mono text-xs',
        )}
      >
        {value}
      </p>
    </div>
  )
}
