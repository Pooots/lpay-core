import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { Clock3, Sparkles } from 'lucide-react'
import { merchantAuthService } from '@/services/merchantAuthService'
import type { MerchantPlanSummary } from '@/lib/merchantPlan'
import { cn } from '@/lib/utils'

export const PENDING_ONBOARDING_MESSAGE =
  'Your merchant account is pending activation. Pay for a plan under Plan to activate, or wait for a super admin to activate your account. You can browse modules, but transactions stay disabled until then.'

type MerchantAccessValue = {
  status: string | null
  isPendingOnboarding: boolean
  canTransact: boolean
}

const MerchantAccessContext = createContext<MerchantAccessValue>({
  status: null,
  isPendingOnboarding: false,
  canTransact: true,
})

export function MerchantAccessProvider({
  status,
  children,
}: {
  status: string | null | undefined
  children: ReactNode
}) {
  const value = useMemo<MerchantAccessValue>(() => {
    const normalized = (status ?? merchantAuthService.getMerchant()?.status ?? '')
      .trim()
      .toLowerCase()
    const isPendingOnboarding = normalized === 'pending'
    return {
      status: normalized || null,
      isPendingOnboarding,
      canTransact: !isPendingOnboarding && normalized !== 'suspended',
    }
  }, [status])

  return (
    <MerchantAccessContext.Provider value={value}>
      {children}
    </MerchantAccessContext.Provider>
  )
}

export function useMerchantAccess() {
  return useContext(MerchantAccessContext)
}

export function PendingOnboardingBanner({ className }: { className?: string }) {
  const { isPendingOnboarding } = useMerchantAccess()

  if (!isPendingOnboarding) return null

  return (
    <div
      className={cn(
        'flex gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900',
        className,
      )}
      role="status"
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700">
        <Clock3 className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">Pending Onboarding</p>
        <p className="mt-0.5 text-sky-800/90">{PENDING_ONBOARDING_MESSAGE}</p>
        <Link
          to="/admin/plan"
          search={{ payment: undefined, status: undefined }}
          className="mt-2 inline-flex text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          Go to Plan to activate →
        </Link>
      </div>
    </div>
  )
}

export function PlanExpiryReminderBanner({
  plan,
  className,
}: {
  plan: MerchantPlanSummary | null | undefined
  className?: string
}) {
  const { isPendingOnboarding } = useMerchantAccess()

  if (isPendingOnboarding || !plan) return null

  if (plan.is_expired) {
    return (
      <div
        className={cn(
          'flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900',
          className,
        )}
        role="status"
      >
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-rose-100 text-rose-700">
          <Sparkles className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">Plan coverage expired</p>
          <p className="mt-0.5 text-rose-800/90">
            Your plan paid through{' '}
            {plan.paid_through_label ?? 'the previous period'}. Pay next month’s
            billing to keep your account active.
          </p>
          <Link
            to="/admin/plan"
            search={{ payment: undefined, status: undefined }}
            className="mt-2 inline-flex text-sm font-semibold text-primary underline-offset-2 hover:underline"
          >
            Pay plan billing →
          </Link>
        </div>
      </div>
    )
  }

  if (!plan.reminder_due) return null

  const days = plan.days_until_expiry ?? 0

  return (
    <div
      className={cn(
        'flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950',
        className,
      )}
      role="status"
    >
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
        <Clock3 className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="font-semibold">Plan payment reminder</p>
          <p className="mt-0.5 text-amber-900/90">
            Your plan coverage ends on{' '}
            {plan.expires_at_label || plan.paid_through_label || plan.expires_on_label}
            {days === 0
              ? ' (today)'
              : days === 1
                ? ' (tomorrow)'
                : ` (in ${days} days)`}
            . Pay next month’s billing before it expires.
          </p>
        <Link
          to="/admin/plan"
          search={{ payment: undefined, status: undefined }}
          className="mt-2 inline-flex text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          Pay next month billing →
        </Link>
      </div>
    </div>
  )
}
