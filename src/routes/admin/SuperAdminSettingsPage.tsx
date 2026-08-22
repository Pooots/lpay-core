import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Building2,
  CreditCard,
  LoaderCircle,
  Percent,
  RefreshCw,
} from 'lucide-react'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { platformSettingsService } from '@/services/platformSettingsService'
import type {
  CommissionType,
  GatewayRatesSettings,
  MerchantCommissionSettings,
  PaymentMethodItem,
} from '@/types/platformSettings'
import { cn } from '@/lib/utils'

type SettingsTab =
  | 'merchant'
  | 'payment-methods'
  | 'rates'
  | 'currency'

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'merchant', label: 'Merchant settings' },
  { id: 'payment-methods', label: 'Default payment methods' },
  { id: 'rates', label: 'Rates Settings' },
  { id: 'currency', label: 'Currency conversion' },
]

const RATE_FIELDS: Array<{
  key: keyof Omit<GatewayRatesSettings['paymongo'], 'dob'>
  label: string
}> = [
  { key: 'qrph', label: 'QR Ph' },
  { key: 'card', label: 'Card' },
  { key: 'gcash', label: 'GCash' },
  { key: 'grab_pay', label: 'Grab Pay' },
  { key: 'shopee_pay', label: 'Shopee Pay' },
  { key: 'billease', label: 'Billease' },
  { key: 'paymaya', label: 'PayMaya' },
  { key: 'brankas', label: 'Brankas' },
]

function axiosMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback
  return (
    (error.response?.data?.message as string | undefined) ||
    (error.response?.data?.errors
      ? Object.values(error.response.data.errors as Record<string, string[]>)
          .flat()
          .join(' ')
      : undefined) ||
    fallback
  )
}

function formatUpdatedAt(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition',
        checked ? 'bg-primary' : 'bg-border',
        disabled && 'opacity-60',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

function FeeField({
  label,
  value,
  type,
  onValueChange,
  onTypeChange,
}: {
  label: string
  value: number
  type: CommissionType
  onValueChange: (value: number) => void
  onTypeChange: (type: CommissionType) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-sm font-semibold text-foreground">{label}</label>
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as CommissionType)}
          className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-medium outline-none focus:border-primary"
        >
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed (₱)</option>
        </select>
      </div>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        className="mt-3 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}

function summarizeFees(value: {
  tax: number
  tax_type: string
  system_fee: number
  system_fee_type: string
  other_fee: number
  other_fee_type: string
}) {
  const fmt = (amount: number, type: string) =>
    type === 'fixed' ? `₱${amount}` : `${amount}%`
  return `Tax ${fmt(value.tax, value.tax_type)} · System ${fmt(value.system_fee, value.system_fee_type)} · Other ${fmt(value.other_fee, value.other_fee_type)}`
}

function MerchantSettingsTab() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Omit<MerchantCommissionSettings, 'updated_at'> | null>(
    null,
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const settingsQuery = useQuery({
    queryKey: ['super-settings-merchant-commission'],
    queryFn: () => platformSettingsService.getMerchantCommission(),
  })

  const historyQuery = useQuery({
    queryKey: ['super-settings-merchant-commission-history'],
    queryFn: () => platformSettingsService.getMerchantCommissionHistory(),
  })

  useEffect(() => {
    if (!settingsQuery.data) return
    const { updated_at: _updatedAt, ...rest } = settingsQuery.data
    setForm(rest)
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: platformSettingsService.updateMerchantCommission,
    onSuccess: async () => {
      setError('')
      setSuccess('Default merchant commission saved.')
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['super-settings-merchant-commission'],
        }),
        queryClient.invalidateQueries({
          queryKey: ['super-settings-merchant-commission-history'],
        }),
      ])
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to save default commission.'))
    },
  })

  if (settingsQuery.isLoading || !form) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-primary" />
        Loading merchant settings…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
            <Building2 className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Platform merchant commission
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Default fees applied to newly onboarded merchants. Existing
              merchants keep their current rates unless updated individually.
            </p>
            {settingsQuery.data?.updated_at ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Last updated: {formatUpdatedAt(settingsQuery.data.updated_at)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <FeeField
            label="Tax"
            value={form.tax}
            type={form.tax_type}
            onValueChange={(tax) => setForm((prev) => (prev ? { ...prev, tax } : prev))}
            onTypeChange={(tax_type) =>
              setForm((prev) => (prev ? { ...prev, tax_type } : prev))
            }
          />
          <FeeField
            label="System fee"
            value={form.system_fee}
            type={form.system_fee_type}
            onValueChange={(system_fee) =>
              setForm((prev) => (prev ? { ...prev, system_fee } : prev))
            }
            onTypeChange={(system_fee_type) =>
              setForm((prev) => (prev ? { ...prev, system_fee_type } : prev))
            }
          />
          <FeeField
            label="Other fee"
            value={form.other_fee}
            type={form.other_fee_type}
            onValueChange={(other_fee) =>
              setForm((prev) => (prev ? { ...prev, other_fee } : prev))
            }
            onTypeChange={(other_fee_type) =>
              setForm((prev) => (prev ? { ...prev, other_fee_type } : prev))
            }
          />
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

        <button
          type="button"
          disabled={saveMutation.isPending}
          onClick={() => {
            setSuccess('')
            saveMutation.mutate(form)
          }}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
        >
          {saveMutation.isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          Save default commission
        </button>
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
        <h3 className="text-sm font-bold text-foreground">
          History of default platform commission rate changes.
        </h3>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5">Previous</th>
                <th className="px-3 py-2.5">Current</th>
                <th className="px-3 py-2.5">Changed by</th>
                <th className="px-3 py-2.5">Changed at</th>
              </tr>
            </thead>
            <tbody>
              {(historyQuery.data ?? []).length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-8 text-center text-sm text-muted-foreground"
                  >
                    No default commission changes recorded yet.
                  </td>
                </tr>
              ) : (
                historyQuery.data?.map((row) => (
                  <tr
                    key={row.uuid}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="px-3 py-3 text-muted-foreground">
                      {summarizeFees(row.previous_value)}
                    </td>
                    <td className="px-3 py-3 font-medium text-foreground">
                      {summarizeFees(row.current_value)}
                    </td>
                    <td className="px-3 py-3 text-foreground">{row.changed_by}</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      {row.changed_at_label || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function PaymentMethodsTab() {
  const queryClient = useQueryClient()
  const [methods, setMethods] = useState<PaymentMethodItem[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const methodsQuery = useQuery({
    queryKey: ['super-settings-payment-methods'],
    queryFn: () => platformSettingsService.getPaymentMethods(),
  })

  useEffect(() => {
    if (methodsQuery.data) {
      setMethods(methodsQuery.data.payment_methods)
    }
  }, [methodsQuery.data])

  const enabledCount = methods.filter((m) => m.value).length
  const allOn = methods.length > 0 && enabledCount === methods.length

  const saveMutation = useMutation({
    mutationFn: () =>
      platformSettingsService.updatePaymentMethods(
        methods.map((m) => ({ name: m.name, value: m.value })),
      ),
    onSuccess: async () => {
      setError('')
      setSuccess('Default payment methods saved.')
      await queryClient.invalidateQueries({
        queryKey: ['super-settings-payment-methods'],
      })
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to save payment methods.'))
    },
  })

  if (methodsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-primary" />
        Loading payment methods…
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <CreditCard className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Default payment methods
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Checkout payment options used by PayMongo for member bill payments.
              {methodsQuery.data?.updated_at
                ? ` Last updated: ${formatUpdatedAt(methodsQuery.data.updated_at)}.`
                : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
              <CreditCard className="size-4" />
            </div>
            <div>
              <p className="font-semibold text-foreground">PayMongo</p>
              <p className="text-xs text-muted-foreground">
                Local wallets, cards, and bank rails
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">All PayMongo</p>
              <p className="text-xs text-muted-foreground">
                {allOn ? 'All on' : enabledCount === 0 ? 'All off' : 'Some on'}
              </p>
            </div>
            <Toggle
              checked={allOn}
              onChange={(next) =>
                setMethods((current) =>
                  current.map((item) => ({ ...item, value: next })),
                )
              }
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {methods.map((method) => (
            <div
              key={method.name}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {method.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {method.value ? 'Enabled for checkout' : 'Disabled'}
                </p>
              </div>
              <Toggle
                checked={method.value}
                onChange={(value) =>
                  setMethods((current) =>
                    current.map((item) =>
                      item.name === method.name ? { ...item, value } : item,
                    ),
                  )
                }
              />
            </div>
          ))}
        </div>
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

      <button
        type="button"
        disabled={saveMutation.isPending}
        onClick={() => {
          setSuccess('')
          saveMutation.mutate()
        }}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
      >
        {saveMutation.isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : null}
        Save payment methods
      </button>
    </section>
  )
}

function RatesSettingsTab() {
  const queryClient = useQueryClient()
  const [providerTab, setProviderTab] = useState<'paymongo' | 'paypal'>('paymongo')
  const [form, setForm] = useState<Pick<
    GatewayRatesSettings,
    'paymongo' | 'paypal'
  > | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const ratesQuery = useQuery({
    queryKey: ['super-settings-gateway-rates'],
    queryFn: () => platformSettingsService.getGatewayRates(),
  })

  useEffect(() => {
    if (!ratesQuery.data) return
    setForm({
      paymongo: ratesQuery.data.paymongo,
      paypal: ratesQuery.data.paypal,
    })
  }, [ratesQuery.data])

  const saveMutation = useMutation({
    mutationFn: platformSettingsService.updateGatewayRates,
    onSuccess: async () => {
      setError('')
      setSuccess('Payment gateway rates saved.')
      await queryClient.invalidateQueries({
        queryKey: ['super-settings-gateway-rates'],
      })
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to save gateway rates.'))
    },
  })

  if (ratesQuery.isLoading || !form) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-primary" />
        Loading rates…
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
          <Percent className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Rates Settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            PayMongo methods use a percentage. Direct Online Banking (DOB) uses a
            percentage plus a fixed minimum. PayPal fees use a percentage plus a
            fixed PHP amount.
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2 border-b border-border">
        {(['paymongo', 'paypal'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setProviderTab(id)}
            className={cn(
              'border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition',
              providerTab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {id === 'paymongo' ? 'PayMongo' : 'PayPal'}
          </button>
        ))}
      </div>

      {providerTab === 'paymongo' ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="font-semibold text-foreground">
              Direct Online Banking (dob)
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fee = max( amount × % , fixed minimum )
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Transaction percentage
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.paymongo.dob.percentage}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              paymongo: {
                                ...prev.paymongo,
                                dob: {
                                  ...prev.paymongo.dob,
                                  percentage: Number(e.target.value),
                                },
                              },
                            }
                          : prev,
                      )
                    }
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">
                  Fixed minimum fee (PHP)
                </label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    ₱
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.paymongo.dob.fixed_minimum}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              paymongo: {
                                ...prev.paymongo,
                                dob: {
                                  ...prev.paymongo.dob,
                                  fixed_minimum: Number(e.target.value),
                                },
                              },
                            }
                          : prev,
                      )
                    }
                    className="w-full rounded-xl border border-border bg-white py-2.5 pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {RATE_FIELDS.map((field) => (
              <div
                key={field.key}
                className="rounded-xl border border-border bg-muted/20 px-4 py-3"
              >
                <label className="text-sm font-semibold text-foreground">
                  {field.label}{' '}
                  <span className="font-normal text-muted-foreground">
                    ({field.key})
                  </span>
                </label>
                <div className="relative mt-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.paymongo[field.key]}
                    onChange={(e) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              paymongo: {
                                ...prev.paymongo,
                                [field.key]: Number(e.target.value),
                              },
                            }
                          : prev,
                      )
                    }
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <label className="text-sm font-semibold text-foreground">
              PayPal fee (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.paypal.paypal_fee}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        paypal: {
                          ...prev.paypal,
                          paypal_fee: Number(e.target.value),
                        },
                      }
                    : prev,
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
            <label className="text-sm font-semibold text-foreground">
              Additional fee (PHP)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.paypal.additional_fee}
              onChange={(e) =>
                setForm((prev) =>
                  prev
                    ? {
                        ...prev,
                        paypal: {
                          ...prev.paypal,
                          additional_fee: Number(e.target.value),
                        },
                      }
                    : prev,
                )
              }
              className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      )}

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

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saveMutation.isPending}
          onClick={() => {
            setSuccess('')
            saveMutation.mutate(form)
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
        >
          {saveMutation.isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          Save payment gateway rates
        </button>
        {ratesQuery.data?.updated_at ? (
          <p className="text-xs text-muted-foreground">
            Last updated: {formatUpdatedAt(ratesQuery.data.updated_at)}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function CurrencyTab() {
  return (
    <section className="rounded-2xl border border-border bg-white px-6 py-16 text-center shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]">
      <RefreshCw className="mx-auto size-10 text-primary/40" />
      <p className="mt-4 text-lg font-semibold text-foreground">Coming soon..</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Currency conversion controls will be available here.
      </p>
    </section>
  )
}

export default function SuperAdminSettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('merchant')

  const content = useMemo(() => {
    switch (tab) {
      case 'merchant':
        return <MerchantSettingsTab />
      case 'payment-methods':
        return <PaymentMethodsTab />
      case 'rates':
        return <RatesSettingsTab />
      case 'currency':
        return <CurrencyTab />
      default:
        return null
    }
  }, [tab])

  return (
    <SuperAdminShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Configuration and platform controls
          </p>
        </div>

        <div className="border-b border-border">
          <div className="-mb-px flex gap-1 overflow-x-auto sm:gap-2">
            {TABS.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    'flex-shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                  )}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>

        {content}
      </div>
    </SuperAdminShell>
  )
}
