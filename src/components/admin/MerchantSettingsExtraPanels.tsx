import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { LoaderCircle, Lock } from 'lucide-react'
import { settingsService } from '@/services/settingsService'
import type {
  MerchantCommissionView,
  MerchantCustomRate,
  MerchantPaymentGatewaySettings,
  MerchantPaymentMethodItem,
  MerchantRatesSettings,
} from '@/types/settings'
import { cn } from '@/lib/utils'

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

function feeLabel(amount: number, type: string) {
  return type === 'fixed' ? `₱${amount.toFixed(2)}` : `${amount}%`
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
        disabled && 'cursor-not-allowed opacity-50',
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

export function MerchantCommissionsPanel({
  commissions,
}: {
  commissions: MerchantCommissionView
}) {
  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <Lock className="mt-0.5 size-4 shrink-0" />
          <p>{commissions.note}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Tax',
            value: commissions.tax,
            type: commissions.tax_type,
          },
          {
            label: 'System fee',
            value: commissions.system_fee,
            type: commissions.system_fee_type,
          },
          {
            label: 'Other fee',
            value: commissions.other_fee,
            type: commissions.other_fee_type,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-border bg-[#fcfaff] p-4"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-2 text-xl font-bold text-foreground">
              {feeLabel(item.value, item.type)}
            </p>
            <p className="mt-1 text-xs capitalize text-muted-foreground">
              {item.type}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MerchantPaymentGatewayPanel({
  gateway,
  onSaved,
}: {
  gateway: MerchantPaymentGatewaySettings
  onSaved: () => Promise<void>
}) {
  const [provider, setProvider] = useState<'paymongo' | 'paypal'>('paymongo')
  const [paymongoEnabled, setPaymongoEnabled] = useState(gateway.paymongo.enabled)
  const [paypalEnabled, setPaypalEnabled] = useState(gateway.paypal.enabled)
  const [publicKey, setPublicKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [paypalClientId, setPaypalClientId] = useState('')
  const [paypalClientSecret, setPaypalClientSecret] = useState('')
  const [paypalMode, setPaypalMode] = useState<'sandbox' | 'live'>(
    gateway.paypal.mode ?? 'sandbox',
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setPaymongoEnabled(gateway.paymongo.enabled)
    setPaypalEnabled(gateway.paypal.enabled)
    setPaypalMode(gateway.paypal.mode ?? 'sandbox')
    setPublicKey(gateway.paymongo.public_key ?? '')
    setSecretKey(gateway.paymongo.secret_key ?? '')
    setWebhookSecret(gateway.paymongo.webhook_secret ?? '')
    setPaypalClientId(gateway.paypal.client_id ?? '')
    setPaypalClientSecret(gateway.paypal.client_secret ?? '')
  }, [gateway])

  const saveMutation = useMutation({
    mutationFn: () =>
      settingsService.updatePaymentGateway(
        provider === 'paymongo'
          ? {
              provider: 'paymongo',
              enabled: paymongoEnabled,
              paymongo_public_key: publicKey.trim(),
              paymongo_secret_key: secretKey.trim(),
              paymongo_webhook_secret: webhookSecret.trim(),
            }
          : {
              provider: 'paypal',
              enabled: paypalEnabled,
              paypal_client_id: paypalClientId.trim(),
              paypal_client_secret: paypalClientSecret.trim(),
              paypal_mode: paypalMode,
            },
      ),
    onSuccess: async (data) => {
      setError('')
      setSuccess(data.message || 'Payment gateway settings saved.')
      const next = data.payment_gateway
      if (next) {
        setPublicKey(next.paymongo.public_key ?? '')
        setSecretKey(next.paymongo.secret_key ?? '')
        setWebhookSecret(next.paymongo.webhook_secret ?? '')
        setPaypalClientId(next.paypal.client_id ?? '')
        setPaypalClientSecret(next.paypal.client_secret ?? '')
        setPaymongoEnabled(next.paymongo.enabled)
        setPaypalEnabled(next.paypal.enabled)
        setPaypalMode(next.paypal.mode ?? 'sandbox')
      }
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to save payment gateway settings.'))
    },
  })

  const clearMutation = useMutation({
    mutationFn: () =>
      settingsService.updatePaymentGateway({
        provider,
        clear: true,
      }),
    onSuccess: async (data) => {
      setError('')
      setSuccess(data.message || 'Gateway disconnected.')
      if (provider === 'paymongo') {
        setPublicKey('')
        setSecretKey('')
        setWebhookSecret('')
        setPaymongoEnabled(false)
      } else {
        setPaypalClientId('')
        setPaypalClientSecret('')
        setPaypalEnabled(false)
      }
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to disconnect gateway.'))
    },
  })

  const busy = saveMutation.isPending || clearMutation.isPending
  const active = provider === 'paymongo' ? gateway.paymongo : gateway.paypal

  return (
    <div className="mt-6 space-y-6">
      <div className="rounded-xl border border-border bg-[#fcfaff] px-4 py-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Your payment gateway</p>
        <p className="mt-1">{gateway.note}</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Select gateway</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                id: 'paymongo' as const,
                title: 'PayMongo',
                desc: 'Cards, QR Ph, GCash, Maya, and more.',
                ready: gateway.paymongo.ready,
              },
              {
                id: 'paypal' as const,
                title: 'PayPal',
                desc: 'Collect payments with your PayPal business account.',
                ready: gateway.paypal.ready,
              },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={busy}
              onClick={() => setProvider(option.id)}
              className={cn(
                'rounded-xl border px-4 py-3 text-left transition',
                provider === option.id
                  ? 'border-primary bg-secondary/60 ring-2 ring-primary/20'
                  : 'border-border bg-white hover:border-primary/40',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{option.title}</p>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    option.ready
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {option.ready ? 'Ready' : 'Not set'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{option.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {provider === 'paymongo' ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">PayMongo credentials</h3>
              <p className="text-xs text-muted-foreground">
                Saved keys stay in the fields below. Edit them anytime, then save.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">Enable PayMongo</span>
              <Toggle checked={paymongoEnabled} onChange={setPaymongoEnabled} disabled={busy} />
            </div>
          </div>

          <div className="grid gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Public key
              </span>
              <input
                type="password"
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                placeholder="pk_test_… or pk_live_…"
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Secret key
              </span>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="sk_test_… or sk_live_…"
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Webhook secret (optional)
              </span>
              <input
                type="password"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder="whsec_…"
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          </div>
        </section>
      ) : (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-foreground">PayPal credentials</h3>
              <p className="text-xs text-muted-foreground">
                Saved credentials stay in the fields below. Edit them anytime, then save.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground">Enable PayPal</span>
              <Toggle checked={paypalEnabled} onChange={setPaypalEnabled} disabled={busy} />
            </div>
          </div>

          <div className="grid gap-3">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Client ID
              </span>
              <input
                type="password"
                value={paypalClientId}
                onChange={(e) => setPaypalClientId(e.target.value)}
                placeholder="PayPal client ID"
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Client secret
              </span>
              <input
                type="password"
                value={paypalClientSecret}
                onChange={(e) => setPaypalClientSecret(e.target.value)}
                placeholder="PayPal client secret"
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <div className="flex gap-2">
              {(['sandbox', 'live'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  disabled={busy}
                  onClick={() => setPaypalMode(mode)}
                  className={cn(
                    'rounded-xl border px-3 py-2 text-sm font-medium capitalize',
                    paypalMode === mode
                      ? 'border-primary bg-secondary text-primary'
                      : 'border-border bg-white text-muted-foreground',
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={cn(
            'rounded-full px-2.5 py-1 font-medium',
            active.connected
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {active.connected ? 'Connected' : 'Not connected'}
        </span>
        {provider === 'paymongo' && gateway.paymongo.env ? (
          <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-primary">
            {gateway.paymongo.env === 'live' ? 'Live' : 'Test'} mode
          </span>
        ) : null}
        {provider === 'paypal' && gateway.paypal.mode ? (
          <span className="rounded-full bg-secondary px-2.5 py-1 font-medium text-primary capitalize">
            {gateway.paypal.mode}
          </span>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setSuccess('')
            saveMutation.mutate()
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
        >
          {saveMutation.isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          Save {provider === 'paymongo' ? 'PayMongo' : 'PayPal'}
        </button>

        {active.connected ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setSuccess('')
              clearMutation.mutate()
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/50 disabled:opacity-70"
          >
            {clearMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            Disconnect
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function MerchantPaymentMethodsPanel({
  methods,
  platformChannelsEnabled = true,
  canManageChannels = true,
  onSaved,
}: {
  methods: MerchantPaymentMethodItem[]
  platformChannelsEnabled?: boolean
  canManageChannels?: boolean
  onSaved: () => Promise<void>
}) {
  const [items, setItems] = useState(methods)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setItems(methods)
  }, [methods])

  const saveMutation = useMutation({
    mutationFn: () =>
      settingsService.updatePaymentMethods({
        payment_methods: items.map((item) => ({
          name: item.name,
          value: item.value,
        })),
      }),
    onSuccess: async (data) => {
      setError('')
      setSuccess(data.message || 'Payment methods updated.')
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to update payment methods.'))
    },
  })

  const toggleAdminMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      settingsService.updatePaymentMethods({
        platform_channels_enabled: enabled,
      }),
    onSuccess: async (data) => {
      setError('')
      setSuccess(data.message || 'Admin channels updated.')
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to update admin channels.'))
    },
  })

  const busy = saveMutation.isPending || toggleAdminMutation.isPending
  const togglesLocked = !canManageChannels || busy

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-[#fcfaff] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Admin payment channels</p>
          <p className="text-xs text-muted-foreground">
            {platformChannelsEnabled
              ? 'Admin channels are available. Enable only the methods you want for checkout.'
              : 'Admin channels are disabled. Enable channels below for your own gateway, or turn admin channels back on.'}
          </p>
        </div>
        <button
          type="button"
          disabled={busy || !canManageChannels}
          onClick={() => {
            setSuccess('')
            toggleAdminMutation.mutate(!platformChannelsEnabled)
          }}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold disabled:opacity-70',
            platformChannelsEnabled
              ? 'border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
              : 'bg-primary text-primary-foreground hover:bg-[#3f1860]',
          )}
        >
          {toggleAdminMutation.isPending ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          {platformChannelsEnabled ? 'Disable all channels' : 'Enable admin channels'}
        </button>
      </div>

      {!canManageChannels ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Payment methods stay off until you choose a plan and complete plan
          payment. After that you can enable the admin channels you need.
        </div>
      ) : !platformChannelsEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Admin channels are off. Connect PayMongo or PayPal under Payment Gateway, then turn on
          the channels you want for checkout.
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          All methods start disabled. Turn on the ones you want for checkout, then save.
          Methods disabled by LPay admin stay locked.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((method) => (
          <div
            key={method.name}
            className={cn(
              'flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3',
              method.locked || !canManageChannels ? 'bg-muted/40' : 'bg-white',
            )}
          >
            <div>
              <p className="text-sm font-semibold text-foreground">{method.label}</p>
              <p className="text-xs text-muted-foreground">
                {!canManageChannels
                  ? 'Available after plan payment'
                  : method.locked
                    ? 'Disabled by admin'
                    : method.value
                      ? platformChannelsEnabled
                        ? 'Enabled for checkout'
                        : 'Enabled on your gateway'
                      : 'Disabled'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {method.locked || !canManageChannels ? (
                <Lock className="size-3.5 text-muted-foreground" />
              ) : null}
              <Toggle
                checked={method.value}
                disabled={method.locked || togglesLocked}
                onChange={(value) =>
                  setItems((current) =>
                    current.map((item) =>
                      item.name === method.name ? { ...item, value } : item,
                    ),
                  )
                }
              />
            </div>
          </div>
        ))}
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
        disabled={busy || !canManageChannels || !platformChannelsEnabled}
        onClick={() => {
          setSuccess('')
          saveMutation.mutate()
        }}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
      >
        {saveMutation.isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : null}
        Save payment methods
      </button>
    </div>
  )
}

const PLATFORM_RATE_ROWS: Array<{ key: string; label: string }> = [
  { key: 'qrph', label: 'QR Ph' },
  { key: 'card', label: 'Card' },
  { key: 'gcash', label: 'GCash' },
  { key: 'grab_pay', label: 'Grab Pay' },
  { key: 'shopee_pay', label: 'Shopee Pay' },
  { key: 'billease', label: 'Billease' },
  { key: 'paymaya', label: 'PayMaya' },
  { key: 'brankas', label: 'Brankas' },
  { key: 'dob', label: 'Direct Online Banking' },
]

export function MerchantRatesPanel({
  rates,
  onSaved,
}: {
  rates: MerchantRatesSettings
  onSaved: () => Promise<void>
}) {
  const [rows, setRows] = useState<MerchantCustomRate[]>(rates.merchant_rates)
  const [useCustom, setUseCustom] = useState(Boolean(rates.use_custom_rates))
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    setRows(rates.merchant_rates)
    setUseCustom(Boolean(rates.use_custom_rates))
  }, [rates])

  const displayRows = useMemo(() => {
    if (rows.length > 0) return rows
    return PLATFORM_RATE_ROWS.map((row) => ({
      name: row.key,
      label: row.label,
      admin_rate: 0,
      admin_rate_label: '0%',
      additional: 0,
      total_rate: 0,
      total_rate_label: '0%',
    }))
  }, [rows])

  const saveMutation = useMutation({
    mutationFn: () =>
      settingsService.updateMerchantRates({
        merchant_rates: displayRows.map((row) => ({
          ...row,
          additional: row.additional,
          amount: row.additional,
        })),
        use_custom_rates: useCustom,
      }),
    onSuccess: async (data) => {
      setError('')
      setSuccess('Additional rates saved for your customers.')
      setRows(data.merchant_rates)
      await onSaved()
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to save additional rates.'))
    },
  })

  return (
    <div className="mt-6 space-y-6">
      <div className="flex items-start gap-2 rounded-xl border border-border bg-[#fcfaff] px-4 py-3 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>
          Admin rates are locked. Add your own additional % on top of the admin
          rate — the total is what applies to your customers.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Rates for your customers
            </h3>
            <p className="text-xs text-muted-foreground">
              Admin rate + your additional rate = total charged to customers.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              Apply my additional rates
            </span>
            <Toggle checked={useCustom} onChange={setUseCustom} />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-2.5">Channel</th>
                <th className="px-3 py-2.5">Admin rate</th>
                <th className="px-3 py-2.5">Your additional (%)</th>
                <th className="px-3 py-2.5">Total for customers</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => {
                const total = Number(
                  (Number(row.admin_rate || 0) + Number(row.additional || 0)).toFixed(4),
                )
                return (
                  <tr
                    key={row.name}
                    className="border-b border-border/70 last:border-0"
                  >
                    <td className="px-3 py-3 font-medium text-foreground">
                      {row.label}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{row.admin_rate_label}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Lock className="size-2.5" />
                          Locked
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="relative max-w-[140px]">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          disabled={!useCustom || saveMutation.isPending}
                          value={row.additional}
                          onChange={(e) => {
                            const additional = Number(e.target.value)
                            setRows((current) =>
                              current.map((item) =>
                                item.name === row.name
                                  ? {
                                      ...item,
                                      additional: Number.isFinite(additional)
                                        ? additional
                                        : 0,
                                    }
                                  : item,
                              ),
                            )
                          }}
                          className="w-full rounded-xl border border-border bg-white px-3 py-2.5 pr-8 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted/40 disabled:text-muted-foreground"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          %
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-semibold text-foreground">
                      {useCustom ? `${total}%` : row.admin_rate_label}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
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
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
      >
        {saveMutation.isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : null}
        Save rates
      </button>
    </div>
  )
}

