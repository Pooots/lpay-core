import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Bell,
  BookOpen,
  CreditCard,
  FilePlus2,
  HandCoins,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import {
  MerchantAccessProvider,
  PendingOnboardingBanner,
  PlanExpiryReminderBanner,
} from '@/components/admin/MerchantAccess'
import { MerchantWriteGate } from '@/components/admin/MerchantWriteGate'
import {
  merchantCanAccessPath,
  type MerchantPlanSummary,
} from '@/lib/merchantPlan'
import { merchantAuthService } from '@/services/merchantAuthService'
import { cn } from '@/lib/utils'

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>

export const merchantNavigation: Array<{
  label: string
  path: string
  icon: Icon
}> = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Member', path: '/admin/member', icon: Users },
  { label: 'Generate Bills', path: '/admin/generate-bills', icon: FilePlus2 },
  { label: 'Tracker', path: '/admin/tracker', icon: LayoutGrid },
  { label: 'Payments', path: '/admin/payments', icon: CreditCard },
  { label: 'Manual Payment', path: '/admin/manual-payments', icon: HandCoins },
  { label: 'Accounting', path: '/admin/accounting', icon: BookOpen },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Plan', path: '/admin/plan', icon: Sparkles },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
]

function initials(name?: string | null, email?: string | null) {
  const source = (name || email || 'M').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

function CurrentPlanBadge({ plan }: { plan: MerchantPlanSummary | null }) {
  if (!plan) {
    return (
      <Link
        to="/admin/plan"
        search={{ payment: undefined, status: undefined }}
        className="flex min-w-0 items-center gap-2 rounded-xl border border-dashed border-border bg-white px-3 py-1.5 transition hover:border-primary/40 hover:bg-secondary/40"
      >
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Sparkles className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Current plan
          </p>
          <p className="truncate text-sm font-semibold text-foreground">
            Not assigned
          </p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      to="/admin/plan"
      search={{ payment: undefined, status: undefined }}
      className="flex min-w-0 items-center gap-2.5 rounded-xl border border-primary/20 bg-gradient-to-r from-secondary to-white px-3 py-1.5 shadow-[0_8px_20px_-16px_rgb(75_29_110_/_0.55)] transition hover:border-primary/40"
    >
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="size-3.5 text-gold" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/70">
          Current plan
        </p>
        <p className="truncate text-sm font-bold text-foreground">{plan.name}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {plan.member_range_label}
          {plan.monthly_fee > 0 ? ` · ${plan.monthly_fee_label}/mo` : null}
        </p>
      </div>
    </Link>
  )
}

function MerchantSidebar({
  isOpen,
  onClose,
  merchantStatus,
  plan,
}: {
  isOpen: boolean
  onClose: () => void
  merchantStatus: string | null
  plan: MerchantPlanSummary | null
}) {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const user = merchantAuthService.getUser()
  const merchant = merchantAuthService.getMerchant()
  const isPending =
    (merchantStatus ?? merchant?.status ?? '').toLowerCase() === 'pending'

  const visibleNav = useMemo(
    () =>
      merchantNavigation.filter((item) => merchantCanAccessPath(plan, item.path)),
    [plan],
  )

  const handleLogout = () => {
    merchantAuthService.logout()
    void navigate({ to: '/admin/login', replace: true })
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-[#2a1a3d]/25 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-border bg-white transition-transform duration-200 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-5">
          <Link to="/admin/dashboard" className="block" onClick={onClose}>
            <img
              src="/lpay-logo.png"
              alt="LPay"
              className="h-11 w-auto object-contain"
            />
            <p className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-primary/70">
              CONNECT. BILL. PAY.
            </p>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-muted-foreground lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">
          {visibleNav.map(({ label, path, icon: Icon }) => {
            const active =
              pathname === path || pathname.startsWith(`${path}/`)
            return (
              <Link
                key={path}
                to={path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active
                    ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_rgb(75_29_110_/_0.7)]'
                    : 'text-muted-foreground hover:bg-secondary hover:text-primary',
                )}
              >
                <Icon
                  className={cn('size-4', active ? 'text-gold' : '')}
                  strokeWidth={2}
                />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-muted/60 px-3 py-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials(merchant?.name || user?.name, user?.email)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {merchant?.name || user?.name || 'Merchant'}
              </p>
              <p className="text-xs text-muted-foreground">
                {merchant?.code || 'Merchant'}
              </p>
              {isPending ? (
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                  Pending
                </p>
              ) : null}
              {plan ? (
                <p className="mt-0.5 truncate text-[10px] font-medium text-primary/80">
                  {plan.name}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-primary"
          >
            <LogOut className="size-4 text-gold" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}

export function MerchantShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = merchantAuthService.getUser()
  const merchant = merchantAuthService.getMerchant()
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  const meQuery = useQuery({
    queryKey: ['merchant-me'],
    queryFn: () => merchantAuthService.me(),
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })

  const liveMerchant = meQuery.data?.merchant ?? merchant
  const liveStatus = liveMerchant?.status ?? null
  const livePlan = liveMerchant?.plan ?? null

  useEffect(() => {
    if (meQuery.data?.merchant?.status === 'suspended') {
      merchantAuthService.logout()
      window.location.href = '/admin/login'
    }
  }, [meQuery.data?.merchant?.status])

  return (
    <MerchantAccessProvider status={liveStatus}>
      <div className="min-h-screen bg-[#fcfaff]">
        <MerchantSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          merchantStatus={liveStatus}
          plan={livePlan}
        />

        <div className="lg:pl-[260px]">
          <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-border p-2 text-primary lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation"
                >
                  <Menu className="size-5" />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <div className="min-w-0">
                      <CurrentPlanBadge plan={livePlan} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{today}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {liveMerchant?.code ? (
                          <p className="font-mono text-[11px] font-semibold text-gold-foreground">
                            {liveMerchant.code}
                          </p>
                        ) : null}
                        {(liveStatus ?? '').toLowerCase() === 'pending' ? (
                          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700">
                            Pending Onboarding
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  className="relative rounded-full border border-border p-2 text-muted-foreground transition hover:text-primary"
                  aria-label="Notifications"
                  data-allow-pending
                >
                  <Bell className="size-4" />
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
                </button>
                <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials(liveMerchant?.name || user?.name, user?.email)}
                </span>
              </div>
            </div>
          </header>

          <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
            <PendingOnboardingBanner />
            <PlanExpiryReminderBanner plan={livePlan} />
            <MerchantWriteGate>{children}</MerchantWriteGate>
          </div>
        </div>
      </div>
    </MerchantAccessProvider>
  )
}
