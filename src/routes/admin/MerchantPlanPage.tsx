import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import axios from 'axios'
import {
  Check,
  CreditCard,
  LoaderCircle,
  Sparkles,
  ArrowUpRight,
  CalendarDays,
} from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import { useDialog } from '@/components/ui/AppDialog'
import { PLAN_FEATURE_LABELS } from '@/lib/merchantPlan'
import { merchantAuthService } from '@/services/merchantAuthService'
import {
  merchantPlanService,
  type MerchantPlanCatalogItem,
} from '@/services/merchantPlanService'
import { cn } from '@/lib/utils'

function statusClass(status: string) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-50 text-emerald-700'
    case 'pending':
      return 'bg-sky-50 text-sky-700'
    case 'failed':
    case 'cancelled':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-secondary text-primary'
  }
}

function PlanFeatureList({ features }: { features: string[] }) {
  if (features.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No modules enabled on this plan.
      </p>
    )
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {features.map((feature) => (
        <li
          key={feature}
          className="flex items-center gap-2 text-sm text-foreground"
        >
          <Check className="size-3.5 shrink-0 text-primary" />
          {PLAN_FEATURE_LABELS[feature] ?? feature}
        </li>
      ))}
    </ul>
  )
}

function PlanCard({
  plan,
  busy,
  onSelect,
}: {
  plan: MerchantPlanCatalogItem
  busy: boolean
  onSelect: (plan: MerchantPlanCatalogItem) => void
}) {
  return (
    <article
      className={cn(
        'flex flex-col rounded-2xl border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]',
        plan.is_current
          ? 'border-primary ring-2 ring-primary/15'
          : 'border-border',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary/70">
            {plan.code}
          </p>
          <h3 className="mt-1 text-lg font-bold text-foreground">{plan.name}</h3>
        </div>
        {plan.is_current ? (
          <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
            Current
          </span>
        ) : plan.is_upgrade ? (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Upgrade
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-2xl font-bold text-foreground">
        {plan.monthly_fee_label}
        <span className="ml-1 text-sm font-medium text-muted-foreground">
          /mo
        </span>
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {plan.member_range_label}
      </p>
      {plan.description ? (
        <p className="mt-3 text-sm text-muted-foreground">{plan.description}</p>
      ) : null}

      <div className="mt-4 flex-1 border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Included modules
        </p>
        <PlanFeatureList features={plan.features} />
      </div>

      <button
        type="button"
        disabled={(plan.is_current && plan.action_label === 'Current plan') || busy}
        onClick={() => onSelect(plan)}
        className={cn(
          'mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
          plan.is_current && plan.action_label === 'Current plan'
            ? 'border border-border bg-muted text-muted-foreground'
            : 'bg-primary text-primary-foreground hover:bg-[#3f1860]',
        )}
      >
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : plan.is_upgrade ? (
          <ArrowUpRight className="size-4 text-gold" />
        ) : null}
        {plan.action_label}
      </button>
    </article>
  )
}

export default function MerchantPlanPage() {
  const dialog = useDialog()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = useSearch({ strict: false }) as {
    payment?: string
    status?: string
  }
  const [banner, setBanner] = useState('')
  const [error, setError] = useState('')
  const [checkoutPlanUuid, setCheckoutPlanUuid] = useState<string | null>(null)

  const moduleQuery = useQuery({
    queryKey: ['merchant-plans'],
    queryFn: () => merchantPlanService.getModule(),
  })

  useEffect(() => {
    const paymentUuid = (search.payment ?? '').trim()
    const status = (search.status ?? '').trim()
    if (!paymentUuid || paymentUuid === 'PENDING') return

    let cancelled = false

    void (async () => {
      try {
        if (status === 'cancel') {
          await merchantPlanService.cancel(paymentUuid)
          if (!cancelled) {
            setBanner('Plan checkout was cancelled.')
          }
        } else {
          const result = await merchantPlanService.complete(paymentUuid)
          if (!cancelled) {
            setBanner(result.message ?? 'Plan payment confirmed.')
            await merchantAuthService.me()
            await queryClient.invalidateQueries({ queryKey: ['merchant-me'] })
            await queryClient.invalidateQueries({ queryKey: ['merchant-plans'] })
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message = axios.isAxiosError(err)
            ? (err.response?.data?.message as string | undefined)
            : null
          setError(message ?? 'Unable to confirm plan payment.')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [search.payment, search.status, queryClient])

  const checkoutMutation = useMutation({
    mutationFn: (planUuid: string) => merchantPlanService.checkout(planUuid),
    onMutate: (planUuid) => {
      setCheckoutPlanUuid(planUuid)
      setError('')
      setBanner('')
    },
    onSuccess: async (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url
        return
      }

      setBanner(
        data.merchant?.status === 'active'
          ? 'Plan updated. Your account is now active.'
          : 'Plan updated successfully.',
      )
      await merchantAuthService.me()
      await queryClient.invalidateQueries({ queryKey: ['merchant-me'] })
      await queryClient.invalidateQueries({ queryKey: ['merchant-plans'] })
      setCheckoutPlanUuid(null)
    },
    onError: (err) => {
      setCheckoutPlanUuid(null)
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ||
          (err.response?.data?.errors
            ? Object.values(
                err.response.data.errors as Record<string, string[]>,
              )
                .flat()
                .join(' ')
            : undefined)
        : null
      setError(message ?? 'Unable to start plan checkout.')
    },
  })

  const renewMutation = useMutation({
    mutationFn: () => merchantPlanService.renewNextMonth(),
    onMutate: () => {
      setError('')
      setBanner('')
    },
    onSuccess: async (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url
        return
      }

      setBanner('Next month billing recorded successfully.')
      await merchantAuthService.me()
      await queryClient.invalidateQueries({ queryKey: ['merchant-me'] })
      await queryClient.invalidateQueries({ queryKey: ['merchant-plans'] })
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
        : null
      setError(message ?? 'Unable to start next month billing.')
    },
  })

  const current = moduleQuery.data?.current_plan ?? null
  const plans = useMemo(
    () => moduleQuery.data?.plans ?? [],
    [moduleQuery.data],
  )
  const payments = moduleQuery.data?.payments ?? []
  const billing = moduleQuery.data?.billing

  const handleSelect = async (plan: MerchantPlanCatalogItem) => {
    const isPending =
      (merchantAuthService.getMerchant()?.status ?? '').toLowerCase() ===
      'pending'

    if (plan.monthly_fee <= 0) {
      const ok = await dialog.confirm({
        title: isPending ? 'Activate free plan' : 'Activate free plan',
        message: isPending
          ? `Activate “${plan.name}” at no charge and open your merchant account?`
          : `Activate “${plan.name}” at no charge?`,
        confirmLabel: 'Activate',
        cancelLabel: 'Cancel',
      })
      if (ok) checkoutMutation.mutate(plan.uuid)
      return
    }

    void navigate({
      to: '/admin/plan/checkout',
      search: {
        kind: isPending ? 'activation' : 'upgrade',
        plan: plan.uuid,
      },
    })
  }

  const handlePayNextMonth = async () => {
    if (!billing || !current) return
    if (billing.is_free) {
      const ok = await dialog.confirm({
        title: 'Confirm next month',
        message: `Record ${billing.next_period_label} billing for “${current.name}” (free plan)?`,
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
      })
      if (ok) renewMutation.mutate()
      return
    }

    void navigate({
      to: '/admin/plan/checkout',
      search: { kind: 'renewal', plan: undefined },
    })
  }

  return (
    <MerchantShell>
      <div className="home-rise space-y-6" data-allow-pending>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Plan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            View your current plan, pay next month’s billing, and upgrade
            options.
          </p>
        </div>

        {banner ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {banner}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {moduleQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white py-16 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading plans…
          </div>
        ) : moduleQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
            Unable to load plan details. Please refresh and try again.
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-secondary to-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
                    <Sparkles className="size-5 text-gold" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
                      Current plan
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
                      {current?.name ?? 'No plan assigned'}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {current?.member_range_label ??
                        'Choose a plan below and pay to activate your modules.'}
                    </p>
                  </div>
                </div>
                {current ? (
                  <div className="flex flex-col gap-3 sm:items-end">
                    <div className="rounded-2xl border border-border bg-white px-4 py-3 text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Monthly fee
                      </p>
                      <p className="mt-1 text-xl font-bold text-foreground">
                        {current.monthly_fee_label}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border bg-white px-4 py-3 text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Plan ends on
                      </p>
                      <p className="mt-1 text-base font-bold text-foreground">
                        {current.expires_at_label ||
                          billing?.expires_at_label ||
                          current.expires_on_label ||
                          billing?.expires_on_label ||
                          current.paid_through_label ||
                          billing?.paid_through_label ||
                          'Not set'}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {current?.description ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {current.description}
                </p>
              ) : null}

              {current ? (
                <div className="mt-5 rounded-xl border border-border bg-white/80 p-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Included modules
                  </p>
                  {!current.features_enforced ? (
                    <p className="text-sm text-muted-foreground">
                      Module limits are not enforced on this plan assignment.
                      All merchant modules are available.
                    </p>
                  ) : (
                    <PlanFeatureList features={current.features} />
                  )}
                </div>
              ) : null}
            </section>

            {current && billing ? (
              <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                      <CalendarDays className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Next month billing
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Pay {billing.next_period_label} for your current plan
                        through the platform PayMongo gateway.
                      </p>
                      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Billing period
                          </dt>
                          <dd className="mt-0.5 font-semibold text-foreground">
                            {billing.next_period_label}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Amount due
                          </dt>
                          <dd className="mt-0.5 font-semibold text-foreground">
                            {billing.amount_label}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Plan expiration date
                          </dt>
                          <dd className="mt-0.5 font-semibold text-foreground">
                            {billing.expires_at_label ||
                              billing.expires_on_label ||
                              billing.paid_through_label ||
                              'Not paid yet'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Payment gateway
                          </dt>
                          <dd className="mt-0.5 text-foreground">
                            {billing.gateway_label}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={
                      !billing.can_pay_next_month || renewMutation.isPending
                    }
                    onClick={() => void handlePayNextMonth()}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {renewMutation.isPending ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <CreditCard className="size-4 text-gold" />
                    )}
                    {billing.can_pay_next_month
                      ? billing.is_free
                        ? 'Confirm next month'
                        : 'Proceed to checkout'
                      : 'Next month already paid'}
                  </button>
                </div>
                <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
                  <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" />
                  {billing.note}
                </p>
              </section>
            ) : null}

            <section>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Available plans
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upgrade or switch plans. Paid plans redirect to platform
                  PayMongo checkout.
                </p>
              </div>

              {plans.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-10 text-center text-sm text-muted-foreground">
                  No active plans are available yet.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.uuid}
                      plan={plan}
                      busy={
                        checkoutMutation.isPending &&
                        checkoutPlanUuid === plan.uuid
                      }
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
              <h2 className="text-lg font-bold text-foreground">
                Plan payments
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upgrades and monthly billing charges for this merchant account.
              </p>

              {payments.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-border bg-[#fcfaff] px-4 py-10 text-center text-sm text-muted-foreground">
                  No plan payments yet.
                </div>
              ) : (
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[940px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="pb-3 pr-4">Reference</th>
                        <th className="pb-3 pr-4">Type</th>
                        <th className="pb-3 pr-4">Period</th>
                        <th className="pb-3 pr-4">Plan</th>
                        <th className="pb-3 pr-4">Amount</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 pr-4">Paid</th>
                        <th className="pb-3">Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((row) => (
                        <tr
                          key={row.uuid}
                          className="border-b border-border/70 last:border-0"
                        >
                          <td className="py-3.5 pr-4 font-mono text-xs font-semibold text-gold-foreground">
                            {row.reference_number}
                          </td>
                          <td className="py-3.5 pr-4 text-foreground">
                            {row.kind_label || row.kind || 'Plan change'}
                          </td>
                          <td className="py-3.5 pr-4 text-muted-foreground">
                            {row.billing_period_label || '—'}
                          </td>
                          <td className="py-3.5 pr-4">
                            <p className="font-medium text-foreground">
                              {row.to_plan_name || '—'}
                            </p>
                            {row.from_plan_name &&
                            row.from_plan_name !== row.to_plan_name ? (
                              <p className="text-xs text-muted-foreground">
                                from {row.from_plan_name}
                              </p>
                            ) : null}
                          </td>
                          <td className="py-3.5 pr-4 font-semibold text-foreground">
                            {row.amount_label}
                          </td>
                          <td className="py-3.5 pr-4">
                            <span
                              className={cn(
                                'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                                statusClass(row.status),
                              )}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4 text-muted-foreground">
                            {row.paid_label || row.created_label || '—'}
                          </td>
                          <td className="py-3.5 font-medium text-foreground">
                            {row.expires_at_label || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </MerchantShell>
  )
}
