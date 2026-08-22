import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  ArrowLeft,
  Building2,
  Check,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
  Store,
} from 'lucide-react'
import { portalService } from '@/services/portalService'
import { computeCheckoutFees } from '@/lib/platformCommission'
import { cn } from '@/lib/utils'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const search = useSearch({ from: '/checkout' }) as {
    account?: string
    bill?: string
  }

  const accountNumber = (search.account ?? '').trim()
  const billUuid = (search.bill ?? '').trim()

  const [amountToPay, setAmountToPay] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [error, setError] = useState('')
  const [initializedAmount, setInitializedAmount] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['customer-portal', accountNumber],
    queryFn: () => portalService.lookup(accountNumber),
    enabled: Boolean(accountNumber),
    retry: false,
  })

  const bill = useMemo(() => {
    const pending = profileQuery.data?.pending_bills ?? []
    return pending.find((item) => item.uuid === billUuid) ?? null
  }, [profileQuery.data, billUuid])

  useEffect(() => {
    if (bill && !initializedAmount) {
      setAmountToPay(bill.balance.toFixed(2))
      setInitializedAmount(true)
    }
  }, [bill, initializedAmount])

  const checkoutSettings = profileQuery.data?.merchant.checkout
  const paymentOptions = checkoutSettings?.options ?? []

  useEffect(() => {
    const options = profileQuery.data?.merchant.checkout?.options
    if (!options || options.length === 0) {
      setPaymentMethod('')
      return
    }
    setPaymentMethod((current) =>
      options.some((option) => option.value === current)
        ? current
        : options[0].value,
    )
  }, [profileQuery.data?.merchant.checkout])

  const selectedOption = paymentOptions.find(
    (option) => option.value === paymentMethod,
  )
  const redirectHint =
    checkoutSettings?.redirect_hint ||
    (selectedOption?.provider === 'paypal'
      ? 'You will be redirected to PayPal to finish payment.'
      : 'You will be redirected to PayMongo’s secure checkout to finish payment.')

  const payMutation = useMutation({
    mutationFn: portalService.payBill,
    onSuccess: async (data) => {
      if (data.checkout_url || data.requires_redirect) {
        window.location.href = data.checkout_url!
        return
      }

      if (data.profile) {
        const cacheKey = ['customer-portal', accountNumber]
        queryClient.setQueryData(cacheKey, data.profile)
        await queryClient.invalidateQueries({ queryKey: cacheKey })
      }
      await queryClient.invalidateQueries({ queryKey: ['merchant-payments'] })

      void navigate({
        to: '/account',
        search: {
          account: accountNumber,
          paid: data.payment.reference_number,
        },
      })
    },
    onError: (err) => {
      const message = axios.isAxiosError(err)
        ? (err.response?.data?.message as string | undefined) ||
          (err.response?.data?.errors
            ? Object.values(err.response.data.errors as Record<string, string[]>)
                .flat()
                .join(' ')
            : undefined)
        : null
      setError(message ?? 'Unable to process payment. Please try again.')
    },
  })

  const remainingBalance = bill?.balance ?? 0
  const parsedAmount = Number(amountToPay)
  const amountValid = Number.isFinite(parsedAmount) && parsedAmount > 0
  const willCreateCredit =
    amountValid && parsedAmount > remainingBalance + 0.0001
  const willLeaveBalance =
    amountValid && parsedAmount < remainingBalance - 0.0001
  const creditPreview = willCreateCredit
    ? Number((parsedAmount - remainingBalance).toFixed(2))
    : 0
  const balanceAfterPreview = willLeaveBalance
    ? Number((remainingBalance - parsedAmount).toFixed(2))
    : willCreateCredit
      ? 0
      : amountValid
        ? 0
        : remainingBalance
  const appliedPreview = amountValid
    ? Number(Math.min(parsedAmount, remainingBalance).toFixed(2))
    : 0

  const feeBreakdown = useMemo(
    () =>
      computeCheckoutFees(
        amountValid ? parsedAmount : 0,
        profileQuery.data?.merchant.commission,
      ),
    [amountValid, parsedAmount, profileQuery.data?.merchant.commission],
  )
  const hasPlatformFees = feeBreakdown.fees_total > 0

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!bill || !accountNumber) {
      setError('Missing bill or account details.')
      return
    }

    if (!amountValid) {
      setError('Enter an amount greater than zero.')
      return
    }

    if (!paymentMethod || paymentOptions.length === 0) {
      setError('No payment method is available for this merchant.')
      return
    }

    payMutation.mutate({
      account_number: accountNumber,
      bill_uuid: bill.uuid,
      amount: Number(parsedAmount.toFixed(2)),
      payment_method: paymentMethod as
        | 'lpay'
        | 'merchant'
        | 'card'
        | 'gcash'
        | 'grab_pay'
        | 'paymaya'
        | 'qrph'
        | 'shopee_pay'
        | 'billease'
        | 'paymongo'
        | 'paypal'
        | 'wallet',
    })
  }

  const backToAccount = () => {
    void navigate({
      to: '/account',
      search: { account: accountNumber || undefined, paid: undefined },
    })
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fcfaff]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgb(75 29 110 / 0.06), transparent 55%), radial-gradient(ellipse 40% 35% at 85% 70%, rgb(201 162 39 / 0.07), transparent 50%)',
        }}
      />

      <div className="relative mx-auto max-w-3xl px-5 pb-16 pt-8 sm:px-6 sm:pt-10">
        <header className="home-rise mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="shrink-0">
              <img
                src="/lpay-logo.png"
                alt="LPay"
                className="h-auto max-h-12 w-auto object-contain"
              />
            </Link>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.22em] text-primary">
                CHECKOUT
              </p>
              <p className="text-sm text-muted-foreground">
                Review and pay your bill securely
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={backToAccount}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-border bg-white px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            <ArrowLeft className="size-4" />
            Back to profile
          </button>
        </header>

        {!accountNumber || !billUuid ? (
          <section className="rounded-3xl border border-border bg-white p-8 text-center shadow-[0_20px_50px_-28px_rgb(75_29_110_/_0.3)]">
            <h1 className="text-xl font-bold text-foreground">
              Checkout unavailable
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Open a pending bill from your account profile to continue.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
            >
              Go to home
            </Link>
          </section>
        ) : profileQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading checkout…
          </div>
        ) : profileQuery.isError || !bill ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
            <h1 className="text-xl font-bold text-rose-800">Bill not found</h1>
            <p className="mt-2 text-sm text-rose-700">
              This bill is not available for payment. It may already be paid.
            </p>
            <button
              type="button"
              onClick={backToAccount}
              className="mt-5 inline-flex rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
            >
              Back to profile
            </button>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="home-rise overflow-hidden rounded-3xl border border-border bg-white shadow-[0_20px_50px_-28px_rgb(75_29_110_/_0.3)]"
          >
            <div className="border-b border-border bg-gradient-to-r from-[#4B1D6E] to-[#6b3a8f] px-5 py-6 text-white sm:px-7">
              <div className="flex items-start gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl bg-white/15">
                  <CreditCard className="size-5 text-[#f3e6b0]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Checkout</h1>
                  <p className="mt-1 text-sm text-white/80">
                    Paying as {profileQuery.data?.customer.full_name}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-7">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="font-mono text-[11px] font-semibold tracking-wide text-gold-foreground">
                  {bill.bill_number}
                </p>
                <h2 className="mt-1 text-lg font-bold text-foreground">
                  {bill.title}
                </h2>
                {bill.description ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {bill.description}
                  </p>
                ) : null}
                <dl className="mt-4 grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Due on
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {bill.due_on_label || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Coverage
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {bill.coverage_label || '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Account
                    </dt>
                    <dd className="mt-1 font-mono text-xs font-semibold text-foreground">
                      {accountNumber}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Original amount
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {bill.amount_label}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Balance due
                    </dt>
                    <dd className="mt-1 text-base font-bold text-primary">
                      {bill.balance_label}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <label
                  htmlFor="amount-to-pay"
                  className="text-sm font-semibold text-foreground"
                >
                  Bill amount to pay
                </label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Enter how much to apply to this bill. Platform fees are added
                  automatically on checkout.
                </p>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                    ₱
                  </span>
                  <input
                    id="amount-to-pay"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={amountToPay}
                    onChange={(e) => {
                      setAmountToPay(e.target.value)
                      setError('')
                    }}
                    className={cn(
                      'w-full rounded-xl border border-border bg-white py-3 pl-8 pr-4 text-base font-semibold text-foreground outline-none transition',
                      'focus:border-primary focus:ring-2 focus:ring-primary/20',
                      !amountValid && amountToPay !== ''
                        ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
                        : '',
                    )}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Current remaining balance:{' '}
                  <span className="font-semibold text-foreground">
                    {bill.balance_label}
                  </span>
                  {bill.amount_paid > 0 ? (
                    <>
                      {' '}
                      · Already paid:{' '}
                      <span className="font-semibold text-foreground">
                        {bill.amount_paid_label}
                      </span>
                    </>
                  ) : null}
                </p>

                {amountValid ? (
                  <div className="mt-3 space-y-2 rounded-2xl border border-border bg-muted/40 p-3 text-xs">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Applied to this bill
                      </span>
                      <span className="font-semibold text-foreground">
                        ₱
                        {appliedPreview.toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">
                        Balance still to pay after this payment
                      </span>
                      <span className="font-semibold text-primary">
                        ₱
                        {balanceAfterPreview.toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {willLeaveBalance ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                        Partial payment. The bill will keep a remaining balance
                        of ₱
                        {balanceAfterPreview.toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                        , and this payment will be saved in history.
                      </p>
                    ) : null}
                    {willCreateCredit ? (
                      <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                        Excess ₱
                        {creditPreview.toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        will be saved as account credit for the next bill.
                      </p>
                    ) : null}
                    {!willLeaveBalance && !willCreateCredit ? (
                      <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                        This will fully pay the bill. Payment will be recorded
                        with a reference number.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {amountValid ? (
                  <div className="mt-3 space-y-2.5 rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 text-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                      Payment summary
                    </p>
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="text-muted-foreground">Bill amount</span>
                      <span className="font-semibold text-foreground">
                        {feeBreakdown.base_amount_label}
                      </span>
                    </div>
                    {feeBreakdown.tax > 0 ? (
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">
                          Tax
                          {feeBreakdown.tax_type === 'percentage'
                            ? ` (${feeBreakdown.tax_rate}%)`
                            : ' (fixed)'}
                        </span>
                        <span className="font-semibold text-foreground">
                          {feeBreakdown.tax_label}
                        </span>
                      </div>
                    ) : null}
                    {feeBreakdown.system_fee > 0 ? (
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">
                          System fee
                          {feeBreakdown.system_fee_type === 'percentage'
                            ? ` (${feeBreakdown.system_fee_rate}%)`
                            : ' (fixed)'}
                        </span>
                        <span className="font-semibold text-foreground">
                          {feeBreakdown.system_fee_label}
                        </span>
                      </div>
                    ) : null}
                    {feeBreakdown.other_fee > 0 ? (
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-muted-foreground">
                          Other fee
                          {feeBreakdown.other_fee_type === 'percentage'
                            ? ` (${feeBreakdown.other_fee_rate}%)`
                            : ' (fixed)'}
                        </span>
                        <span className="font-semibold text-foreground">
                          {feeBreakdown.other_fee_label}
                        </span>
                      </div>
                    ) : null}
                    {!hasPlatformFees ? (
                      <p className="text-xs text-muted-foreground">
                        No platform fees configured for this merchant.
                      </p>
                    ) : null}
                    <div className="flex items-center justify-between gap-3 border-t border-primary/15 pt-2.5">
                      <span className="font-semibold text-foreground">
                        Total to pay
                      </span>
                      <span className="text-base font-bold text-primary">
                        {feeBreakdown.total_amount_label}
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Payment method
                </p>

                {checkoutSettings?.note ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {checkoutSettings.note}
                  </p>
                ) : null}

                {paymentOptions.length > 0 ? (
                  <>
                    <div
                      className={cn(
                        'mt-3 grid gap-3',
                        paymentOptions.length > 1 ? 'sm:grid-cols-2' : 'grid-cols-1',
                      )}
                      role="radiogroup"
                      aria-label="Payment method"
                    >
                      {paymentOptions.map((option) => {
                        const selected = paymentMethod === option.value
                        const isLpay =
                          option.value === 'lpay' || option.provider === 'lpay'
                        const isMerchant =
                          option.value === 'merchant' ||
                          option.provider === 'merchant'
                        const Icon = isLpay
                          ? Building2
                          : isMerchant
                            ? Store
                            : CreditCard
                        const description = isLpay
                          ? 'Pay through LPay’s secure platform gateway.'
                          : isMerchant
                            ? 'Pay through this merchant’s own payment gateway.'
                            : redirectHint

                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={payMutation.isPending}
                            onClick={() => {
                              setPaymentMethod(option.value)
                              setError('')
                            }}
                            className={cn(
                              'rounded-2xl border px-4 py-4 text-left transition',
                              selected
                                ? 'border-primary bg-secondary/50 ring-2 ring-primary/20'
                                : 'border-border bg-white hover:border-primary/40',
                              payMutation.isPending && 'opacity-70',
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  'flex size-10 shrink-0 items-center justify-center rounded-xl',
                                  selected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground',
                                )}
                              >
                                <Icon className="size-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-bold text-foreground">
                                    {option.label}
                                  </p>
                                  <span
                                    className={cn(
                                      'flex size-5 shrink-0 items-center justify-center rounded-full border',
                                      selected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-white',
                                    )}
                                  >
                                    {selected ? (
                                      <Check className="size-3" strokeWidth={3} />
                                    ) : null}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {description}
                                </p>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {redirectHint}
                    </p>
                  </>
                ) : (
                  <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                    {checkoutSettings?.note ||
                      'No payment methods are available right now. Please contact the merchant.'}
                  </div>
                )}
              </div>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={backToAccount}
                  disabled={payMutation.isPending}
                  className="rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    payMutation.isPending ||
                    !amountValid ||
                    paymentOptions.length === 0 ||
                    !paymentMethod
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
                >
                  {payMutation.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  {amountValid
                    ? `Pay ${feeBreakdown.total_amount_label}`
                    : 'Confirm payment'}
                </button>
              </div>

              <p className="flex items-center justify-center gap-1.5 text-sm text-emerald-700">
                <ShieldCheck className="size-4 text-gold" />
                Secure checkout · encrypted payment
              </p>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
