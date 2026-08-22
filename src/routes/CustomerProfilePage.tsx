import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  Hash,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Receipt,
  UserRound,
} from 'lucide-react'
import { portalService } from '@/services/portalService'
import type { PortalBill, PortalPayment } from '@/types/portal'
import { cn } from '@/lib/utils'

type Tab = 'pending' | 'history'

function billStatusClass(status: string, isOverdue?: boolean) {
  if (isOverdue || status === 'overdue') {
    return 'bg-rose-50 text-rose-700'
  }
  if (status === 'paid') {
    return 'bg-emerald-50 text-emerald-700'
  }
  if (status === 'partial') {
    return 'bg-amber-50 text-amber-800'
  }
  return 'bg-secondary text-primary'
}

function BillCard({
  bill,
  showPay,
  onPay,
}: {
  bill: PortalBill
  showPay?: boolean
  onPay?: (bill: PortalBill) => void
}) {
  return (
    <article className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.35)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-wide text-gold-foreground">
            {bill.bill_number}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {bill.title}
          </h3>
          {bill.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{bill.description}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">{bill.balance_label}</p>
          <p className="text-xs text-muted-foreground">
            Balance · Total {bill.amount_label}
          </p>
          <span
            className={cn(
              'mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
              billStatusClass(bill.status, bill.is_overdue),
            )}
          >
            {bill.is_overdue
              ? 'Overdue'
              : bill.status === 'partial'
                ? 'Partial'
                : bill.status}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Due on
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {bill.due_on_label || '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Coverage
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {bill.coverage_label || '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Paid so far
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {bill.amount_paid_label}
          </dd>
        </div>
      </dl>

      {showPay && bill.is_payable ? (
        <div className="mt-4 flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={() => onPay?.(bill)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_20px_-12px_rgb(75_29_110_/_0.7)] transition hover:bg-[#3f1860]"
          >
            <CreditCard className="size-4 text-gold" />
            Pay Now
          </button>
        </div>
      ) : null}
    </article>
  )
}

function PaymentHistoryCard({ payment }: { payment: PortalPayment }) {
  const methodLabel =
    payment.payment_method === 'account_credit'
      ? 'Account credit'
      : payment.payment_method.replace(/_/g, ' ')

  return (
    <article className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.35)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-semibold tracking-wide text-gold-foreground">
            {payment.reference_number}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {payment.bill_title || 'Bill payment'}
          </h3>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {payment.bill_number}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-700">
            {payment.amount_label}
          </p>
          <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
            {payment.status}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Paid on
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {payment.paid_label || '—'}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Method
          </dt>
          <dd className="mt-1 font-medium capitalize text-foreground">
            {methodLabel}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Applied to bill
          </dt>
          <dd className="mt-1 font-medium text-foreground">
            {payment.applied_to_bill_label}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Still to pay after
          </dt>
          <dd className="mt-1 font-semibold text-primary">
            {payment.balance_after_label || '₱0.00'}
          </dd>
        </div>
      </dl>

      {payment.balance_after !== null && payment.balance_after > 0 ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Partial payment recorded. Remaining bill balance:{' '}
          {payment.balance_after_label}.
        </p>
      ) : null}

      {payment.credit_added > 0 ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Excess {payment.credit_added_label} saved as account credit for the
          next bill.
        </p>
      ) : null}

      {payment.payment_method === 'account_credit' ? (
        <p className="mt-3 rounded-xl border border-primary/20 bg-secondary px-3 py-2 text-xs text-primary">
          Applied from account credit to this bill.
        </p>
      ) : null}
    </article>
  )
}

export default function CustomerProfilePage() {
  const navigate = useNavigate()
  const search = useSearch({ from: '/account' }) as {
    account?: string
    paid?: string
  }
  const accountNumber = (search.account ?? '').trim()
  const queryClient = useQueryClient()
  const paidReference = (search.paid ?? '').trim()
  const [tab, setTab] = useState<Tab>(paidReference ? 'history' : 'pending')
  const [successMessage, setSuccessMessage] = useState('')

  const profileQuery = useQuery({
    queryKey: ['customer-portal', accountNumber],
    queryFn: () => portalService.lookup(accountNumber),
    enabled: Boolean(accountNumber),
    retry: false,
    staleTime: paidReference ? 0 : undefined,
    refetchOnMount: paidReference ? 'always' : true,
  })

  useEffect(() => {
    if (!paidReference || !accountNumber) return

    setSuccessMessage(`Payment successful. Reference: ${paidReference}`)
    setTab('history')

    void queryClient.invalidateQueries({
      queryKey: ['customer-portal', accountNumber],
    })
  }, [paidReference, accountNumber, queryClient])

  const profile = profileQuery.data
  const errorMessage = useMemo(() => {
    if (!accountNumber) {
      return 'Enter an account number from the home page to view your profile.'
    }
    if (!profileQuery.isError) return null
    if (axios.isAxiosError(profileQuery.error)) {
      return (
        (profileQuery.error.response?.data?.message as string | undefined) ??
        'Unable to load this account.'
      )
    }
    return 'Unable to load this account.'
  }, [accountNumber, profileQuery.error, profileQuery.isError])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fcfaff]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgb(75 29 110 / 0.06), transparent 55%), radial-gradient(ellipse 40% 35% at 85% 70%, rgb(201 162 39 / 0.07), transparent 50%)',
        }}
      />

      <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-8 sm:px-6 sm:pt-10">
        <header className="home-rise mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="shrink-0">
              <img
                src="/lpay-logo.png"
                alt="LPay"
                className="h-auto max-h-12 w-auto object-contain"
              />
            </Link>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-primary">
                CUSTOMER PORTAL
              </p>
              <p className="text-sm text-muted-foreground">
                View your profile, pending bills, and payment history
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: '/' })}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back to home
          </button>
        </header>

        {!accountNumber ? (
          <section className="home-rise rounded-3xl border border-border bg-white p-8 text-center shadow-[0_20px_50px_-28px_rgb(75_29_110_/_0.3)]">
            <UserRound className="mx-auto size-10 text-primary/40" />
            <h1 className="mt-3 text-xl font-bold text-foreground">
              No account number provided
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
            <Link
              to="/"
              className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
            >
              Go to Access My Account
            </Link>
          </section>
        ) : profileQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading customer profile…
          </div>
        ) : profileQuery.isError || !profile ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
            <h1 className="text-xl font-bold text-rose-800">Account not found</h1>
            <p className="mt-2 text-sm text-rose-700">{errorMessage}</p>
            <Link
              to="/"
              className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
            >
              Try another account number
            </Link>
          </section>
        ) : (
          <div className="home-rise space-y-6">
            <section className="overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_50px_-28px_rgb(75_29_110_/_0.3)]">
              <div className="border-b border-border bg-gradient-to-r from-[#4B1D6E] to-[#6b3a8f] px-5 py-6 text-white sm:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                      Customer profile
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                      {profile.customer.full_name}
                    </h1>
                    <p className="mt-2 inline-flex items-center gap-2 font-mono text-sm font-semibold text-[#f3e6b0]">
                      <Hash className="size-3.5" />
                      {profile.customer.account_number}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
                      Billed by
                    </p>
                    <p className="mt-1 font-semibold">{profile.merchant.name}</p>
                    {profile.merchant.code ? (
                      <p className="mt-0.5 font-mono text-xs text-white/80">
                        {profile.merchant.code}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-5">
                <InfoItem
                  icon={Mail}
                  label="Email"
                  value={profile.customer.email || '—'}
                />
                <InfoItem
                  icon={Phone}
                  label="Phone"
                  value={profile.customer.phone || '—'}
                />
                <InfoItem
                  icon={MapPin}
                  label="Address"
                  value={profile.customer.address || '—'}
                />
                <InfoItem
                  icon={CalendarDays}
                  label="Registered"
                  value={profile.customer.registered_label || '—'}
                />
                <InfoItem
                  icon={CreditCard}
                  label="Account credit"
                  value={profile.customer.credit_balance_label}
                />
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <SummaryCard
                label="Pending amount"
                value={profile.summary.pending_total_label}
                hint={`${profile.summary.pending_count} bill${profile.summary.pending_count === 1 ? '' : 's'}`}
                accent
              />
              <SummaryCard
                label="Paid total"
                value={profile.summary.paid_total_label}
                hint={`${profile.summary.paid_count} payment${profile.summary.paid_count === 1 ? '' : 's'}`}
              />
              <SummaryCard
                label="All bills"
                value={String(profile.summary.total_bills)}
                hint="Pending + history"
              />
            </section>

            <section className="rounded-3xl border border-border bg-white p-5 shadow-[0_12px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Bills & transactions
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Review pending dues and your payment history
                  </p>
                </div>
                <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
                  <button
                    type="button"
                    onClick={() => setTab('pending')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition',
                      tab === 'pending'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Clock3 className="size-3.5" />
                    Pending ({profile.summary.pending_count})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('history')}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition',
                      tab === 'history'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Receipt className="size-3.5" />
                    History ({profile.summary.paid_count})
                  </button>
                </div>
              </div>

              {successMessage ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {successMessage}
                </div>
              ) : null}

              <div className="mt-5 space-y-3">
                {tab === 'pending' ? (
                  profile.pending_bills.length === 0 ? (
                    <EmptyState
                      icon={FileText}
                      title="No pending bills"
                      description="You’re all caught up. New bills will appear here when issued."
                    />
                  ) : (
                    profile.pending_bills.map((bill) => (
                      <BillCard
                        key={bill.uuid}
                        bill={bill}
                        showPay
                        onPay={(selected) => {
                          void navigate({
                            to: '/checkout',
                            search: {
                              account: accountNumber,
                              bill: selected.uuid,
                            },
                          })
                        }}
                      />
                    ))
                  )
                ) : profile.history.length === 0 ? (
                  <EmptyState
                    icon={Receipt}
                    title="No payment history yet"
                    description="Each payment will appear here with its own reference number."
                  />
                ) : (
                  profile.history.map((payment) => (
                    <PaymentHistoryCard key={payment.uuid} payment={payment} />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white/90 px-5 py-4 text-sm text-muted-foreground sm:px-6">
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <p>
                  For billing questions, contact{' '}
                  <span className="font-semibold text-foreground">
                    {profile.merchant.name}
                  </span>
                  {profile.merchant.email || profile.merchant.phone
                    ? ` at ${[profile.merchant.email, profile.merchant.phone].filter(Boolean).join(' · ')}`
                    : ''}
                  .
                </p>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-muted/30 px-3.5 py-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5 text-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-1.5 break-words text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string
  value: string
  hint: string
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border p-4 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.3)]',
        accent
          ? 'border-primary/20 bg-secondary'
          : 'border-border bg-white',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-4 py-12 text-center">
      <Icon className="mx-auto size-9 text-primary/35" />
      <p className="mt-3 font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
