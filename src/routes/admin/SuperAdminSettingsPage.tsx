import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  CreditCard,
  LoaderCircle,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { SuperAdminShell } from '@/components/admin/SuperAdminShell'
import { useDialog } from '@/components/ui/AppDialog'
import { platformSettingsService } from '@/services/platformSettingsService'
import type {
  CommissionType,
  CurrencyRateRow,
  GatewayRatesSettings,
  MerchantPlan,
  MerchantPlanPayload,
  PaymentMethodItem,
} from '@/types/platformSettings'
import { cn } from '@/lib/utils'

type SettingsTab =
  | 'payment-methods'
  | 'rates'
  | 'plans'
  | 'currency'

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'payment-methods', label: 'Default payment methods' },
  { id: 'rates', label: 'Rates Settings' },
  { id: 'plans', label: 'Plan settings' },
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
  const queryClient = useQueryClient()
  const [enabled, setEnabled] = useState(true)
  const [rates, setRates] = useState<CurrencyRateRow[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currencyQuery = useQuery({
    queryKey: ['platform-currency-conversion'],
    queryFn: () => platformSettingsService.getCurrencyConversion(),
  })

  useEffect(() => {
    if (!currencyQuery.data) return
    setEnabled(currencyQuery.data.enabled)
    setRates(
      currencyQuery.data.rates.map((row) => ({
        code: row.code,
        label: row.label,
        rate: row.rate,
      })),
    )
  }, [currencyQuery.data])

  const saveMutation = useMutation({
    mutationFn: () =>
      platformSettingsService.updateCurrencyConversion({
        enabled,
        rates: rates.map((row) => ({
          code: row.code.trim().toUpperCase(),
          label: row.label.trim() || row.code.trim().toUpperCase(),
          rate: Number(row.rate) || 0,
        })),
      }),
    onSuccess: async () => {
      setError('')
      setSuccess('Currency conversion rates saved.')
      await queryClient.invalidateQueries({
        queryKey: ['platform-currency-conversion'],
      })
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to save currency conversion.'))
    },
  })

  const updatedLabel = formatUpdatedAt(currencyQuery.data?.updated_at)

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Currency conversion
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set how many Philippine pesos (₱) equal 1 unit of each foreign
              currency. Base currency is always PHP.
            </p>
            {updatedLabel ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Last updated {updatedLabel}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Enabled</span>
            <Toggle checked={enabled} onChange={setEnabled} />
          </div>
        </div>

        {currencyQuery.isLoading ? (
          <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading rates…
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {rates.map((row, index) => (
              <div
                key={`${row.code}-${index}`}
                className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[100px_1fr_140px_auto]"
              >
                <input
                  value={row.code}
                  onChange={(e) => {
                    const next = [...rates]
                    next[index] = {
                      ...row,
                      code: e.target.value.toUpperCase().slice(0, 3),
                    }
                    setRates(next)
                  }}
                  placeholder="USD"
                  className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-semibold uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <input
                  value={row.label}
                  onChange={(e) => {
                    const next = [...rates]
                    next[index] = { ...row, label: e.target.value }
                    setRates(next)
                  }}
                  placeholder="US Dollar"
                  className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    ₱
                  </span>
                  <input
                    type="number"
                    min={0}
                    step="0.0001"
                    value={row.rate}
                    onChange={(e) => {
                      const next = [...rates]
                      next[index] = {
                        ...row,
                        rate: Number(e.target.value) || 0,
                      }
                      setRates(next)
                    }}
                    className="w-full rounded-xl border border-border bg-white py-2 pl-7 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRates((current) =>
                      current.filter((_, i) => i !== index),
                    )
                  }
                  className="inline-flex size-10 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50"
                  aria-label="Remove rate"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setRates((current) => [
                  ...current,
                  { code: '', label: '', rate: 0 },
                ])
              }
              className="inline-flex items-center gap-2 rounded-xl border border-dashed border-primary/40 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-secondary"
            >
              <Plus className="size-4" />
              Add currency
            </button>
          </div>
        )}

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={saveMutation.isPending || currencyQuery.isLoading}
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
          >
            {saveMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Save conversion rates
          </button>
        </div>
      </div>
    </section>
  )
}

const PLAN_FEATURE_OPTIONS: Array<{ id: string; label: string }> = [
  { id: 'members', label: 'Members' },
  { id: 'generate_bills', label: 'Generate bills' },
  { id: 'tracker', label: 'Payment tracker' },
  { id: 'payments', label: 'Payments' },
  { id: 'manual_payment', label: 'Manual payment' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'priority_support', label: 'Priority support' },
]

function emptyPlanForm(): MerchantPlanPayload & {
  member_max_input: string
} {
  return {
    name: '',
    code: '',
    description: '',
    member_min: 1,
    member_max_input: '',
    monthly_fee: 0,
    commission_tax: 0,
    commission_tax_type: 'percentage',
    commission_system_fee: 0,
    commission_system_fee_type: 'fixed',
    commission_other_fee: 0,
    commission_other_fee_type: 'percentage',
    is_active: true,
    is_default: false,
    sort_order: 0,
    features: [],
  }
}

function PlanSettingsTab() {
  const dialog = useDialog()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<MerchantPlan | null>(null)
  const [form, setForm] = useState(emptyPlanForm())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const plansQuery = useQuery({
    queryKey: ['platform-merchant-plans'],
    queryFn: () => platformSettingsService.listPlans(),
  })

  useEffect(() => {
    if (!editing) {
      setForm(emptyPlanForm())
      return
    }
    setForm({
      name: editing.name,
      code: editing.code,
      description: editing.description ?? '',
      member_min: editing.member_min,
      member_max_input:
        editing.member_max === null ? '' : String(editing.member_max),
      monthly_fee: editing.monthly_fee,
      commission_tax: editing.commission_tax ?? 0,
      commission_tax_type: editing.commission_tax_type ?? 'percentage',
      commission_system_fee: editing.commission_system_fee ?? 0,
      commission_system_fee_type:
        editing.commission_system_fee_type ?? 'fixed',
      commission_other_fee: editing.commission_other_fee ?? 0,
      commission_other_fee_type:
        editing.commission_other_fee_type ?? 'percentage',
      is_active: editing.is_active,
      is_default: editing.is_default,
      sort_order: editing.sort_order,
      features: editing.features ?? [],
    })
  }, [editing])

  const toggleFeature = (featureId: string, checked: boolean) => {
    setForm((current) => {
      const selected = new Set(current.features ?? [])
      if (checked) selected.add(featureId)
      else selected.delete(featureId)
      return { ...current, features: Array.from(selected) }
    })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const maxRaw = form.member_max_input.trim()
      const payload: MerchantPlanPayload = {
        name: form.name.trim(),
        code: form.code?.trim() || undefined,
        description: form.description?.trim() || null,
        member_min: Number(form.member_min) || 1,
        member_max: maxRaw === '' ? null : Number(maxRaw),
        monthly_fee: Number(form.monthly_fee) || 0,
        commission_tax: Number(form.commission_tax) || 0,
        commission_tax_type: form.commission_tax_type ?? 'percentage',
        commission_system_fee: Number(form.commission_system_fee) || 0,
        commission_system_fee_type:
          form.commission_system_fee_type ?? 'fixed',
        commission_other_fee: Number(form.commission_other_fee) || 0,
        commission_other_fee_type:
          form.commission_other_fee_type ?? 'percentage',
        is_active: Boolean(form.is_active),
        is_default: Boolean(form.is_default),
        sort_order: Number(form.sort_order) || 0,
        features: form.features ?? [],
      }
      if (editing) {
        return platformSettingsService.updatePlan(editing.uuid, payload)
      }
      return platformSettingsService.createPlan(payload)
    },
    onSuccess: async () => {
      setError('')
      setSuccess(editing ? 'Plan updated.' : 'Plan created.')
      setEditing(null)
      setForm(emptyPlanForm())
      await queryClient.invalidateQueries({
        queryKey: ['platform-merchant-plans'],
      })
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to save plan.'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => platformSettingsService.deletePlan(uuid),
    onSuccess: async () => {
      setSuccess('Plan deleted.')
      await queryClient.invalidateQueries({
        queryKey: ['platform-merchant-plans'],
      })
    },
    onError: async (err) => {
      await dialog.alert({
        title: 'Unable to delete',
        message: axiosMessage(err, 'Unable to delete plan.'),
        tone: 'danger',
      })
    },
  })

  const plans = plansQuery.data ?? []

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Plan settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create merchant plans with member capacity (e.g. 1–100, 101–500).
              Platform fees (tax, system, other) on member payments are set
              here and applied from the merchant’s assigned plan.
            </p>
          </div>
          {editing ? (
            <button
              type="button"
              onClick={() => {
                setEditing(null)
                setForm(emptyPlanForm())
                setError('')
              }}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Plan name
            </span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Starter"
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Code
            </span>
            <input
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              placeholder="starter (optional)"
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium text-foreground">
              Description
            </span>
            <textarea
              value={form.description ?? ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              rows={2}
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Members min
            </span>
            <input
              type="number"
              min={1}
              value={form.member_min}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  member_min: Number(e.target.value) || 1,
                }))
              }
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Members max
            </span>
            <input
              type="number"
              min={1}
              value={form.member_max_input}
              onChange={(e) =>
                setForm((f) => ({ ...f, member_max_input: e.target.value }))
              }
              placeholder="Blank = unlimited"
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium text-foreground">
              Monthly fee (₱)
            </span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.monthly_fee}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  monthly_fee: Number(e.target.value) || 0,
                }))
              }
              className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="sm:col-span-2 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                Platforms commission
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Applied to this plan’s member payments. Merchants inherit these
                fees from their assigned plan.
              </p>
            </div>
            <PlanFeeRow
              label="Tax"
              value={String(form.commission_tax ?? 0)}
              type={form.commission_tax_type ?? 'percentage'}
              onValueChange={(value) =>
                setForm((f) => ({
                  ...f,
                  commission_tax: Number(value) || 0,
                }))
              }
              onTypeChange={(type) =>
                setForm((f) => ({ ...f, commission_tax_type: type }))
              }
            />
            <PlanFeeRow
              label="System fee"
              value={String(form.commission_system_fee ?? 0)}
              type={form.commission_system_fee_type ?? 'fixed'}
              onValueChange={(value) =>
                setForm((f) => ({
                  ...f,
                  commission_system_fee: Number(value) || 0,
                }))
              }
              onTypeChange={(type) =>
                setForm((f) => ({
                  ...f,
                  commission_system_fee_type: type,
                }))
              }
            />
            <PlanFeeRow
              label="Other fee"
              value={String(form.commission_other_fee ?? 0)}
              type={form.commission_other_fee_type ?? 'percentage'}
              onValueChange={(value) =>
                setForm((f) => ({
                  ...f,
                  commission_other_fee: Number(value) || 0,
                }))
              }
              onTypeChange={(type) =>
                setForm((f) => ({
                  ...f,
                  commission_other_fee_type: type,
                }))
              }
            />
            <div className="rounded-xl border border-primary/15 bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
              Example on a ₱1,000 payment:{' '}
              <span className="font-semibold text-primary">
                ₱
                {planFeeExampleTotal(
                  Number(form.commission_tax) || 0,
                  form.commission_tax_type ?? 'percentage',
                  Number(form.commission_system_fee) || 0,
                  form.commission_system_fee_type ?? 'fixed',
                  Number(form.commission_other_fee) || 0,
                  form.commission_other_fee_type ?? 'percentage',
                  1000,
                ).toFixed(2)}
              </span>{' '}
              total platform fees
            </div>
          </div>
          <div className="block text-sm sm:col-span-2">
            <span className="mb-2 block font-medium text-foreground">
              Features
            </span>
            <div className="grid gap-2 sm:grid-cols-2">
              {PLAN_FEATURE_OPTIONS.map((feature) => {
                const checked = (form.features ?? []).includes(feature.id)
                return (
                  <label
                    key={feature.id}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition',
                      checked
                        ? 'border-primary/40 bg-secondary/60'
                        : 'border-border bg-white hover:border-primary/30',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        toggleFeature(feature.id, e.target.checked)
                      }
                      className="size-4 rounded border-border text-primary accent-[#4B1D6E]"
                    />
                    <span className="text-sm font-medium text-foreground">
                      {feature.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-5">
          <label className="inline-flex items-center gap-2 text-sm">
            <Toggle
              checked={Boolean(form.is_active)}
              onChange={(next) => setForm((f) => ({ ...f, is_active: next }))}
            />
            Active
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <Toggle
              checked={Boolean(form.is_default)}
              onChange={(next) => setForm((f) => ({ ...f, is_default: next }))}
            />
            Default for new merchants
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={saveMutation.isPending || !form.name.trim()}
            onClick={() => saveMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
          >
            {saveMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : editing ? (
              <Pencil className="size-4" />
            ) : (
              <Plus className="size-4" />
            )}
            {editing ? 'Update plan' : 'Create plan'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
        <h3 className="text-base font-bold text-foreground">Existing plans</h3>
        {plansQuery.isLoading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading plans…
          </div>
        ) : plans.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">No plans yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="pb-3 pr-4">Plan</th>
                  <th className="pb-3 pr-4">Members</th>
                  <th className="pb-3 pr-4">Fee</th>
                  <th className="pb-3 pr-4">Platform fees</th>
                  <th className="pb-3 pr-4">Merchants</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.uuid}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="py-3.5 pr-4">
                      <p className="font-semibold text-foreground">
                        {plan.name}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {plan.code}
                      </p>
                      {plan.description ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {plan.description}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3.5 pr-4 text-muted-foreground">
                      {plan.member_range_label}
                    </td>
                    <td className="py-3.5 pr-4 font-medium">
                      {plan.monthly_fee_label}
                    </td>
                    <td className="py-3.5 pr-4 text-xs text-muted-foreground">
                      <div>Tax {formatPlanFee(plan.commission_tax, plan.commission_tax_type)}</div>
                      <div>
                        System{' '}
                        {formatPlanFee(
                          plan.commission_system_fee,
                          plan.commission_system_fee_type,
                        )}
                      </div>
                      <div>
                        Other{' '}
                        {formatPlanFee(
                          plan.commission_other_fee,
                          plan.commission_other_fee_type,
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">{plan.merchants_count}</td>
                    <td className="py-3.5 pr-4">
                      <div className="flex flex-wrap gap-1.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
                            plan.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-secondary text-muted-foreground',
                          )}
                        >
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {plan.is_default ? (
                          <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-primary">
                            Default
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(plan)
                            setError('')
                            setSuccess('')
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
                        >
                          <Pencil className="size-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            void (async () => {
                              const ok = await dialog.confirm({
                                title: 'Delete plan',
                                message: `Delete plan “${plan.name}”? Merchants on this plan must be reassigned first.`,
                                confirmLabel: 'Delete',
                                cancelLabel: 'Cancel',
                                tone: 'danger',
                              })
                              if (ok) deleteMutation.mutate(plan.uuid)
                            })()
                          }}
                          className="inline-flex size-8 items-center justify-center rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

function formatPlanFee(value: number | undefined, type: CommissionType | undefined) {
  const amount = Number(value) || 0
  return type === 'fixed' ? `₱${amount.toFixed(2)}` : `${amount}%`
}

function planFeeExampleTotal(
  tax: number,
  taxType: CommissionType,
  systemFee: number,
  systemType: CommissionType,
  otherFee: number,
  otherType: CommissionType,
  baseAmount: number,
) {
  const calc = (value: number, type: CommissionType) =>
    type === 'percentage' ? (baseAmount * value) / 100 : value

  return (
    calc(tax, taxType) + calc(systemFee, systemType) + calc(otherFee, otherType)
  )
}

function PlanFeeRow({
  label,
  value,
  type,
  onValueChange,
  onTypeChange,
}: {
  label: string
  value: string
  type: CommissionType
  onValueChange: (value: string) => void
  onTypeChange: (type: CommissionType) => void
}) {
  return (
    <div className="rounded-2xl border border-border bg-[#fcfaff] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <div className="inline-flex rounded-xl border border-border bg-white p-1">
          <button
            type="button"
            onClick={() => onTypeChange('fixed')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              type === 'fixed'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-primary',
            )}
          >
            Fixed ₱
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('percentage')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
              type === 'percentage'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-primary',
            )}
          >
            Percentage %
          </button>
        </div>
      </div>
      <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {type === 'fixed' ? `${label} amount (₱)` : `${label} rate (%)`}
      </label>
      <input
        type="number"
        min={0}
        max={type === 'percentage' ? 100 : undefined}
        step="0.01"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}

export default function SuperAdminSettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('payment-methods')

  const content = useMemo(() => {
    switch (tab) {
      case 'payment-methods':
        return <PaymentMethodsTab />
      case 'rates':
        return <RatesSettingsTab />
      case 'plans':
        return <PlanSettingsTab />
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
