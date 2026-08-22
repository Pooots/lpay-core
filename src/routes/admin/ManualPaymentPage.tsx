import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Banknote, Check, LoaderCircle, Search } from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import { customerService } from '@/services/customerService'
import { paymentService } from '@/services/paymentService'
import type { Customer, CustomerBillRow } from '@/types/customer'
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

export default function ManualPaymentPage() {
  const queryClient = useQueryClient()
  const [memberSearch, setMemberSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<Customer | null>(null)
  const [billUuid, setBillUuid] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(memberSearch.trim()),
      250,
    )
    return () => window.clearTimeout(timer)
  }, [memberSearch])

  const membersQuery = useQuery({
    queryKey: ['merchant-customers', debouncedSearch],
    queryFn: () => customerService.list(debouncedSearch || undefined),
  })

  const detailQuery = useQuery({
    queryKey: ['merchant-customer', selectedMember?.uuid],
    queryFn: () => customerService.get(selectedMember!.uuid),
    enabled: Boolean(selectedMember?.uuid),
  })

  const payableBills = useMemo(() => {
    const bills = detailQuery.data?.bills ?? []
    return bills.filter(
      (bill) =>
        bill.balance > 0 &&
        ['issued', 'overdue', 'partial'].includes(bill.status),
    )
  }, [detailQuery.data])

  const selectedBill = useMemo(
    () => payableBills.find((bill) => bill.uuid === billUuid) ?? null,
    [payableBills, billUuid],
  )

  useEffect(() => {
    if (!selectedBill) {
      setAmount('')
      return
    }
    setAmount(selectedBill.balance.toFixed(2))
  }, [selectedBill?.uuid])

  const recentManualQuery = useQuery({
    queryKey: ['merchant-manual-payments'],
    queryFn: () => paymentService.listManual(),
  })

  const saveMutation = useMutation({
    mutationFn: () =>
      paymentService.recordManual({
        customer_uuid: selectedMember!.uuid,
        bill_uuid: billUuid,
        amount: Number(Number(amount).toFixed(2)),
        notes: notes.trim() || undefined,
      }),
    onSuccess: async (payment) => {
      setError('')
      setSuccess(
        `Manual payment ${payment.reference_number} recorded for ${payment.customer_name}.`,
      )
      setNotes('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['merchant-manual-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['merchant-payments'] }),
        queryClient.invalidateQueries({ queryKey: ['merchant-dashboard'] }),
        queryClient.invalidateQueries({
          queryKey: ['merchant-customer', selectedMember?.uuid],
        }),
      ])
      if (selectedMember) {
        const refreshed = await customerService.get(selectedMember.uuid)
        const nextPayable = (refreshed.bills ?? []).filter(
          (bill) =>
            bill.balance > 0 &&
            ['issued', 'overdue', 'partial'].includes(bill.status),
        )
        if (nextPayable.length > 0) {
          setBillUuid(nextPayable[0].uuid)
        } else {
          setBillUuid('')
          setAmount('')
        }
      }
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to record manual payment.'))
    },
  })

  const handleSelectMember = (member: Customer) => {
    setSelectedMember(member)
    setBillUuid('')
    setAmount('')
    setError('')
    setSuccess('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!selectedMember) {
      setError('Select a member first.')
      return
    }
    if (!billUuid) {
      setError('Select a bill to apply the payment to.')
      return
    }
    const parsed = Number(amount)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }

    saveMutation.mutate()
  }

  const members = membersQuery.data ?? []
  const recent = recentManualQuery.data?.data ?? []

  return (
    <MerchantShell>
      <div className="home-rise space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Manual Payment
          </h1>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Record over-the-counter cash payments made at your merchant location.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
            <h2 className="text-sm font-bold text-foreground">Select member</h2>
            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Search name or account number..."
                className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="mt-3 max-h-[420px] space-y-2 overflow-y-auto">
              {membersQuery.isLoading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin text-primary" />
                  Loading members…
                </div>
              ) : members.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No members found.
                </p>
              ) : (
                members.map((member) => {
                  const active = selectedMember?.uuid === member.uuid
                  return (
                    <button
                      key={member.uuid}
                      type="button"
                      onClick={() => handleSelectMember(member)}
                      className={cn(
                        'w-full rounded-xl border px-3.5 py-3 text-left transition',
                        active
                          ? 'border-primary bg-secondary/60 ring-2 ring-primary/20'
                          : 'border-border bg-white hover:border-primary/40',
                      )}
                    >
                      <p className="text-sm font-semibold text-foreground">
                        {member.full_name}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                        {member.account_number}
                      </p>
                    </button>
                  )
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#f7efd4] text-gold-foreground">
                <Banknote className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Record cash payment
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Applies to the selected member’s unpaid bill.
                </p>
              </div>
            </div>

            {!selectedMember ? (
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Choose a member on the left to continue.
              </p>
            ) : detailQuery.isLoading ? (
              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin text-primary" />
                Loading bills…
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="rounded-xl border border-border bg-[#fcfaff] px-3.5 py-3 text-sm">
                  <p className="font-semibold text-foreground">
                    {selectedMember.full_name}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {selectedMember.account_number}
                  </p>
                </div>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Unpaid bill
                  </span>
                  {payableBills.length === 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
                      This member has no unpaid bills right now.
                    </div>
                  ) : (
                    <select
                      value={billUuid}
                      onChange={(e) => setBillUuid(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select a bill</option>
                      {payableBills.map((bill: CustomerBillRow) => (
                        <option key={bill.uuid} value={bill.uuid}>
                          {bill.bill_number} · {bill.title} · balance{' '}
                          {bill.balance_label}
                        </option>
                      ))}
                    </select>
                  )}
                </label>

                {selectedBill ? (
                  <div className="grid gap-2 rounded-xl border border-border px-3.5 py-3 text-xs sm:grid-cols-3">
                    <div>
                      <p className="text-muted-foreground">Bill amount</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {selectedBill.amount_label}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Already paid</p>
                      <p className="mt-0.5 font-semibold text-foreground">
                        {selectedBill.amount_paid_label}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Balance due</p>
                      <p className="mt-0.5 font-semibold text-primary">
                        {selectedBill.balance_label}
                      </p>
                    </div>
                  </div>
                ) : null}

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Amount received
                  </span>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                      ₱
                    </span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={!selectedBill}
                      className="w-full rounded-xl border border-border bg-white py-2.5 pl-8 pr-3 text-sm font-semibold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted/40"
                    />
                  </div>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Notes (optional)
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="e.g. Paid in cash at front desk"
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>

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
                  type="submit"
                  disabled={
                    saveMutation.isPending ||
                    !selectedBill ||
                    payableBills.length === 0
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
                >
                  {saveMutation.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Record manual payment
                </button>
              </form>
            )}
          </section>
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          <h2 className="text-sm font-bold text-foreground">
            Recent manual payments
          </h2>
          {recentManualQuery.isLoading ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading…
            </div>
          ) : recent.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              No over-the-counter payments recorded yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Paid on</th>
                    <th className="pb-3 pr-4">Reference</th>
                    <th className="pb-3 pr-4">Member</th>
                    <th className="pb-3 pr-4">Bill</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3">Method</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((payment) => (
                    <tr
                      key={payment.uuid}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="py-3 pr-4 text-muted-foreground">
                        {payment.paid_label || '—'}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs font-semibold text-gold-foreground">
                        {payment.reference_number}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-foreground">
                          {payment.customer_name || '—'}
                        </p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {payment.account_number}
                        </p>
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs">
                        {payment.bill_number || '—'}
                      </td>
                      <td className="py-3 pr-4 font-semibold">
                        {payment.amount_label}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {payment.payment_method_label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </MerchantShell>
  )
}
