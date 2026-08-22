import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Eye, LoaderCircle, Search, X } from 'lucide-react'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { adminMemberService } from '@/services/adminMemberService'
import type { AdminMember, AdminMemberDetail } from '@/types/adminMember'
import { cn } from '@/lib/utils'

function statusClass(status: string) {
  switch (status) {
    case 'active':
    case 'completed':
      return 'bg-emerald-50 text-emerald-700'
    case 'pending':
      return 'bg-amber-50 text-amber-800'
    case 'suspended':
    case 'inactive':
    case 'failed':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-secondary text-primary'
  }
}

export default function AdminMembersPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const membersQuery = useQuery({
    queryKey: ['admin-members', debouncedSearch],
    queryFn: () =>
      adminMemberService.list({
        q: debouncedSearch || undefined,
      }),
  })

  const detailQuery = useQuery({
    queryKey: ['admin-member', selectedUuid],
    queryFn: () => adminMemberService.get(selectedUuid!),
    enabled: Boolean(selectedUuid),
  })

  const members = useMemo(
    () => membersQuery.data?.data ?? [],
    [membersQuery.data],
  )
  const summary = membersQuery.data?.summary
  const detail = detailQuery.data ?? null

  return (
    <SuperAdminShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Members
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            All members across every merchant
          </p>
        </div>

        <section className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Total members"
            value={String(summary?.total ?? 0)}
            hint="Registered across all merchants"
          />
          <StatCard
            label="Active"
            value={String(summary?.active ?? 0)}
            hint="Active member accounts"
          />
          <StatCard
            label="Merchants"
            value={String(summary?.merchants ?? 0)}
            hint="Merchants with members"
          />
        </section>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, account #, email, phone, merchant..."
            className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          {membersQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading members…
            </div>
          ) : membersQuery.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              Unable to load members.
            </div>
          ) : members.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No members found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Member</th>
                    <th className="pb-3 pr-4">Account</th>
                    <th className="pb-3 pr-4">Merchant</th>
                    <th className="pb-3 pr-4">Contact</th>
                    <th className="pb-3 pr-4">Bills</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Joined</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <MemberRow
                      key={member.uuid}
                      member={member}
                      onView={() => setSelectedUuid(member.uuid)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {selectedUuid ? (
        <MemberDetailModal
          detail={detail}
          loading={detailQuery.isLoading}
          error={detailQuery.isError}
          onClose={() => setSelectedUuid(null)}
        />
      ) : null}
    </SuperAdminShell>
  )
}

function MemberRow({
  member,
  onView,
}: {
  member: AdminMember
  onView: () => void
}) {
  return (
    <tr className="border-b border-border/70 last:border-0">
      <td className="py-3.5 pr-4">
        <p className="font-medium text-foreground">{member.full_name || '—'}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {member.email || 'No email'}
        </p>
      </td>
      <td className="py-3.5 pr-4">
        <span className="font-mono text-xs font-semibold text-gold-foreground">
          {member.account_number}
        </span>
      </td>
      <td className="py-3.5 pr-4">
        <p className="font-medium text-foreground">
          {member.merchant_name || '—'}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
          {member.merchant_code || '—'}
        </p>
      </td>
      <td className="py-3.5 pr-4 text-muted-foreground">
        {member.phone || '—'}
      </td>
      <td className="py-3.5 pr-4 font-semibold text-foreground">
        {member.bill_count}
      </td>
      <td className="py-3.5 pr-4">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
            statusClass(member.status),
          )}
        >
          {member.status}
        </span>
      </td>
      <td className="py-3.5 pr-4 text-muted-foreground">
        {member.registered_label || '—'}
      </td>
      <td className="py-3.5 text-right">
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-secondary"
        >
          <Eye className="size-3.5" />
          View
        </button>
      </td>
    </tr>
  )
}

function MemberDetailModal({
  detail,
  loading,
  error,
  onClose,
}: {
  detail: AdminMemberDetail | null
  loading: boolean
  error: boolean
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)] sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">Member details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Profile and payment history
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading member…
          </div>
        ) : error || !detail ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
            Unable to load member details.
          </div>
        ) : (
          <div className="space-y-5">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Name" value={detail.full_name || '—'} />
              <Detail label="Account" value={detail.account_number} />
              <Detail label="Merchant" value={detail.merchant_name || '—'} />
              <Detail label="Merchant code" value={detail.merchant_code || '—'} />
              <Detail label="Email" value={detail.email || '—'} />
              <Detail label="Phone" value={detail.phone || '—'} />
              <Detail label="Status" value={
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                    statusClass(detail.status),
                  )}
                >
                  {detail.status}
                </span>
              } />
              <Detail label="Joined" value={detail.registered_label || '—'} />
              <Detail
                label="Credit balance"
                value={detail.credit_balance_label}
              />
              <Detail
                label="Payments total"
                value={detail.summary.payment_total_label}
              />
              {detail.address_label || detail.address ? (
                <div className="sm:col-span-2">
                  <Detail
                    label="Address"
                    value={detail.address_label || detail.address || '—'}
                  />
                </div>
              ) : null}
            </dl>

            <div>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-foreground">Payments</h3>
                <p className="text-xs text-muted-foreground">
                  {detail.summary.completed_count} completed ·{' '}
                  {detail.summary.payment_count} total
                </p>
              </div>

              {detail.payments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No payments recorded for this member yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="px-3 py-2.5">Paid on</th>
                        <th className="px-3 py-2.5">Reference</th>
                        <th className="px-3 py-2.5">Bill</th>
                        <th className="px-3 py-2.5">Amount</th>
                        <th className="px-3 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.payments.map((payment) => (
                        <tr
                          key={payment.uuid}
                          className="border-b border-border/70 last:border-0"
                        >
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {payment.paid_label || '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-xs font-semibold text-gold-foreground">
                              {payment.reference_number}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-mono text-xs">
                              {payment.bill_number || '—'}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {payment.bill_title || '—'}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 font-semibold">
                            {payment.amount_label}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                                statusClass(payment.status),
                              )}
                            >
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
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
    <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.3)]">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  )
}
