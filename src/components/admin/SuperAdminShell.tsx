import { useState, type ComponentType, type ReactNode } from 'react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import {
  BarChart3,
  Bell,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { adminAuthService } from '@/services/adminAuthService'
import { cn } from '@/lib/utils'

type Icon = ComponentType<{ className?: string; strokeWidth?: number }>

export const superAdminNavigation: Array<{
  label: string
  path: string
  icon: Icon
}> = [
  { label: 'Dashboard', path: '/admin/super/dashboard', icon: LayoutDashboard },
  { label: 'Merchants', path: '/admin/super/merchants', icon: Building2 },
  { label: 'Bills', path: '/admin/super/bills', icon: FileText },
  { label: 'Members', path: '/admin/super/members', icon: Users },
  {
    label: 'Members Payment',
    path: '/admin/super/customer-payments',
    icon: WalletCards,
  },
  { label: 'Payouts', path: '/admin/super/payouts', icon: CreditCard },
  { label: 'Analytics', path: '/admin/super/analytics', icon: BarChart3 },
  { label: 'Audit Logs', path: '/admin/super/audit-logs', icon: ScrollText },
  { label: 'Settings', path: '/admin/super/settings', icon: Settings },
]

function initials(name?: string | null, email?: string | null) {
  const source = (name || email || 'A').trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

function SuperAdminSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const user = adminAuthService.getUser()

  const handleLogout = () => {
    adminAuthService.logout()
    void navigate({ to: '/admin/super/login', replace: true })
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
          <Link to="/admin/super/dashboard" className="block" onClick={onClose}>
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
          {superAdminNavigation.map(({ label, path, icon: Icon }) => {
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
              {initials(user?.full_name, user?.email)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {user?.full_name || 'Super Admin'}
              </p>
              <p className="text-xs text-muted-foreground">Admin</p>
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

export function SuperAdminShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = adminAuthService.getUser()
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="min-h-screen bg-[#fcfaff]">
      <SuperAdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-[260px]">
        <header className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-lg border border-border p-2 text-primary lg:hidden"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </button>
              <p className="text-sm text-muted-foreground">{today}</p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className="relative rounded-full border border-border p-2 text-muted-foreground transition hover:text-primary"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
              <span className="grid size-9 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials(user?.full_name, user?.email)}
              </span>
            </div>
          </div>
        </header>

        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  )
}
