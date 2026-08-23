import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Eye, LoaderCircle, Plus, Search, X } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import {
  merchantService,
  type MerchantLifecycleFilter,
} from '@/services/merchantService'
import type { CreateMerchantPayload, Merchant } from '@/types/merchant'
import { cn } from '@/lib/utils'

function statusBadge(status: Merchant['status'], planExpired?: boolean) {
  if (status === 'suspended') {
    return 'bg-rose-50 text-rose-700'
  }
  if (planExpired) {
    return 'bg-amber-50 text-amber-800'
  }
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700'
    case 'pending':
      return 'bg-sky-50 text-sky-700'
    default:
      return 'bg-secondary text-primary'
  }
}

function statusLabel(status: Merchant['status'], planExpired?: boolean) {
  if (status === 'suspended') return 'Suspend'
  if (status === 'pending') return 'Pending'
  if (planExpired) return 'Expired'
  return 'Active'
}

function StatCard({
  label,
  value,
  hint,
  tone,
  active,
  onClick,
}: {
  label: string
  value: string
  hint: string
  tone: 'pending' | 'active' | 'suspended' | 'expired'
  active: boolean
  onClick: () => void
}) {
  const toneClass =
    tone === 'pending'
      ? 'border-sky-200/80 bg-sky-50/40'
      : tone === 'active'
        ? 'border-emerald-200/80 bg-emerald-50/40'
        : tone === 'suspended'
          ? 'border-rose-200/80 bg-rose-50/40'
          : 'border-amber-200/80 bg-amber-50/40'

  const valueClass =
    tone === 'pending'
      ? 'text-sky-800'
      : tone === 'active'
        ? 'text-emerald-800'
        : tone === 'suspended'
          ? 'text-rose-800'
          : 'text-amber-900'

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border bg-white p-4 text-left shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.3)] transition',
        toneClass,
        active
          ? 'ring-2 ring-primary ring-offset-2'
          : 'hover:border-primary/40 hover:shadow-[0_12px_28px_-20px_rgb(75_29_110_/_0.45)]',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={cn('mt-2 text-2xl font-bold', valueClass)}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </button>
  )
}

function OnboardMerchantModal({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  open: boolean
  onClose: () => void
  onSubmit: (payload: CreateMerchantPayload) => void
  isSubmitting: boolean
  error: string
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    if (!open) {
      setName('')
      setEmail('')
      setPassword('')
      setPhone('')
      setAddress('')
    }
  }, [open])

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      email,
      password,
      phone: phone || undefined,
      address: address || undefined,
      status: 'pending',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)] sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Onboard Merchant
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a merchant to the LPay platform. No plan is assigned yet —
              they choose and pay after login.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
          >
            <X className="size-5" />
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-foreground">
              Merchant name
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Aurora Digital Studio"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="billing@merchant.ph"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-foreground">
              Password
            </label>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Min. 8 characters"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Creates a login account with role <strong>merchant</strong>.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-foreground">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="+63 917 000 0000"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">
                Address
              </label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="City, Philippines"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Onboard
          </button>
        </div>
      </form>
    </div>
  )
}

export default function MerchantsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [lifecycle, setLifecycle] = useState<MerchantLifecycleFilter>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const merchantsQuery = useQuery({
    queryKey: ['admin-merchants', debouncedSearch, lifecycle],
    queryFn: () =>
      merchantService.list(
        debouncedSearch || undefined,
        lifecycle === 'all' ? undefined : lifecycle,
      ),
  })

  const createMutation = useMutation({
    mutationFn: merchantService.create,
    onSuccess: async () => {
      setModalOpen(false)
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['admin-merchants'] })
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message as string | undefined) ||
          (error.response?.data?.errors
            ? Object.values(
                error.response.data.errors as Record<string, string[]>,
              )
                .flat()
                .join(' ')
            : undefined)
        : null
      setFormError(message ?? 'Unable to onboard merchant.')
    },
  })

  const merchants = useMemo(
    () => merchantsQuery.data?.data ?? [],
    [merchantsQuery.data],
  )
  const summary = merchantsQuery.data?.summary

  return (
    <SuperAdminShell>
      <div className="home-rise space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Merchants
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Onboard and manage merchants on the LPay platform
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormError('')
              setModalOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-12px_rgb(75_29_110_/_0.7)] transition hover:bg-[#3f1860]"
          >
            <Plus className="size-4 text-gold" />
            Onboard Merchant
          </button>
        </div>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Pending"
            value={String(summary?.pending ?? 0)}
            hint="Awaiting plan payment or activation"
            tone="pending"
            active={lifecycle === 'pending'}
            onClick={() =>
              setLifecycle((prev) => (prev === 'pending' ? 'all' : 'pending'))
            }
          />
          <StatCard
            label="Active"
            value={String(summary?.active ?? 0)}
            hint="Active with current plan coverage"
            tone="active"
            active={lifecycle === 'active'}
            onClick={() =>
              setLifecycle((prev) => (prev === 'active' ? 'all' : 'active'))
            }
          />
          <StatCard
            label="Suspend"
            value={String(summary?.suspended ?? 0)}
            hint="Suspended merchant accounts"
            tone="suspended"
            active={lifecycle === 'suspended'}
            onClick={() =>
              setLifecycle((prev) =>
                prev === 'suspended' ? 'all' : 'suspended',
              )
            }
          />
          <StatCard
            label="Expired"
            value={String(summary?.expired ?? 0)}
            hint="Plan coverage past paid-through date"
            tone="expired"
            active={lifecycle === 'expired'}
            onClick={() =>
              setLifecycle((prev) => (prev === 'expired' ? 'all' : 'expired'))
            }
          />
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchants..."
              className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {lifecycle !== 'all' ? (
            <button
              type="button"
              onClick={() => setLifecycle('all')}
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Clear status filter
            </button>
          ) : null}
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          {merchantsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading merchants…
            </div>
          ) : merchantsQuery.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              Unable to load merchants. Please refresh and try again.
            </div>
          ) : merchants.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">No merchants found</p>
              <p className="mt-1">
                Try another search or onboard a new merchant.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Merchant</th>
                    <th className="pb-3 pr-4">Contact</th>
                    <th className="pb-3 pr-4">Plan</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Joined</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((merchant) => {
                    const expired = Boolean(merchant.plan_expired)

                    return (
                      <tr
                        key={merchant.uuid}
                        className="border-b border-border/70 last:border-0"
                      >
                        <td className="py-3.5 pr-4 align-middle">
                          <p className="font-semibold text-foreground">
                            {merchant.name}
                          </p>
                          <p className="mt-0.5 font-mono text-xs font-semibold tracking-wide text-gold-foreground">
                            {merchant.code}
                          </p>
                        </td>
                        <td className="py-3.5 pr-4 align-middle">
                          <p className="text-foreground">{merchant.email}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {merchant.phone || '—'}
                            {merchant.address ? ` · ${merchant.address}` : ''}
                          </p>
                        </td>
                        <td className="py-3.5 pr-4 align-middle">
                          <p className="font-medium text-foreground">
                            {merchant.plan_name || 'No plan'}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {merchant.plan_member_range_label ||
                              (expired
                                ? 'Coverage expired'
                                : merchant.plan_paid_through_label
                                  ? `Through ${merchant.plan_paid_through_label}`
                                  : '—')}
                          </p>
                        </td>
                        <td className="py-3.5 pr-4 align-middle">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                              statusBadge(merchant.status, expired),
                            )}
                          >
                            {statusLabel(merchant.status, expired)}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 align-middle text-muted-foreground">
                          {merchant.joined_label || '—'}
                        </td>
                        <td className="py-3.5 align-middle">
                          <div className="flex items-center justify-end">
                            <Link
                              to="/admin/super/merchants/$uuid"
                              params={{ uuid: merchant.uuid }}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary"
                            >
                              <Eye className="size-3.5" />
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <OnboardMerchantModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        isSubmitting={createMutation.isPending}
        error={formError}
        onSubmit={(payload) => createMutation.mutate(payload)}
      />
    </SuperAdminShell>
  )
}
