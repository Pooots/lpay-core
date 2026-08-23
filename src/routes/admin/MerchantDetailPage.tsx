import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ChevronDown,
  KeyRound,
  LoaderCircle,
} from 'lucide-react'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { MerchantCodeQr } from '@/components/admin/MerchantCodeQr'
import { BankDetailsPanel } from '@/components/admin/BankDetailsPanel'
import { MerchantLogoUploader } from '@/components/admin/MerchantLogoUploader'
import { merchantService } from '@/services/merchantService'
import { platformSettingsService } from '@/services/platformSettingsService'
import type { MerchantBank } from '@/types/settings'
import type {
  CommissionType,
  Merchant,
  MerchantPayout,
  MerchantStatus,
  MerchantTransaction,
  SettlementFrequency,
} from '@/types/merchant'
import { cn } from '@/lib/utils'

type Tab = 'profile' | 'transaction' | 'accounting' | 'settings' | 'plan'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'profile', label: 'Profile' },
  { id: 'transaction', label: 'Transaction' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'settings', label: 'Settings' },
  { id: 'plan', label: 'Plan' },
]

function statusBadge(status: Merchant['status']) {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700'
    case 'pending':
      return 'bg-sky-50 text-sky-700'
    case 'suspended':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-secondary text-primary'
  }
}

function statusLabel(status: Merchant['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1)
}

export default function MerchantDetailPage() {
  const params = useParams({ strict: false }) as { uuid?: string }
  const uuid = (params.uuid ?? '').trim()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<Tab>('profile')
  const [expandedTx, setExpandedTx] = useState<string | null>(null)
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null)

  const detailQuery = useQuery({
    queryKey: ['admin-merchant', uuid],
    queryFn: () => merchantService.get(uuid),
    enabled: Boolean(uuid),
  })

  const detail = detailQuery.data
  const merchant = detail?.merchant

  const payoutActionMutation = useMutation({
    mutationFn: async ({
      payoutUuid,
      action,
    }: {
      payoutUuid: string
      action: 'approve' | 'release'
    }) => {
      if (action === 'approve') {
        await merchantService.approvePayout(uuid, payoutUuid)
      } else {
        await merchantService.releasePayout(uuid, payoutUuid)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-merchant', uuid] })
      await queryClient.invalidateQueries({ queryKey: ['admin-payouts'] })
    },
  })

  return (
    <SuperAdminShell>
      <div className="home-rise space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              to="/admin/super/merchants"
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <ArrowLeft className="size-4" />
              Back to merchants
            </Link>
            {merchant ? (
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                  <Building2 className="size-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                      {merchant.name}
                    </h1>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                        statusBadge(merchant.status),
                      )}
                    >
                      {statusLabel(merchant.status)}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs font-semibold tracking-wide text-gold-foreground">
                    {merchant.code}
                  </p>
                </div>
              </div>
            ) : (
              <h1 className="text-2xl font-bold text-foreground">Merchant</h1>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-border bg-white p-1.5 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.3)]">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-semibold transition',
                tab === item.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-primary',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {detailQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white py-16 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading merchant…
          </div>
        ) : detailQuery.isError || !detail || !merchant ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
            Unable to load this merchant. It may have been removed.
          </div>
        ) : tab === 'profile' ? (
          <ProfileTab merchant={merchant} stats={detail.stats} />
        ) : tab === 'transaction' ? (
          <TransactionTab
            transactions={detail.transactions}
            expanded={expandedTx}
            onToggle={(id) =>
              setExpandedTx((current) => (current === id ? null : id))
            }
          />
        ) : tab === 'accounting' ? (
          <AccountingTab
            accounting={detail.accounting}
            expanded={expandedPayout}
            onToggle={(id) =>
              setExpandedPayout((current) => (current === id ? null : id))
            }
            actionBusy={
              payoutActionMutation.isPending
                ? payoutActionMutation.variables ?? null
                : null
            }
            onApprove={(payoutUuid) =>
              payoutActionMutation.mutate({ payoutUuid, action: 'approve' })
            }
            onRelease={(payoutUuid) =>
              payoutActionMutation.mutate({ payoutUuid, action: 'release' })
            }
          />
        ) : tab === 'plan' ? (
          <MerchantPlanTab
            merchant={merchant}
            onSaved={async () => {
              await queryClient.invalidateQueries({
                queryKey: ['admin-merchant', uuid],
              })
              await queryClient.invalidateQueries({
                queryKey: ['admin-merchants'],
              })
            }}
          />
        ) : (
          <SettingsTab
            merchant={merchant}
            banks={detail.banks ?? []}
            onSaved={async () => {
              await queryClient.invalidateQueries({
                queryKey: ['admin-merchant', uuid],
              })
              await queryClient.invalidateQueries({
                queryKey: ['admin-merchants'],
              })
            }}
          />
        )}
      </div>
    </SuperAdminShell>
  )
}

function ProfileTab({
  merchant,
  stats,
}: {
  merchant: Merchant
  stats: {
    customers: number
    bills: number
    payments: number
    total_collected_label: string
  }
}) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const passwordMutation = useMutation({
    mutationFn: () =>
      merchantService.update(merchant.uuid, {
        password,
      }),
    onSuccess: () => {
      setPassword('')
      setConfirmPassword('')
      setError('')
      setSuccess('Merchant password updated successfully.')
    },
    onError: (err) => {
      setSuccess('')
      if (axios.isAxiosError(err)) {
        const message = err.response?.data?.message
        if (typeof message === 'string' && message.trim()) {
          setError(message)
          return
        }
      }
      setError('Unable to update password. Please try again.')
    },
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          <h2 className="text-lg font-bold text-foreground">Merchant profile</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Contact and account details
          </p>

          <dl className="mt-5 space-y-4 text-sm">
            <DetailRow label="Merchant name" value={merchant.name} />
            <DetailRow label="Merchant code" value={merchant.code} mono />
            <DetailRow label="Role" value={merchant.role} />
            <DetailRow label="Status" value={statusLabel(merchant.status)} />
            <DetailRow label="Email" value={merchant.email} />
            <DetailRow label="Phone" value={merchant.phone || '—'} />
            <DetailRow label="Address" value={merchant.address || '—'} />
            <DetailRow label="Joined" value={merchant.joined_label || '—'} />
          </dl>
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
              <KeyRound className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground">
                Update password
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set a new login password for this merchant account
                ({merchant.email}).
              </p>
            </div>
          </div>

          <form
            className="mt-5 max-w-md space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              setError('')
              setSuccess('')

              const next = password.trim()
              if (next.length < 8) {
                setError('Password must be at least 8 characters.')
                return
              }
              if (next !== confirmPassword.trim()) {
                setError('Password confirmation does not match.')
                return
              }

              passwordMutation.mutate()
            }}
          >
            <Field label="New password">
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Confirm password">
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>

            {error ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={passwordMutation.isPending || !password.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:opacity-60"
            >
              {passwordMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <KeyRound className="size-4 text-gold" />
              )}
              Update password
            </button>
          </form>
        </section>
      </div>

      <div className="space-y-4">
        <StatCard label="Customers" value={String(stats.customers)} />
        <StatCard label="Bills" value={String(stats.bills)} />
        <StatCard label="Payments" value={String(stats.payments)} />
        <StatCard label="Total collected" value={stats.total_collected_label} />
      </div>
    </div>
  )
}

function TransactionTab({
  transactions,
  expanded,
  onToggle,
}: {
  transactions: MerchantTransaction[]
  expanded: string | null
  onToggle: (id: string) => void
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
      <h2 className="text-lg font-bold text-foreground">Transactions</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        All customer payments collected by this merchant
      </p>

      {transactions.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-[#fcfaff] px-4 py-10 text-center">
          <p className="font-medium text-foreground">No transactions yet</p>
        </div>
      ) : (
        <div className="mt-5 space-y-2">
          {transactions.map((tx) => (
            <div
              key={tx.uuid}
              className="overflow-hidden rounded-xl border border-border"
            >
              <button
                type="button"
                onClick={() => onToggle(tx.uuid)}
                className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition hover:bg-secondary/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {tx.customer_name || 'Customer'}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-gold-foreground">
                    {tx.reference_number}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground">
                    {tx.amount_label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {tx.paid_date_label || '—'}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    'size-4 shrink-0 text-muted-foreground transition',
                    expanded === tx.uuid && 'rotate-180',
                  )}
                />
              </button>
              {expanded === tx.uuid ? (
                <div className="border-t border-border bg-[#fcfaff] px-3.5 py-3">
                  <dl className="grid gap-2 text-sm sm:grid-cols-2">
                    <MiniDetail label="Account" value={tx.account_number} mono />
                    <MiniDetail label="Method" value={tx.payment_method_label} />
                    <MiniDetail label="Bill" value={tx.bill_title || '—'} />
                    <MiniDetail label="Bill No." value={tx.bill_number} mono />
                    <MiniDetail label="Settlement" value={tx.settlement_status} />
                    <MiniDetail label="Paid on" value={tx.paid_label || '—'} />
                  </dl>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function AccountingTab({
  accounting,
  expanded,
  onToggle,
  actionBusy,
  onApprove,
  onRelease,
}: {
  accounting: {
    summary: {
      available_label: string
      available_count: number
      pending_label: string
      pending_count: number
      clearing_count?: number
      request_count?: number
      paid_out_label: string
      paid_out_count: number
    }
    settlement_frequency_label?: string
    settlement_frequency_description?: string
    available_transactions: MerchantTransaction[]
    pending_transactions?: MerchantTransaction[]
    pending_payouts: MerchantPayout[]
  }
  expanded: string | null
  onToggle: (id: string) => void
  actionBusy: { payoutUuid: string; action: 'approve' | 'release' } | null
  onApprove: (payoutUuid: string) => void
  onRelease: (payoutUuid: string) => void
}) {
  const { summary } = accounting
  const pendingTransactions = accounting.pending_transactions ?? []

  return (
    <div className="space-y-6">
      {accounting.settlement_frequency_label ? (
        <div className="rounded-2xl border border-primary/20 bg-secondary px-4 py-3 text-sm text-foreground">
          <span className="font-semibold">
            Frequency: {accounting.settlement_frequency_label}
          </span>
          {accounting.settlement_frequency_description ? (
            <span className="mt-1 block text-muted-foreground">
              {accounting.settlement_frequency_description}
            </span>
          ) : null}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Available"
          value={summary.available_label}
          hint={`${summary.available_count} ready to request`}
          accent
        />
        <StatCard
          label="Pending"
          value={summary.pending_label}
          hint={`${summary.clearing_count ?? pendingTransactions.length} clearing · ${summary.request_count ?? accounting.pending_payouts.length} requests`}
        />
        <StatCard
          label="Released"
          value={summary.paid_out_label}
          hint={`${summary.paid_out_count} completed`}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-foreground">
            Available transactions
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cleared by frequency — merchant can request payout
          </p>
          {accounting.available_transactions.length === 0 ? (
            <EmptyBlock text="No available balance" />
          ) : (
            <div className="mt-4 space-y-2">
              {accounting.available_transactions.map((tx) => (
                <div
                  key={tx.uuid}
                  className="rounded-xl border border-border px-3.5 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {tx.customer_name || 'Customer'}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-gold-foreground">
                        {tx.reference_number}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-foreground">
                      {tx.amount_label}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold text-foreground">Pending</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Frequency clearance and payout requests — approve then release
          </p>
          {pendingTransactions.length === 0 &&
          accounting.pending_payouts.length === 0 ? (
            <EmptyBlock text="No pending items" />
          ) : (
            <div className="mt-4 space-y-2">
              {pendingTransactions.map((tx) => (
                <div
                  key={tx.uuid}
                  className="rounded-xl border border-border px-3.5 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {tx.customer_name || 'Customer'}
                      </p>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-gold-foreground">
                        {tx.reference_number}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Available on {tx.available_label || '—'}
                      </p>
                    </div>
                    <p className="shrink-0 font-semibold text-foreground">
                      {tx.amount_label}
                    </p>
                  </div>
                </div>
              ))}
              {accounting.pending_payouts.map((payout) => (
                <div
                  key={payout.uuid}
                  className="overflow-hidden rounded-xl border border-border"
                >
                  <button
                    type="button"
                    onClick={() => onToggle(payout.uuid)}
                    className="flex w-full items-center gap-3 px-3.5 py-3 text-left hover:bg-secondary/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        Payout · {payout.payment_count} transaction
                        {payout.payment_count === 1 ? '' : 's'}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-gold-foreground">
                        {payout.reference_number}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {payout.status_label}
                      </p>
                    </div>
                    <p className="font-semibold text-foreground">
                      {payout.amount_label}
                    </p>
                    <ChevronDown
                      className={cn(
                        'size-4 text-muted-foreground transition',
                        expanded === payout.uuid && 'rotate-180',
                      )}
                    />
                  </button>
                  {expanded === payout.uuid ? (
                    <div className="space-y-3 border-t border-border bg-[#fcfaff] px-3.5 py-3">
                      <p className="text-xs text-muted-foreground">
                        Requested {payout.requested_label || '—'}
                      </p>
                      {payout.transactions.map((tx) => (
                        <div
                          key={tx.uuid}
                          className="flex justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2 text-sm"
                        >
                          <span className="truncate">
                            {tx.customer_name || tx.reference_number}
                          </span>
                          <span className="font-semibold">
                            {tx.amount_label}
                          </span>
                        </div>
                      ))}
                      {payout.status === 'request_payout' ? (
                        <button
                          type="button"
                          disabled={
                            actionBusy?.payoutUuid === payout.uuid &&
                            actionBusy.action === 'approve'
                          }
                          onClick={() => onApprove(payout.uuid)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
                        >
                          {actionBusy?.payoutUuid === payout.uuid &&
                          actionBusy.action === 'approve' ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Approve
                        </button>
                      ) : null}
                      {payout.status === 'approved' ? (
                        <button
                          type="button"
                          disabled={
                            actionBusy?.payoutUuid === payout.uuid &&
                            actionBusy.action === 'release'
                          }
                          onClick={() => onRelease(payout.uuid)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
                        >
                          {actionBusy?.payoutUuid === payout.uuid &&
                          actionBusy.action === 'release' ? (
                            <LoaderCircle className="size-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                          Release
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function SettingsTab({
  merchant,
  banks,
  onSaved,
}: {
  merchant: Merchant
  banks: MerchantBank[]
  onSaved: () => Promise<void>
}) {
  const [settingsTab, setSettingsTab] = useState<
    'profile' | 'accounting' | 'banks' | 'commission'
  >('profile')
  const [name, setName] = useState(merchant.name)
  const [email, setEmail] = useState(merchant.email)
  const [phone, setPhone] = useState(merchant.phone ?? '')
  const [address, setAddress] = useState(merchant.address ?? '')
  const [status, setStatus] = useState<MerchantStatus>(merchant.status)
  const [password, setPassword] = useState('')
  const [frequency, setFrequency] = useState<SettlementFrequency>(
    merchant.settlement_frequency ?? 'bi_monthly',
  )
  const [commissionTax, setCommissionTax] = useState(
    String(merchant.commission_tax ?? 0),
  )
  const [commissionTaxType, setCommissionTaxType] = useState<CommissionType>(
    merchant.commission_tax_type ?? 'percentage',
  )
  const [commissionSystemFee, setCommissionSystemFee] = useState(
    String(merchant.commission_system_fee ?? 0),
  )
  const [commissionSystemFeeType, setCommissionSystemFeeType] =
    useState<CommissionType>(merchant.commission_system_fee_type ?? 'fixed')
  const [commissionOtherFee, setCommissionOtherFee] = useState(
    String(merchant.commission_other_fee ?? 0),
  )
  const [commissionOtherFeeType, setCommissionOtherFeeType] =
    useState<CommissionType>(merchant.commission_other_fee_type ?? 'fixed')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setName(merchant.name)
    setEmail(merchant.email)
    setPhone(merchant.phone ?? '')
    setAddress(merchant.address ?? '')
    setStatus(merchant.status)
    setFrequency(merchant.settlement_frequency ?? 'bi_monthly')
    setCommissionTax(String(merchant.commission_tax ?? 0))
    setCommissionTaxType(merchant.commission_tax_type ?? 'percentage')
    setCommissionSystemFee(String(merchant.commission_system_fee ?? 0))
    setCommissionSystemFeeType(merchant.commission_system_fee_type ?? 'fixed')
    setCommissionOtherFee(String(merchant.commission_other_fee ?? 0))
    setCommissionOtherFeeType(merchant.commission_other_fee_type ?? 'fixed')
    setPassword('')
  }, [merchant])

  const infoMutation = useMutation({
    mutationFn: () =>
      merchantService.update(merchant.uuid, {
        name,
        email,
        phone: phone || null,
        address: address || null,
        status,
        password: password || undefined,
      }),
    onSuccess: async () => {
      setError('')
      setSuccess('Merchant profile saved.')
      setPassword('')
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ||
          (err.response?.data?.errors
            ? Object.values(err.response.data.errors as Record<string, string[]>)
                .flat()
                .join(' ')
            : undefined)
        : null
      setError(message ?? 'Unable to save profile.')
    },
  })

  const frequencyMutation = useMutation({
    mutationFn: () =>
      merchantService.update(merchant.uuid, {
        settlement_frequency: frequency,
      }),
    onSuccess: async () => {
      setError('')
      setSuccess('Accounting frequency saved.')
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ||
          (err.response?.data?.errors
            ? Object.values(err.response.data.errors as Record<string, string[]>)
                .flat()
                .join(' ')
            : undefined)
        : null
      setError(message ?? 'Unable to save accounting settings.')
    },
  })

  const commissionMutation = useMutation({
    mutationFn: () =>
      merchantService.update(merchant.uuid, {
        commission_tax: Number(commissionTax) || 0,
        commission_tax_type: commissionTaxType,
        commission_system_fee: Number(commissionSystemFee) || 0,
        commission_system_fee_type: commissionSystemFeeType,
        commission_other_fee: Number(commissionOtherFee) || 0,
        commission_other_fee_type: commissionOtherFeeType,
      }),
    onSuccess: async () => {
      setError('')
      setSuccess('Platform commission saved.')
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ||
          (err.response?.data?.errors
            ? Object.values(err.response.data.errors as Record<string, string[]>)
                .flat()
                .join(' ')
            : undefined)
        : null
      setError(message ?? 'Unable to save platform commission.')
    },
  })

  const logoUploadMutation = useMutation({
    mutationFn: (file: File) => merchantService.uploadLogo(merchant.uuid, file),
    onSuccess: async () => {
      setError('')
      setSuccess('Logo uploaded successfully.')
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ||
          (err.response?.data?.errors
            ? Object.values(err.response.data.errors as Record<string, string[]>)
                .flat()
                .join(' ')
            : undefined)
        : null
      setError(message ?? 'Unable to upload logo.')
    },
  })

  const logoRemoveMutation = useMutation({
    mutationFn: () => merchantService.removeLogo(merchant.uuid),
    onSuccess: async () => {
      setError('')
      setSuccess('Logo removed.')
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined)
        : null
      setError(message ?? 'Unable to remove logo.')
    },
  })

  const frequencyOptions: Array<{
    value: SettlementFrequency
    label: string
    description: string
  }> = [
    {
      value: 'bi_monthly',
      label: 'Bi-monthly',
      description:
        'Today’s transactions move to Available after 15 days. (Default)',
    },
    {
      value: 'weekly',
      label: 'Weekly',
      description:
        'Today’s transactions move to Available on Thursday of the following week.',
    },
    {
      value: 't3',
      label: 'Today+3 (T+3)',
      description: 'Today’s transactions move to Available after 3 days.',
    },
  ]

  const settingsTabs: Array<{
    id: 'profile' | 'accounting' | 'banks' | 'commission'
    label: string
  }> = [
    { id: 'profile', label: 'Profile' },
    { id: 'accounting', label: 'Accounting Settings' },
    { id: 'banks', label: 'Bank Details' },
    { id: 'commission', label: 'Platforms Commission' },
  ]

  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
      <h2 className="text-lg font-bold text-foreground">Settings</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage merchant profile, settlement frequency, bank accounts, and
        platform commission
      </p>

      <div className="mt-5 flex flex-wrap gap-2 rounded-xl border border-border bg-[#fcfaff] p-1">
        {settingsTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setSettingsTab(item.id)
              setError('')
              setSuccess('')
            }}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition',
              settingsTab === item.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-white hover:text-primary',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      {settingsTab === 'profile' ? (
        <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto]">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSuccess('')
              infoMutation.mutate()
            }}
            className="max-w-xl space-y-4"
          >
            <MerchantLogoUploader
              logoUrl={merchant.logo_url}
              uploading={logoUploadMutation.isPending}
              removing={logoRemoveMutation.isPending}
              onUpload={async (file) => {
                setSuccess('')
                await logoUploadMutation.mutateAsync(file)
              }}
              onRemove={async () => {
                setSuccess('')
                await logoRemoveMutation.mutateAsync()
              }}
            />

            <Field label="Merchant name">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Phone">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Address">
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="mt-1.5 w-full resize-y rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MerchantStatus)}
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </Field>
            <Field label="New password (optional)">
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Leave blank to keep current"
              />
            </Field>

            <button
              type="submit"
              disabled={infoMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:opacity-60"
            >
              {infoMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : null}
              Save profile
            </button>
          </form>

          <div className="flex justify-center lg:justify-end">
            <MerchantCodeQr
              code={merchant.code}
              logoUrl={merchant.logo_url}
            />
          </div>
        </div>
      ) : null}

      {settingsTab === 'accounting' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSuccess('')
            frequencyMutation.mutate()
          }}
          className="mt-5 max-w-xl space-y-4"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">
              Settlement frequency
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              New payments stay in Pending until this schedule moves them to
              Available.
            </p>
          </div>

          <div className="space-y-3">
            {frequencyOptions.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-xl border p-4 transition',
                  frequency === option.value
                    ? 'border-primary bg-secondary'
                    : 'border-border bg-white hover:border-primary/40',
                )}
              >
                <input
                  type="radio"
                  name="settlement_frequency"
                  value={option.value}
                  checked={frequency === option.value}
                  onChange={() => setFrequency(option.value)}
                  className="mt-1 size-4 accent-[#4B1D6E]"
                />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={frequencyMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:opacity-60"
          >
            {frequencyMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            Save accounting settings
          </button>
        </form>
      ) : null}

      {settingsTab === 'banks' ? (
        <div className="mt-5">
          <BankDetailsPanel
            banks={banks}
            handlers={{
              onCreate: (payload) =>
                merchantService.createBank(merchant.uuid, payload),
              onUpdate: (bankUuid, payload) =>
                merchantService.updateBank(merchant.uuid, bankUuid, payload),
              onDelete: (bankUuid) =>
                merchantService.deleteBank(merchant.uuid, bankUuid),
              onChanged: onSaved,
            }}
          />
        </div>
      ) : null}

      {settingsTab === 'commission' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSuccess('')
            commissionMutation.mutate()
          }}
          className="mt-5 max-w-xl space-y-5"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">
              Platforms commission
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Per-merchant platform fees (tax, system, other). These apply to
              this merchant’s member payments and can be fixed ₱ or percentage.
            </p>
          </div>

          <div className="space-y-4">
            <FeeRow
              label="Tax"
              value={commissionTax}
              type={commissionTaxType}
              onValueChange={setCommissionTax}
              onTypeChange={setCommissionTaxType}
            />
            <FeeRow
              label="System fee"
              value={commissionSystemFee}
              type={commissionSystemFeeType}
              onValueChange={setCommissionSystemFee}
              onTypeChange={setCommissionSystemFeeType}
            />
            <FeeRow
              label="Other fee"
              value={commissionOtherFee}
              type={commissionOtherFeeType}
              onValueChange={setCommissionOtherFee}
              onTypeChange={setCommissionOtherFeeType}
            />
          </div>

          <div className="rounded-xl border border-primary/15 bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
            Example on a ₱1,000 payment:{' '}
            <span className="font-semibold text-primary">
              ₱
              {feeExampleTotal(
                Number(commissionTax) || 0,
                commissionTaxType,
                Number(commissionSystemFee) || 0,
                commissionSystemFeeType,
                Number(commissionOtherFee) || 0,
                commissionOtherFeeType,
                1000,
              ).toFixed(2)}
            </span>{' '}
            total platform fees
          </div>

          <button
            type="submit"
            disabled={commissionMutation.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:opacity-60"
          >
            {commissionMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            Save platform commission
          </button>
        </form>
      ) : null}
    </section>
  )
}

function MerchantPlanTab({
  merchant,
  onSaved,
}: {
  merchant: Merchant
  onSaved: () => Promise<void>
}) {
  const [planUuid, setPlanUuid] = useState(merchant.plan_uuid ?? '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setPlanUuid(merchant.plan_uuid ?? '')
  }, [merchant.plan_uuid])

  const plansQuery = useQuery({
    queryKey: ['platform-merchant-plans'],
    queryFn: () => platformSettingsService.listPlans(),
  })

  const planMutation = useMutation({
    mutationFn: () =>
      merchantService.update(merchant.uuid, {
        plan_uuid: planUuid || null,
      }),
    onSuccess: async () => {
      setError('')
      setSuccess('Merchant plan assigned successfully.')
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ||
          (err.response?.data?.errors
            ? Object.values(err.response.data.errors as Record<string, string[]>)
                .flat()
                .join(' ')
            : undefined)
        : null
      setError(message ?? 'Unable to assign merchant plan.')
    },
  })

  const selectedPlan = (plansQuery.data ?? []).find((p) => p.uuid === planUuid)

  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
      <div className="max-w-xl">
        <h2 className="text-lg font-bold text-foreground">Merchant plan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign a plan from Settings → Plan settings. Member capacity is
          enforced when this merchant adds members.
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        {success ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </div>
        ) : null}

        <div className="mt-5 rounded-xl border border-primary/15 bg-secondary/50 px-4 py-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current assignment
          </p>
          <p className="mt-1 font-semibold text-foreground">
            {merchant.plan_name || 'No plan assigned'}
          </p>
          <p className="mt-1 text-muted-foreground">
            {merchant.plan_member_range_label ||
              'Create plans in Super Admin Settings first.'}
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSuccess('')
            planMutation.mutate()
          }}
          className="mt-5 space-y-5"
        >
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Select plan
            </span>
            {plansQuery.isLoading ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin text-primary" />
                Loading plans…
              </div>
            ) : (
              <select
                value={planUuid}
                onChange={(e) => setPlanUuid(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">No plan</option>
                {(plansQuery.data ?? [])
                  .filter((plan) => plan.is_active || plan.uuid === planUuid)
                  .map((plan) => (
                    <option key={plan.uuid} value={plan.uuid}>
                      {plan.name} · {plan.member_range_label}
                      {plan.is_default ? ' (default)' : ''}
                    </option>
                  ))}
              </select>
            )}
          </label>

          {selectedPlan ? (
            <div className="rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Range:</span>{' '}
                {selectedPlan.member_range_label}
              </p>
              {selectedPlan.description ? (
                <p className="mt-1">{selectedPlan.description}</p>
              ) : null}
              <p className="mt-1">
                <span className="font-semibold text-foreground">Fee:</span>{' '}
                {selectedPlan.monthly_fee_label}
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={planMutation.isPending || plansQuery.isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:opacity-60"
          >
            {planMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            Assign plan
          </button>
        </form>
      </div>
    </section>
  )
}

function feeExampleTotal(
  tax: number,
  taxType: CommissionType,
  systemFee: number,
  systemType: CommissionType,
  otherFee: number,
  otherType: CommissionType,
  baseAmount: number,
) {
  const calc = (value: number, type: CommissionType) =>
    type === 'percentage' ? (baseAmount * value) / 100 : value

  return calc(tax, taxType) + calc(systemFee, systemType) + calc(otherFee, otherType)
}

function FeeRow({
  label,
  value,
  type,
  onValueChange,
  onTypeChange,
}: {
  label: string
  value: string
  type: CommissionType
  onValueChange: (value: string) => void
  onTypeChange: (type: CommissionType) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-[#fcfaff] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <div className="inline-flex rounded-xl border border-border bg-white p-1">
          <button
            type="button"
            onClick={() => onTypeChange('fixed')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              type === 'fixed'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-primary',
            )}
          >
            Fixed ₱
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('percentage')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              type === 'percentage'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-primary',
            )}
          >
            Percentage %
          </button>
        </div>
      </div>
      <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {type === 'fixed' ? `${label} amount (₱)` : `${label} rate (%)`}
      </label>
      <input
        required
        type="number"
        min={0}
        max={type === 'percentage' ? 100 : undefined}
        step="0.01"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.3)]',
        accent ? 'border-primary/20 bg-secondary' : 'border-border bg-white',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
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

function MiniDetail({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'mt-0.5 text-foreground',
          mono && 'font-mono text-xs text-gold-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-border bg-[#fcfaff] px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
