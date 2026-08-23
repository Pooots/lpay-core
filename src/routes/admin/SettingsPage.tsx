import { useEffect, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { LoaderCircle } from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import { MerchantCodeQr } from '@/components/admin/MerchantCodeQr'
import { BankDetailsPanel } from '@/components/admin/BankDetailsPanel'
import { MerchantLogoUploader } from '@/components/admin/MerchantLogoUploader'
import {
  MerchantPaymentGatewayPanel,
  MerchantPaymentMethodsPanel,
  MerchantRatesPanel,
} from '@/components/admin/MerchantSettingsExtraPanels'
import { settingsService } from '@/services/settingsService'
import { useDialog } from '@/components/ui/AppDialog'
import type {
  BillAmountMode,
  BillCoverageMode,
  BillDueMode,
  BillsSetItem,
  MerchantPenaltySettings,
  PenaltyAmountType,
  PenaltyApplyBase,
  PenaltyApplyMode,
} from '@/types/settings'
import { cn } from '@/lib/utils'

type SettingsTab =
  | 'profile'
  | 'accounting'
  | 'banks'
  | 'bills_set'
  | 'penalty'
  | 'payment_gateway'
  | 'payment_methods'
  | 'rates'

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'profile', label: 'Profile' },
  { id: 'accounting', label: 'Accounting Settings' },
  { id: 'banks', label: 'Bank Details' },
  { id: 'bills_set', label: 'Bills Set' },
  { id: 'penalty', label: 'Penalty' },
  { id: 'payment_methods', label: 'Payment Method' },
  { id: 'rates', label: 'Rates' },
  { id: 'payment_gateway', label: 'Payment Gateway' },
]

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<SettingsTab>('profile')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const settingsQuery = useQuery({
    queryKey: ['merchant-settings'],
    queryFn: () => settingsService.get(),
  })

  const profile = settingsQuery.data?.profile
  const accounting = settingsQuery.data?.accounting
  const banks = settingsQuery.data?.banks ?? []
  const billsSets = settingsQuery.data?.bills_sets ?? []
  const penalty = settingsQuery.data?.penalty
  const paymentGateway = settingsQuery.data?.payment_gateway
  const paymentMethods = settingsQuery.data?.payment_methods ?? []
  const rates = settingsQuery.data?.rates

  const refreshSettings = async () => {
    await queryClient.invalidateQueries({ queryKey: ['merchant-settings'] })
  }

  useEffect(() => {
    if (!profile) return
    setName(profile.name)
    setPhone(profile.phone ?? '')
    setAddress(profile.address ?? '')
  }, [profile])

  const profileMutation = useMutation({
    mutationFn: () =>
      settingsService.updateProfile({
        name,
        phone: phone || null,
        address: address || null,
      }),
    onSuccess: async () => {
      setError('')
      setSuccess('Profile updated successfully.')
      await queryClient.invalidateQueries({ queryKey: ['merchant-settings'] })
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to update profile.'))
    },
  })

  const logoUploadMutation = useMutation({
    mutationFn: (file: File) => settingsService.uploadLogo(file),
    onSuccess: async () => {
      setError('')
      setSuccess('Logo uploaded successfully.')
      await queryClient.invalidateQueries({ queryKey: ['merchant-settings'] })
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to upload logo.'))
    },
  })

  const logoRemoveMutation = useMutation({
    mutationFn: () => settingsService.removeLogo(),
    onSuccess: async () => {
      setError('')
      setSuccess('Logo removed.')
      await queryClient.invalidateQueries({ queryKey: ['merchant-settings'] })
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to remove logo.'))
    },
  })

  return (
    <MerchantShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Settings
          </h1>
          <div className="mt-3 h-px w-16 home-gold-line" />
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Manage your merchant profile, bill schedule, settlement, and bank
            accounts
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-[#fcfaff] p-1">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setTab(item.id)
                  setError('')
                  setSuccess('')
                }}
                className={cn(
                  'rounded-lg px-4 py-2 text-sm font-semibold transition',
                  tab === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-white hover:text-primary',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {settingsQuery.isLoading ? (
            <div className="mt-8 flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading settings…
            </div>
          ) : settingsQuery.isError || !profile ? (
            <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Unable to load settings. Please refresh and try again.
            </div>
          ) : (
            <>
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

              {tab === 'profile' ? (
                <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setSuccess('')
                      profileMutation.mutate()
                    }}
                    className="max-w-xl space-y-4"
                  >
                    <MerchantLogoUploader
                      logoUrl={profile.logo_url}
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
                        disabled
                        value={profile.email}
                        className="mt-1.5 w-full rounded-xl border border-border bg-[#fcfaff] px-3 py-2.5 text-sm text-muted-foreground"
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Status">
                        <input
                          disabled
                          value={profile.status}
                          className="mt-1.5 w-full rounded-xl border border-border bg-[#fcfaff] px-3 py-2.5 text-sm capitalize text-muted-foreground"
                        />
                      </Field>
                      <Field label="Joined">
                        <input
                          disabled
                          value={profile.joined_label ?? '—'}
                          className="mt-1.5 w-full rounded-xl border border-border bg-[#fcfaff] px-3 py-2.5 text-sm text-muted-foreground"
                        />
                      </Field>
                    </div>

                    <button
                      type="submit"
                      disabled={profileMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:opacity-60"
                    >
                      {profileMutation.isPending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : null}
                      Save profile
                    </button>
                  </form>

                  <div className="flex justify-center lg:justify-end">
                    <MerchantCodeQr
                      code={profile.code}
                      logoUrl={profile.logo_url}
                    />
                  </div>
                </div>
              ) : null}

              {tab === 'accounting' ? (
                <div className="mt-6 max-w-xl space-y-4">
                  <div className="rounded-2xl border border-primary/20 bg-secondary/60 p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Settlement frequency
                    </p>
                    <p className="mt-2 text-xl font-bold text-primary">
                      {accounting?.settlement_frequency_label ??
                        profile.settlement_frequency_label}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {accounting?.settlement_frequency_description ??
                        profile.settlement_frequency_description}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Frequency is managed by LPay admin. Contact support if you
                    need this schedule changed.
                  </p>
                </div>
              ) : null}

              {tab === 'banks' ? (
                <div className="mt-6">
                  <BankDetailsPanel
                    banks={banks}
                    handlers={{
                      onCreate: (payload) => settingsService.createBank(payload),
                      onUpdate: (uuid, payload) =>
                        settingsService.updateBank(uuid, payload),
                      onDelete: (uuid) => settingsService.deleteBank(uuid),
                      onChanged: async () => {
                        await queryClient.invalidateQueries({
                          queryKey: ['merchant-settings'],
                        })
                      },
                    }}
                  />
                </div>
              ) : null}

              {tab === 'bills_set' ? (
                <div className="mt-6">
                  <BillsSetForm
                    billsSets={billsSets}
                    onError={(message) => {
                      setSuccess('')
                      setError(message)
                    }}
                    onSuccess={async (message) => {
                      setError('')
                      setSuccess(message)
                      await queryClient.invalidateQueries({
                        queryKey: ['merchant-settings'],
                      })
                    }}
                  />
                </div>
              ) : null}

              {tab === 'penalty' && penalty ? (
                <div className="mt-6">
                  <PenaltySettingsForm
                    penalty={penalty}
                    onError={(message) => {
                      setSuccess('')
                      setError(message)
                    }}
                    onSuccess={async (message) => {
                      setError('')
                      setSuccess(message)
                      await queryClient.invalidateQueries({
                        queryKey: ['merchant-settings'],
                      })
                    }}
                  />
                </div>
              ) : null}

              {tab === 'payment_gateway' && paymentGateway ? (
                <MerchantPaymentGatewayPanel
                  gateway={paymentGateway}
                  onSaved={refreshSettings}
                />
              ) : null}

              {tab === 'payment_methods' ? (
                <MerchantPaymentMethodsPanel
                  methods={paymentMethods}
                  platformChannelsEnabled={
                    paymentGateway?.platform_channels_enabled ?? false
                  }
                  canManageChannels={
                    settingsQuery.data?.can_manage_payment_channels ?? false
                  }
                  onSaved={refreshSettings}
                />
              ) : null}

              {tab === 'rates' && rates ? (
                <MerchantRatesPanel rates={rates} onSaved={refreshSettings} />
              ) : null}
            </>
          )}
        </section>
      </div>
    </MerchantShell>
  )
}

function PenaltySettingsForm({
  penalty,
  onError,
  onSuccess,
}: {
  penalty: MerchantPenaltySettings
  onError: (message: string) => void
  onSuccess: (message: string) => void | Promise<void>
}) {
  const [enabled, setEnabled] = useState(penalty.enabled)
  const [amountType, setAmountType] = useState<PenaltyAmountType>(
    penalty.amount_type,
  )
  const [amount, setAmount] = useState(String(penalty.amount ?? 0))
  const [graceDays, setGraceDays] = useState(String(penalty.grace_days ?? 0))
  const [applyMode, setApplyMode] = useState<PenaltyApplyMode>(
    penalty.apply_mode,
  )
  const [applyBase, setApplyBase] = useState<PenaltyApplyBase>(
    penalty.apply_base,
  )
  const [maxPenalty, setMaxPenalty] = useState(
    penalty.max_penalty === null || penalty.max_penalty === undefined
      ? ''
      : String(penalty.max_penalty),
  )
  const [notes, setNotes] = useState(penalty.notes ?? '')

  useEffect(() => {
    setEnabled(penalty.enabled)
    setAmountType(penalty.amount_type)
    setAmount(String(penalty.amount ?? 0))
    setGraceDays(String(penalty.grace_days ?? 0))
    setApplyMode(penalty.apply_mode)
    setApplyBase(penalty.apply_base)
    setMaxPenalty(
      penalty.max_penalty === null || penalty.max_penalty === undefined
        ? ''
        : String(penalty.max_penalty),
    )
    setNotes(penalty.notes ?? '')
  }, [penalty])

  const saveMutation = useMutation({
    mutationFn: () =>
      settingsService.updatePenalty({
        enabled,
        amount_type: amountType,
        amount: Number(amount) || 0,
        grace_days: Number(graceDays) || 0,
        apply_mode: applyMode,
        apply_base: applyBase,
        max_penalty: maxPenalty.trim() === '' ? null : Number(maxPenalty),
        notes: notes.trim() || null,
      }),
    onSuccess: async () => {
      await onSuccess('Penalty settings saved.')
    },
    onError: (err) => {
      onError(axiosMessage(err, 'Unable to save penalty settings.'))
    },
  })

  const previewAmount =
    amountType === 'percentage'
      ? `${Number(amount) || 0}%`
      : `₱${(Number(amount) || 0).toLocaleString('en-PH', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Overdue penalty</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Set how much extra to charge when a bill passes its due date, and how
          that fee is applied over time.
        </p>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Enable overdue penalty
          </p>
          <p className="text-xs text-muted-foreground">
            When off, overdue bills keep their original balance only.
          </p>
        </div>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="size-4 accent-[#4B1D6E]"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Penalty type
          </span>
          <select
            value={amountType}
            disabled={!enabled}
            onChange={(e) =>
              setAmountType(e.target.value as PenaltyAmountType)
            }
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          >
            <option value="fixed">Fixed amount (₱)</option>
            <option value="percentage">Percentage (%)</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            {amountType === 'percentage' ? 'Penalty rate (%)' : 'Penalty amount (₱)'}
          </span>
          <input
            type="number"
            min={0}
            max={amountType === 'percentage' ? 100 : undefined}
            step="0.01"
            disabled={!enabled}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Grace days after due date
          </span>
          <input
            type="number"
            min={0}
            max={365}
            disabled={!enabled}
            value={graceDays}
            onChange={(e) => setGraceDays(e.target.value)}
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            0 = penalty can start the day after due date.
          </span>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            How penalty applies
          </span>
          <select
            value={applyMode}
            disabled={!enabled}
            onChange={(e) =>
              setApplyMode(e.target.value as PenaltyApplyMode)
            }
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          >
            <option value="one_time">One-time fee</option>
            <option value="daily">Daily (repeats each day)</option>
            <option value="weekly">Weekly (every 7 days)</option>
            <option value="monthly">Monthly (every 30 days)</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Calculate percentage from
          </span>
          <select
            value={applyBase}
            disabled={!enabled || amountType !== 'percentage'}
            onChange={(e) =>
              setApplyBase(e.target.value as PenaltyApplyBase)
            }
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          >
            <option value="balance">Outstanding balance</option>
            <option value="original_amount">Original bill amount</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 block font-medium text-foreground">
            Maximum penalty cap (₱)
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            disabled={!enabled}
            value={maxPenalty}
            onChange={(e) => setMaxPenalty(e.target.value)}
            placeholder="No cap"
            className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Optional. Useful for daily/weekly/monthly penalties.
          </span>
        </label>
      </div>

      <label className="block text-sm">
        <span className="mb-1.5 block font-medium text-foreground">
          Notes for your team (optional)
        </span>
        <textarea
          rows={3}
          disabled={!enabled}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Apply only to monthly dues, not special assessments."
          className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
        />
      </label>

      <div className="rounded-2xl border border-primary/15 bg-secondary/50 p-4">
        <p className="text-sm font-semibold text-foreground">How it works</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Member bill reaches its due date unpaid.</li>
          <li>
            After the grace period ({Number(graceDays) || 0} day
            {(Number(graceDays) || 0) === 1 ? '' : 's'}), penalty becomes active.
          </li>
          <li>
            Charge {previewAmount}{' '}
            {amountType === 'percentage'
              ? applyBase === 'original_amount'
                ? 'of the original bill amount'
                : 'of the outstanding balance'
              : 'as a fixed fee'}
            .
          </li>
          <li>
            {applyMode === 'one_time'
              ? 'Fee is added once.'
              : applyMode === 'daily'
                ? 'Fee repeats every day the bill stays unpaid.'
                : applyMode === 'weekly'
                  ? 'Fee repeats every 7 days the bill stays unpaid.'
                  : 'Fee repeats every 30 days the bill stays unpaid.'}
            {maxPenalty.trim()
              ? ` Total penalty will not exceed ₱${Number(maxPenalty).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
              : ''}
          </li>
        </ol>
        <p className="mt-3 rounded-xl border border-border bg-white px-3 py-2 text-sm text-foreground">
          {enabled
            ? `Summary: When overdue, charge ${previewAmount} after ${Number(graceDays) || 0} grace day(s), ${
                applyMode === 'one_time'
                  ? 'one time'
                  : applyMode === 'daily'
                    ? 'daily'
                    : applyMode === 'weekly'
                      ? 'weekly'
                      : 'monthly'
              }.`
            : 'Penalty is currently turned off.'}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
        >
          {saveMutation.isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          Save penalty settings
        </button>
      </div>
    </div>
  )
}

function BillsSetForm({
  billsSets,
  onError,
  onSuccess,
}: {
  billsSets: BillsSetItem[]
  onError: (message: string) => void
  onSuccess: (message: string) => void | Promise<void>
}) {
  const dialog = useDialog()
  const emptyForm = () => ({
    title: '',
    description: '',
    amountMode: 'variable' as BillAmountMode,
    fixedAmount: '',
    billDay: 1,
    coverageMode: 'previous_month' as BillCoverageMode,
    dueMode: 'day_of_month' as BillDueMode,
    dueDay: 15,
    dueDaysAfter: 7,
  })

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amountMode, setAmountMode] = useState<BillAmountMode>('variable')
  const [fixedAmount, setFixedAmount] = useState('')
  const [billDay, setBillDay] = useState(1)
  const [coverageMode, setCoverageMode] =
    useState<BillCoverageMode>('previous_month')
  const [dueMode, setDueMode] = useState<BillDueMode>('day_of_month')
  const [dueDay, setDueDay] = useState(15)
  const [dueDaysAfter, setDueDaysAfter] = useState(7)
  const [runningUuid, setRunningUuid] = useState<string | null>(null)

  const resetForm = () => {
    const next = emptyForm()
    setTitle(next.title)
    setDescription(next.description)
    setAmountMode(next.amountMode)
    setFixedAmount(next.fixedAmount)
    setBillDay(next.billDay)
    setCoverageMode(next.coverageMode)
    setDueMode(next.dueMode)
    setDueDay(next.dueDay)
    setDueDaysAfter(next.dueDaysAfter)
  }

  const createMutation = useMutation({
    mutationFn: () =>
      settingsService.createBillsSet({
        title: title.trim(),
        description: description.trim() || null,
        amount_mode: amountMode,
        fixed_amount:
          amountMode === 'fixed' ? Number(fixedAmount) : null,
        bill_day: billDay,
        coverage_mode: coverageMode,
        due_mode: dueMode,
        due_day: dueMode === 'day_of_month' ? dueDay : null,
        due_days_after: dueMode === 'days_after' ? dueDaysAfter : null,
        is_active: true,
      }),
    onSuccess: async () => {
      resetForm()
      await onSuccess('Bills Set saved. Form cleared for the next set.')
    },
    onError: (err) => {
      onError(axiosMessage(err, 'Unable to save Bills Set.'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => settingsService.deleteBillsSet(uuid),
    onSuccess: async () => {
      await onSuccess('Bills Set removed.')
    },
    onError: (err) => {
      onError(axiosMessage(err, 'Unable to remove Bills Set.'))
    },
  })

  const runMutation = useMutation({
    mutationFn: (uuid: string) => settingsService.runBillsSet(uuid),
    onMutate: (uuid) => setRunningUuid(uuid),
    onSuccess: async (data) => {
      setRunningUuid(null)
      await onSuccess(
        data.message ??
          `Created ${data.result.created_count} bill(s) for active customers.`,
      )
      await queryClientInvalidateBills()
    },
    onError: (err) => {
      setRunningUuid(null)
      onError(axiosMessage(err, 'Unable to bill all customers.'))
    },
  })

  const queryClient = useQueryClient()
  const queryClientInvalidateBills = async () => {
    await queryClient.invalidateQueries({ queryKey: ['merchant-bills'] })
  }

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

  const livePreviewLabel = (() => {
    const coverage =
      coverageMode === 'current_month'
        ? 'Current calendar month'
        : 'Previous calendar month'
    const due =
      dueMode === 'days_after'
        ? `${dueDaysAfter} day(s) after billing day ${billDay}`
        : `Day ${dueDay} of month`
    const amount =
      amountMode === 'fixed' && Number(fixedAmount) > 0
        ? `₱${Number(fixedAmount).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} fixed`
        : 'Enter amount when generating'
    return { coverage, due, amount }
  })()

  const canSave =
    Boolean(title.trim()) &&
    (amountMode === 'variable' || Number(fixedAmount) > 0)

  return (
    <div className="space-y-6">
      {billsSets.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-foreground">Saved bill sets</h3>
          <ul className="space-y-3">
            {billsSets.map((set) => (
              <li
                key={set.uuid}
                className="rounded-2xl border border-border bg-[#fcfaff] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{set.title}</p>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                          set.amount_mode === 'fixed'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {set.amount_mode === 'fixed'
                          ? set.fixed_amount_label
                          : 'Variable'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Billing day {set.bill_day} · {set.coverage_mode_label} ·{' '}
                      {set.due_mode === 'days_after'
                        ? `${set.due_days_after} days after`
                        : `Due day ${set.due_day}`}
                    </p>
                    {set.preview ? (
                      <p className="mt-2 text-xs text-primary">
                        This period: {set.preview.title} · Due{' '}
                        {set.preview.due_on_label}
                      </p>
                    ) : null}
                    {set.can_run_all ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Fixed monthly dues — run once to bill every active
                        customer at {set.fixed_amount_label}.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {set.can_run_all ? (
                      <button
                        type="button"
                        onClick={() => {
                          const label = set.preview?.title ?? set.title
                          void (async () => {
                            const ok = await dialog.confirm({
                              title: 'Bill all customers',
                              message: `Bill ALL active customers for “${label}” at ${set.fixed_amount_label}? Customers already billed for this coverage period will be skipped.`,
                              confirmLabel: 'Proceed',
                              cancelLabel: 'Cancel',
                            })
                            if (ok) runMutation.mutate(set.uuid)
                          })()
                        }}
                        disabled={runMutation.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
                      >
                        {runningUuid === set.uuid ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : null}
                        Bill all customers
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => {
                        void (async () => {
                          const ok = await dialog.confirm({
                            title: 'Remove bill set',
                            message: `Remove “${set.title}” from Bills Set?`,
                            confirmLabel: 'Remove',
                            cancelLabel: 'Cancel',
                            tone: 'danger',
                          })
                          if (ok) deleteMutation.mutate(set.uuid)
                        })()
                      }}
                      disabled={deleteMutation.isPending}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          createMutation.mutate()
        }}
        className="grid max-w-3xl gap-6 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-[#fcfaff] p-4">
            <p className="text-sm font-semibold text-foreground">
              Add a bill set
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Use fixed amount for Monthly Dues (bill everyone in one click).
              Use variable for water or usage-based charges.
            </p>
          </div>

          <Field label="Bill title">
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
              placeholder="e.g. Monthly Dues"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Coverage month is appended automatically (e.g. Monthly Dues —
              August 2026).
            </p>
          </Field>

          <Field label="Description (optional)">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Shown on customer bills"
            />
          </Field>

          <div>
            <p className="text-sm font-semibold text-foreground">Amount type</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setAmountMode('variable')}
                className={cn(
                  'rounded-xl border px-3 py-3 text-left transition',
                  amountMode === 'variable'
                    ? 'border-primary bg-secondary/70'
                    : 'border-border bg-white hover:bg-muted/40',
                )}
              >
                <span className="block text-sm font-semibold text-foreground">
                  Variable
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Enter amount when generating (water, etc.)
                </span>
              </button>
              <button
                type="button"
                onClick={() => setAmountMode('fixed')}
                className={cn(
                  'rounded-xl border px-3 py-3 text-left transition',
                  amountMode === 'fixed'
                    ? 'border-primary bg-secondary/70'
                    : 'border-border bg-white hover:bg-muted/40',
                )}
              >
                <span className="block text-sm font-semibold text-foreground">
                  Fixed amount
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Same ₱ for all — Monthly Dues style
                </span>
              </button>
            </div>
          </div>

          {amountMode === 'fixed' ? (
            <Field label="Fixed amount (₱)">
              <input
                required
                type="number"
                min="0.01"
                step="0.01"
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                className={inputClass}
                placeholder="0.00"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                After saving, use “Bill all customers” to charge every active
                account this amount.
              </p>
            </Field>
          ) : null}

          <Field label="Billing day of month">
            <select
              value={billDay}
              onChange={(e) => setBillDay(Number(e.target.value))}
              className={inputClass}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Coverage period">
            <select
              value={coverageMode}
              onChange={(e) =>
                setCoverageMode(e.target.value as BillCoverageMode)
              }
              className={inputClass}
            >
              <option value="previous_month">Previous calendar month</option>
              <option value="current_month">Current calendar month</option>
            </select>
          </Field>

          <Field label="Due date rule">
            <select
              value={dueMode}
              onChange={(e) => setDueMode(e.target.value as BillDueMode)}
              className={inputClass}
            >
              <option value="day_of_month">Fixed day of month</option>
              <option value="days_after">Days after billing date</option>
            </select>
          </Field>

          {dueMode === 'day_of_month' ? (
            <Field label="Due day of month">
              <select
                value={dueDay}
                onChange={(e) => setDueDay(Number(e.target.value))}
                className={inputClass}
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    Day {day}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <Field label="Days after billing date">
              <input
                type="number"
                min={0}
                max={90}
                value={dueDaysAfter}
                onChange={(e) => setDueDaysAfter(Number(e.target.value))}
                className={inputClass}
              />
            </Field>
          )}

          <button
            type="submit"
            disabled={createMutation.isPending || !canSave}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:opacity-60"
          >
            {createMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            Save Bills Set
          </button>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-primary/20 bg-secondary/50 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
              Draft preview
            </p>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Title</dt>
                <dd className="mt-0.5 font-semibold text-foreground">
                  {title.trim() || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Amount</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {livePreviewLabel.amount}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Coverage</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {livePreviewLabel.coverage}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Due rule</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  {livePreviewLabel.due}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Billing day</dt>
                <dd className="mt-0.5 font-medium text-foreground">
                  Day {billDay}
                </dd>
              </div>
            </dl>
          </div>
          <p className="text-xs text-muted-foreground">
            Monthly Dues tip: choose Fixed amount, save, then press “Bill all
            customers” on the saved card.
          </p>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  )
}

function axiosMessage(err: unknown, fallback: string) {
  if (!axios.isAxiosError(err)) return fallback
  return (
    (err.response?.data?.message as string | undefined) ||
    (err.response?.data?.errors
      ? Object.values(err.response.data.errors as Record<string, string[]>)
          .flat()
          .join(' ')
      : undefined) ||
    fallback
  )
}
