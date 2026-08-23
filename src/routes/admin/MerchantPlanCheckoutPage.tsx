import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import { merchantAuthService } from '@/services/merchantAuthService'
import { merchantPlanService } from '@/services/merchantPlanService'
import { cn } from '@/lib/utils'

const COMMISSION_PAGE_SIZE = 10

export default function MerchantPlanCheckoutPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as {
    kind?: string
    plan?: string
  }
  const kind = (search.kind ?? 'renewal').trim()
  const planUuid = (search.plan ?? '').trim()

  const [error, setError] = useState('')
  const [commissionPage, setCommissionPage] = useState(1)

  const moduleQuery = useQuery({
    queryKey: ['merchant-plans'],
    queryFn: () => merchantPlanService.getModule(),
  })

  const billing = moduleQuery.data?.billing
  const current = moduleQuery.data?.current_plan
  const isPlanCheckout = kind === 'upgrade' || kind === 'activation'
  const isRenewal = !isPlanCheckout
  const upgradePlan = useMemo(
    () =>
      isPlanCheckout
        ? (moduleQuery.data?.plans ?? []).find((p) => p.uuid === planUuid) ??
          null
        : null,
    [isPlanCheckout, moduleQuery.data?.plans, planUuid],
  )

  const commissionItems = isRenewal
    ? (billing?.platform_commission_items ?? [])
    : []
  const commissionTotal = isRenewal
    ? (billing?.platform_commission ?? 0)
    : 0
  const commissionTotalPages = Math.max(
    1,
    Math.ceil(commissionItems.length / COMMISSION_PAGE_SIZE),
  )
  const pagedCommissionItems = useMemo(() => {
    const start = (commissionPage - 1) * COMMISSION_PAGE_SIZE
    return commissionItems.slice(start, start + COMMISSION_PAGE_SIZE)
  }, [commissionItems, commissionPage])

  useEffect(() => {
    setCommissionPage(1)
  }, [commissionItems.length])

  useEffect(() => {
    if (commissionPage > commissionTotalPages) {
      setCommissionPage(commissionTotalPages)
    }
  }, [commissionPage, commissionTotalPages])

  const planFeeLabel = isPlanCheckout
    ? (upgradePlan?.monthly_fee_label ?? '—')
    : (billing?.plan_fee_label ?? current?.monthly_fee_label ?? '—')

  const title =
    kind === 'activation'
      ? upgradePlan
        ? `Activate with ${upgradePlan.name}`
        : 'Activate plan'
      : kind === 'upgrade'
        ? upgradePlan
          ? `Upgrade to ${upgradePlan.name}`
          : 'Upgrade plan'
        : 'Pay next month billing'

  const amountLabel = isPlanCheckout
    ? (upgradePlan?.monthly_fee_label ?? '—')
    : (billing?.amount_label ?? '—')

  const periodLabel = isPlanCheckout
    ? kind === 'activation'
      ? 'Activation (current month)'
      : (billing?.next_period_label ?? 'Current cycle')
    : (billing?.next_period_label ?? '—')

  const planName = isPlanCheckout
    ? (upgradePlan?.name ?? '—')
    : (current?.name ?? '—')

  const canSubmit = isPlanCheckout
    ? Boolean(
        upgradePlan && (!upgradePlan.is_current || kind === 'activation'),
      )
    : Boolean(billing?.can_pay_next_month && current)

  const payMutation = useMutation({
    mutationFn: async () => {
      if (isPlanCheckout) {
        if (!planUuid) throw new Error('Missing plan.')
        return merchantPlanService.checkout(planUuid)
      }
      return merchantPlanService.renewNextMonth()
    },
    onSuccess: async (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url
        return
      }
      await merchantAuthService.me()
      void navigate({
        to: '/admin/plan',
        search: { payment: undefined, status: undefined },
        replace: true,
      })
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ||
          (err.response?.data?.errors
            ? Object.values(
                err.response.data.errors as Record<string, string[]>,
              )
                .flat()
                .join(' ')
            : undefined)
        : err instanceof Error
          ? err.message
          : null
      setError(
        message ??
          'Unable to start PayMongo checkout. Verify PAYMONGO_SECRET_KEY in the API .env.',
      )
    },
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!canSubmit) {
      setError(
        kind === 'activation'
          ? 'Select a plan to activate your account.'
          : kind === 'upgrade'
            ? 'Select a valid plan to upgrade.'
            : 'Next month is already paid or no plan is assigned.',
      )
      return
    }
    payMutation.mutate()
  }

  const commissionFrom = commissionItems.length
    ? (commissionPage - 1) * COMMISSION_PAGE_SIZE + 1
    : 0
  const commissionTo = Math.min(
    commissionPage * COMMISSION_PAGE_SIZE,
    commissionItems.length,
  )

  return (
    <MerchantShell>
      <div className="home-rise mx-auto max-w-3xl space-y-6" data-allow-pending>
        <div>
          <Link
            to="/admin/plan"
            search={{ payment: undefined, status: undefined }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-4" />
            Back to Plan
          </Link>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            {kind === 'activation'
              ? 'Pay for this plan to activate your merchant account and unlock plan modules after successful payment.'
              : 'Confirm your plan payment, then continue to PayMongo using the platform gateway.'}
          </p>
        </div>

        {moduleQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white py-16 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading checkout…
          </div>
        ) : moduleQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
            Unable to load plan checkout details.
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="space-y-5">
              {/* Section 1 — Next month billing */}
              <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-secondary to-white p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
                    <Sparkles className="size-5 text-gold" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
                      {kind === 'activation'
                        ? 'Plan activation'
                        : kind === 'upgrade'
                          ? 'Plan upgrade'
                          : 'Next month billing'}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-foreground">
                      {title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Secure checkout via platform PayMongo (
                      {billing?.gateway_label ?? 'super admin keys'}).
                    </p>
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-white/80 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Plan
                    </dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {planName}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-border bg-white/80 px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Billing period
                    </dt>
                    <dd className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
                      <CalendarDays className="size-4 text-primary" />
                      {periodLabel}
                    </dd>
                  </div>
                </dl>

                {isRenewal ? (
                  <div className="mt-4 rounded-xl border border-border bg-white/80 px-4 py-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Plan fee</span>
                      <span className="font-semibold text-foreground">
                        {planFeeLabel}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">
                        Platform commission (
                        {billing?.platform_commission_count ?? 0} transactions)
                      </span>
                      <span className="font-semibold text-foreground">
                        {billing?.platform_commission_label ?? '₱0.00'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Amount to pay
                      </span>
                      <span className="text-2xl font-bold text-foreground">
                        {amountLabel}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-border bg-white/80 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Amount to pay
                    </p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {amountLabel}
                    </p>
                  </div>
                )}
              </section>

              {/* Section 2 — Pay / Cancel */}
              <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p>
                    {kind === 'activation'
                      ? 'After PayMongo confirms payment, your selected plan is applied and your merchant status becomes active so you can start using the included modules.'
                      : isRenewal && commissionTotal > 0
                        ? `You will pay the plan fee plus ₱${commissionTotal.toFixed(2)} platform commission from ${commissionItems.length} transaction(s) via PayMongo.`
                        : 'You will be redirected to PayMongo’s secure page. Choose your payment method there. Payment is collected with the platform PayMongo gateway configured by super admin.'}
                  </p>
                </div>

                {error ? (
                  <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    to="/admin/plan"
                    search={{ payment: undefined, status: undefined }}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={payMutation.isPending || !canSubmit}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {payMutation.isPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <CreditCard className="size-4 text-gold" />
                    )}
                    {payMutation.isPending
                      ? 'Opening PayMongo…'
                      : `Pay ${amountLabel} with PayMongo`}
                  </button>
                </div>
              </section>
            </form>

            {/* Section 3 — Platform commission listing */}
            {isRenewal ? (
              <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  Platform commission / transaction
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fees from member transactions not yet billed. These are added
                  to this plan payment.
                </p>

                {commissionItems.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No unsettled platform commission for this cycle.
                  </p>
                ) : (
                  <>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            <th className="pb-2 pr-3">Transaction</th>
                            <th className="pb-2 pr-3">Member</th>
                            <th className="pb-2 pr-3 text-right">Paid</th>
                            <th className="pb-2 text-right">Commission</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pagedCommissionItems.map((row) => (
                            <tr
                              key={row.uuid}
                              className="border-b border-border/60 last:border-0"
                            >
                              <td className="py-2.5 pr-3">
                                <p className="font-medium text-foreground">
                                  {row.reference_number}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {row.paid_label || '—'}
                                </p>
                                {row.bill_number ? (
                                  <p className="text-xs text-muted-foreground">
                                    Bill {row.bill_number}
                                  </p>
                                ) : null}
                              </td>
                              <td className="py-2.5 pr-3 text-muted-foreground">
                                {row.member_name || row.account_number || '—'}
                              </td>
                              <td className="py-2.5 pr-3 text-right text-muted-foreground">
                                {row.transaction_amount_label}
                              </td>
                              <td className="py-2.5 text-right font-semibold text-foreground">
                                {row.platform_fees_total_label}
                                <p className="text-[11px] font-normal text-muted-foreground">
                                  Tax {row.platform_tax_label} · Sys{' '}
                                  {row.platform_system_fee_label} · Other{' '}
                                  {row.platform_other_fee_label}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td
                              colSpan={3}
                              className="pt-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                              Commission total
                            </td>
                            <td className="pt-3 text-right font-bold text-foreground">
                              {billing?.platform_commission_label ?? '₱0.00'}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {commissionFrom}–{commissionTo} of{' '}
                        {commissionItems.length}
                      </p>
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          disabled={commissionPage <= 1}
                          onClick={() =>
                            setCommissionPage((page) => Math.max(1, page - 1))
                          }
                          className={cn(
                            'inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition',
                            commissionPage <= 1
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:bg-muted',
                          )}
                        >
                          <ChevronLeft className="size-4" />
                          Prev
                        </button>
                        <span className="min-w-[5.5rem] text-center text-sm font-medium text-foreground">
                          Page {commissionPage} / {commissionTotalPages}
                        </span>
                        <button
                          type="button"
                          disabled={commissionPage >= commissionTotalPages}
                          onClick={() =>
                            setCommissionPage((page) =>
                              Math.min(commissionTotalPages, page + 1),
                            )
                          }
                          className={cn(
                            'inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold transition',
                            commissionPage >= commissionTotalPages
                              ? 'cursor-not-allowed opacity-50'
                              : 'hover:bg-muted',
                          )}
                        >
                          Next
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </section>
            ) : null}
          </>
        )}
      </div>
    </MerchantShell>
  )
}
