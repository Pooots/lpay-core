import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Banknote,
  CircleDollarSign,
  Clock3,
  Eye,
  LoaderCircle,
  Store,
  Wallet,
  X,
} from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import { TablePagination } from '@/components/ui/TablePagination'
import { accountingService } from '@/services/accountingService'
import type {
  AccountingPayout,
  AccountingTransaction,
} from '@/types/accounting'
import { paginateArray } from '@/types/pagination'
import { cn } from '@/lib/utils'

function useClientPage<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [items])

  return {
    ...paginateArray(items, page, pageSize),
    setPage,
  }
}

export default function AccountingPage() {
  const queryClient = useQueryClient()
  const [selectedPayout, setSelectedPayout] = useState<AccountingPayout | null>(
    null,
  )
  const [selectedTx, setSelectedTx] = useState<AccountingTransaction | null>(
    null,
  )
  const [payoutError, setPayoutError] = useState('')
  const [payoutSuccess, setPayoutSuccess] = useState('')

  const accountingQuery = useQuery({
    queryKey: ['merchant-accounting'],
    queryFn: () => accountingService.get(),
  })

  const summary = accountingQuery.data?.summary
  const gateway = accountingQuery.data?.gateway
  const mode = gateway?.mode ?? 'lpay'
  const payoutsApplicable = gateway?.payouts_applicable ?? true
  const isMerchantGatewayOnly = mode === 'merchant_gateway'
  const isDual = mode === 'dual'

  const availableTransactions = useMemo(
    () => accountingQuery.data?.available_transactions ?? [],
    [accountingQuery.data],
  )
  const pendingTransactions = useMemo(
    () => accountingQuery.data?.pending_transactions ?? [],
    [accountingQuery.data],
  )
  const merchantDirectTransactions = useMemo(
    () => accountingQuery.data?.merchant_direct_transactions ?? [],
    [accountingQuery.data],
  )
  const pendingPayouts = useMemo(
    () => accountingQuery.data?.pending_payouts ?? [],
    [accountingQuery.data],
  )
  const releasedPayouts = useMemo(
    () => accountingQuery.data?.released_payouts ?? [],
    [accountingQuery.data],
  )

  const availablePage = useClientPage(availableTransactions)
  const merchantDirectPage = useClientPage(merchantDirectTransactions)
  const releasedPage = useClientPage(releasedPayouts)

  const pendingItems = useMemo(
    () => [
      ...pendingTransactions.map((tx) => ({
        kind: 'tx' as const,
        key: tx.uuid,
        tx,
      })),
      ...pendingPayouts.map((payout) => ({
        kind: 'payout' as const,
        key: payout.uuid,
        payout,
      })),
    ],
    [pendingTransactions, pendingPayouts],
  )
  const pendingPage = useClientPage(pendingItems)

  const payoutMutation = useMutation({
    mutationFn: () => accountingService.requestPayout(),
    onSuccess: async (payout) => {
      setPayoutError('')
      setPayoutSuccess(
        `Payout requested. Reference: ${payout.reference_number}. Waiting for admin approval.`,
      )
      setSelectedPayout(null)
      await queryClient.invalidateQueries({ queryKey: ['merchant-accounting'] })
    },
    onError: (error) => {
      setPayoutSuccess('')
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
      setPayoutError(message ?? 'Unable to request payout.')
    },
  })

  const canRequestPayout =
    payoutsApplicable &&
    (summary?.available ?? 0) > 0 &&
    !payoutMutation.isPending

  return (
    <MerchantShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Accounting
          </h1>
          {isMerchantGatewayOnly ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                Your own payment gateway is active. Customer payments go
                directly to your connected PayMongo/PayPal account — no LPay
                payout request is needed.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Manual / over-the-counter collections are also listed here as
                merchant-received funds.
              </p>
            </>
          ) : isDual ? (
            <>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                You accept both <span className="font-semibold text-primary">LPay</span> and{' '}
                <span className="font-semibold text-primary">Merchant</span> checkout.
                LPay collections follow settlement and payout. Merchant-gateway
                payments settle directly in your account.
                {accountingQuery.data?.settlement_frequency_label ? (
                  <>
                    {' '}
                    · LPay frequency:{' '}
                    <span className="font-semibold text-primary">
                      {accountingQuery.data.settlement_frequency_label}
                    </span>
                  </>
                ) : null}
              </p>
              {accountingQuery.data?.settlement_frequency_description ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {accountingQuery.data.settlement_frequency_description}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                New LPay collections start in Pending, move to Available by your
                settlement frequency, then you request payout for admin approval
                {accountingQuery.data?.settlement_frequency_label ? (
                  <>
                    {' '}
                    · Frequency:{' '}
                    <span className="font-semibold text-primary">
                      {accountingQuery.data.settlement_frequency_label}
                    </span>
                  </>
                ) : null}
              </p>
              {accountingQuery.data?.settlement_frequency_description ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {accountingQuery.data.settlement_frequency_description}
                </p>
              ) : null}
            </>
          )}
        </div>

        {payoutSuccess ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {payoutSuccess}
          </div>
        ) : null}
        {payoutError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {payoutError}
          </div>
        ) : null}

        {isMerchantGatewayOnly ? (
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-primary/20 bg-secondary p-4 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.3)] sm:col-span-1">
              <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-white/80 text-primary">
                <Store className="size-4" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Collected (direct)
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {summary?.merchant_direct_label ?? '₱0.00'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary?.merchant_direct_count ?? 0} payments received in your
                gateway / OTC
              </p>
              <p className="mt-4 rounded-xl border border-primary/15 bg-white/70 px-3 py-2 text-xs text-muted-foreground">
                Funds settle in your merchant payment account. Request Payout is
                not used for this mode.
              </p>
            </div>
            <SummaryCard
              label="Settlement"
              value="Direct"
              hint="No LPay holding · money goes to your gateway"
              icon={CircleDollarSign}
            />
          </section>
        ) : (
          <section
            className={cn(
              'grid gap-3',
              isDual ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-3',
            )}
          >
            <div className="rounded-2xl border border-primary/20 bg-secondary p-4 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.3)]">
              <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-white/80 text-primary">
                <Wallet className="size-4" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {isDual ? 'LPay Available' : 'Available'}
              </p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {summary?.available_label ?? '₱0.00'}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary?.available_count ?? 0} ready for payout request
              </p>
              <button
                type="button"
                disabled={!canRequestPayout}
                onClick={() => {
                  setPayoutError('')
                  setPayoutSuccess('')
                  payoutMutation.mutate()
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {payoutMutation.isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Requesting…
                  </>
                ) : (
                  <>
                    <Banknote className="size-4" />
                    Request Payout
                  </>
                )}
              </button>
            </div>

            <SummaryCard
              label={isDual ? 'LPay Pending' : 'Pending'}
              value={summary?.pending_label ?? '₱0.00'}
              hint={`${summary?.clearing_count ?? 0} awaiting frequency · ${summary?.request_count ?? 0} with admin`}
              icon={Clock3}
            />
            <SummaryCard
              label="Released"
              value={summary?.paid_out_label ?? '₱0.00'}
              hint={`${summary?.paid_out_count ?? 0} released by admin`}
              icon={CircleDollarSign}
            />
            {isDual ? (
              <SummaryCard
                label="Merchant direct"
                value={summary?.merchant_direct_label ?? '₱0.00'}
                hint={`${summary?.merchant_direct_count ?? 0} paid to your gateway / OTC`}
                icon={Store}
              />
            ) : null}
          </section>
        )}

        {accountingQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white py-16 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading accounting…
          </div>
        ) : accountingQuery.isError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
            Unable to load accounting. Please refresh and try again.
          </div>
        ) : isMerchantGatewayOnly ? (
          <ListingSection
            title="Direct collections"
            subtitle="Payments settled in your merchant gateway or received over the counter"
            emptyTitle="No direct collections yet"
            emptyHint="When customers pay through your gateway or OTC, they appear here."
            isEmpty={merchantDirectTransactions.length === 0}
            footer={
              <TablePagination
                meta={merchantDirectPage.meta}
                onPageChange={merchantDirectPage.setPage}
                label="transactions"
              />
            }
          >
            {merchantDirectPage.data.map((tx) => (
              <PendingTxRow
                key={tx.uuid}
                transaction={tx}
                onView={() => setSelectedTx(tx)}
              />
            ))}
          </ListingSection>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <ListingSection
              title={isDual ? 'LPay Available' : 'Available'}
              subtitle="Cleared by frequency — request payout when ready"
              emptyTitle="No available balance"
              emptyHint="LPay transactions appear here after your settlement frequency period."
              isEmpty={availableTransactions.length === 0}
              footer={
                <TablePagination
                  meta={availablePage.meta}
                  onPageChange={availablePage.setPage}
                  label="transactions"
                />
              }
            >
              {availablePage.data.map((tx) => (
                <PendingTxRow
                  key={tx.uuid}
                  transaction={tx}
                  onView={() => setSelectedTx(tx)}
                />
              ))}
            </ListingSection>

            <ListingSection
              title={isDual ? 'LPay Pending' : 'Pending'}
              subtitle="Awaiting frequency clearance or admin action"
              emptyTitle="No pending items"
              emptyHint="New LPay customer payments start here until frequency clears them."
              isEmpty={
                pendingTransactions.length === 0 && pendingPayouts.length === 0
              }
              footer={
                <TablePagination
                  meta={pendingPage.meta}
                  onPageChange={pendingPage.setPage}
                  label="items"
                />
              }
            >
              {pendingPage.data.map((row) =>
                row.kind === 'tx' ? (
                  <PendingTxRow
                    key={row.key}
                    transaction={row.tx}
                    showAvailableOn
                    onView={() => setSelectedTx(row.tx)}
                  />
                ) : (
                  <PayoutRow
                    key={row.key}
                    payout={row.payout}
                    onView={() => setSelectedPayout(row.payout)}
                  />
                ),
              )}
            </ListingSection>

            {isDual ? (
              <ListingSection
                title="Merchant direct"
                subtitle="Paid to your gateway or OTC — not included in LPay payout"
                emptyTitle="No merchant-gateway collections"
                emptyHint="Checkout payments via Merchant gateway and manual OTC payments show here."
                isEmpty={merchantDirectTransactions.length === 0}
                footer={
                  <TablePagination
                    meta={merchantDirectPage.meta}
                    onPageChange={merchantDirectPage.setPage}
                    label="transactions"
                  />
                }
              >
                {merchantDirectPage.data.map((tx) => (
                  <PendingTxRow
                    key={tx.uuid}
                    transaction={tx}
                    onView={() => setSelectedTx(tx)}
                  />
                ))}
              </ListingSection>
            ) : null}

            <ListingSection
              title="Released"
              subtitle="Approved and released by LPay admin"
              emptyTitle="No released payouts yet"
              emptyHint="After admin releases a payout, it appears here."
              isEmpty={releasedPayouts.length === 0}
              className={isDual ? undefined : 'lg:col-span-2'}
              footer={
                <TablePagination
                  meta={releasedPage.meta}
                  onPageChange={releasedPage.setPage}
                  label="payouts"
                />
              }
            >
              {releasedPage.data.map((payout) => (
                <PayoutRow
                  key={payout.uuid}
                  payout={payout}
                  onView={() => setSelectedPayout(payout)}
                />
              ))}
            </ListingSection>
          </div>
        )}
      </div>

      {selectedPayout ? (
        <PayoutTransactionsModal
          payout={selectedPayout}
          onClose={() => setSelectedPayout(null)}
        />
      ) : null}

      {selectedTx ? (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      ) : null}
    </MerchantShell>
  )
}

function SummaryCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: string
  hint: string
  icon: typeof Clock3
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_8px_24px_-20px_rgb(75_29_110_/_0.3)]">
      <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
        <Icon className="size-4" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}

function ListingSection({
  title,
  subtitle,
  emptyTitle,
  emptyHint,
  isEmpty,
  children,
  className,
  footer,
}: {
  title: string
  subtitle: string
  emptyTitle: string
  emptyHint: string
  isEmpty: boolean
  children: ReactNode
  className?: string
  footer?: ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6',
        className,
      )}
    >
      <div className="mb-4">
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-border bg-[#fcfaff] px-4 py-10 text-center">
          <p className="font-medium text-foreground">{emptyTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{emptyHint}</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">{children}</div>
          {footer}
        </>
      )}
    </section>
  )
}

function PendingTxRow({
  transaction,
  onView,
  showAvailableOn = false,
}: {
  transaction: AccountingTransaction
  onView: () => void
  showAvailableOn?: boolean
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">
          {transaction.customer_name || 'Customer'}
        </p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-gold-foreground">
          {transaction.reference_number}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {showAvailableOn && transaction.available_label
            ? `Available ${transaction.available_label}`
            : transaction.payout_status_label}
          {transaction.gateway_account_label
            ? ` · ${transaction.gateway_account_label}`
            : ''}
        </p>
      </div>
      <p className="shrink-0 font-semibold text-foreground">
        {transaction.amount_label}
      </p>
      <button
        type="button"
        onClick={onView}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary"
      >
        <Eye className="size-3.5" />
        View
      </button>
    </div>
  )
}

function PayoutRow({
  payout,
  onView,
}: {
  payout: AccountingPayout
  onView: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">
          Payout · {payout.payment_count} transaction
          {payout.payment_count === 1 ? '' : 's'}
        </p>
        <p className="mt-0.5 truncate font-mono text-[11px] text-gold-foreground">
          {payout.reference_number}
        </p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {payout.status_label}
          {payout.requested_label ? ` · ${payout.requested_label}` : ''}
        </p>
      </div>
      <p className="shrink-0 font-semibold text-foreground">
        {payout.amount_label}
      </p>
      <button
        type="button"
        onClick={onView}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary"
      >
        <Eye className="size-3.5" />
        View
      </button>
    </div>
  )
}

function PayoutTransactionsModal({
  payout,
  onClose,
}: {
  payout: AccountingPayout
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Payout transactions
            </h2>
            <p className="mt-1.5 font-mono text-xs font-semibold tracking-wide text-gold-foreground">
              {payout.reference_number}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                {payout.status_label}
              </span>
              <span>{payout.amount_label}</span>
              <span aria-hidden>·</span>
              <span>
                {payout.payment_count} transaction
                {payout.payment_count === 1 ? '' : 's'}
              </span>
              {payout.requested_label ? (
                <>
                  <span aria-hidden>·</span>
                  <span>Requested {payout.requested_label}</span>
                </>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-primary"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4 sm:px-8 sm:py-5">
          {payout.transactions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-[#fcfaff] px-4 py-12 text-center text-sm text-muted-foreground">
              No transactions in this payout.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#fcfaff] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Reference</th>
                    <th className="px-4 py-3.5">Bill</th>
                    <th className="px-4 py-3.5">Account</th>
                    <th className="px-4 py-3.5">Paid on</th>
                    <th className="px-4 py-3.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payout.transactions.map((tx) => (
                    <tr
                      key={tx.uuid}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="px-4 py-3.5 font-medium text-foreground">
                        {tx.customer_name || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs font-semibold text-gold-foreground">
                          {tx.reference_number}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {tx.bill_title || '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-xs text-muted-foreground">
                          {tx.account_number}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">
                        {tx.paid_label || tx.paid_date_label || '—'}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-foreground">
                        {tx.amount_label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TransactionDetailModal({
  transaction,
  onClose,
}: {
  transaction: AccountingTransaction
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)] sm:p-7">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">Transaction</h2>
            <p className="mt-1 font-mono text-xs font-semibold text-gold-foreground">
              {transaction.reference_number}
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

        <dl className="space-y-3 text-sm">
          <DetailRow
            label="Customer"
            value={transaction.customer_name || '—'}
          />
          <DetailRow label="Account" value={transaction.account_number} mono />
          <DetailRow label="Bill" value={transaction.bill_title || '—'} />
          <DetailRow label="Bill No." value={transaction.bill_number} mono />
          <DetailRow label="Amount" value={transaction.amount_label} />
          <DetailRow
            label="Available on"
            value={transaction.available_label || '—'}
          />
          <DetailRow
            label="Payout status"
            value={transaction.payout_status_label}
          />
          <DetailRow label="Paid on" value={transaction.paid_label || '—'} />
        </dl>
      </div>
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid gap-1 border-b border-border/70 pb-3 last:border-0 last:pb-0 sm:grid-cols-[120px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'font-medium text-foreground',
          mono && 'font-mono text-xs text-gold-foreground',
        )}
      >
        {value}
      </dd>
    </div>
  )
}
