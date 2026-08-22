import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Building2,
  Eye,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { merchantService } from '@/services/merchantService'
import type { CreateMerchantPayload, Merchant } from '@/types/merchant'
import { cn } from '@/lib/utils'

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
              Add a merchant to the LPay platform.
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
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const merchantsQuery = useQuery({
    queryKey: ['admin-merchants', debouncedSearch],
    queryFn: () => merchantService.list(debouncedSearch || undefined),
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
            ? Object.values(error.response.data.errors as Record<string, string[]>)
                .flat()
                .join(' ')
            : undefined)
        : null
      setFormError(message ?? 'Unable to onboard merchant.')
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({
      uuid,
      status,
    }: {
      uuid: string
      status: Merchant['status']
    }) => merchantService.updateStatus(uuid, status),
    onSuccess: async () => {
      setActionError('')
      await queryClient.invalidateQueries({ queryKey: ['admin-merchants'] })
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message as string | undefined)
        : null
      setActionError(message ?? 'Unable to update merchant status.')
    },
  })

  const merchants = useMemo(
    () => merchantsQuery.data ?? [],
    [merchantsQuery.data],
  )

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

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search merchants..."
            className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {actionError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        {merchantsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white py-16 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading merchants…
          </div>
        ) : merchantsQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
            Unable to load merchants. Please refresh and try again.
          </div>
        ) : merchants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white px-4 py-16 text-center">
            <p className="font-medium text-foreground">No merchants found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another search or onboard a new merchant.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {merchants.map((merchant) => {
              const nextStatus =
                merchant.status === 'active' ? 'suspended' : 'active'
              const actionLabel =
                merchant.status === 'active' ? 'Suspend' : 'Activate'
              const busy =
                statusMutation.isPending &&
                statusMutation.variables?.uuid === merchant.uuid

              return (
                <article
                  key={merchant.uuid}
                  className="flex flex-col rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                        <Building2 className="size-5" />
                      </span>
                      <div>
                        <h2 className="font-semibold text-foreground">
                          {merchant.name}
                        </h2>
                        <p className="mt-1 font-mono text-xs font-semibold tracking-wide text-gold-foreground">
                          {merchant.code}
                        </p>
                        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                          Role: {merchant.role}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                        statusBadge(merchant.status),
                      )}
                    >
                      {statusLabel(merchant.status)}
                    </span>
                  </div>

                  <ul className="mt-5 space-y-2.5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Mail className="size-4 shrink-0 text-gold" />
                      <span className="truncate">{merchant.email}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone className="size-4 shrink-0 text-gold" />
                      <span>{merchant.phone || '—'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-gold" />
                      <span>{merchant.address || '—'}</span>
                    </li>
                  </ul>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground">
                      Joined {merchant.joined_label || '—'}
                    </p>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/admin/super/merchants/$uuid"
                        params={{ uuid: merchant.uuid }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary"
                      >
                        <Eye className="size-3.5" />
                        View
                      </Link>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          statusMutation.mutate({
                            uuid: merchant.uuid,
                            status: nextStatus,
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary disabled:opacity-60"
                      >
                        {busy ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : null}
                        {actionLabel}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
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
