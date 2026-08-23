import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { LoaderCircle, Plus, X } from 'lucide-react'
import { billService } from '@/services/billService'
import { customerService } from '@/services/customerService'
import { settingsService } from '@/services/settingsService'
import type { BillsSetItem } from '@/types/settings'
import type { Customer } from '@/types/customer'
import { cn } from '@/lib/utils'

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

function money(amount: number) {
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const

function buildYearOptions() {
  const current = new Date().getFullYear()
  const years: number[] = []
  for (let year = current - 2; year <= current + 3; year += 1) {
    years.push(year)
  }
  return years
}

function defaultCoverageMonth(set: BillsSetItem): string {
  const fromPreview =
    set.preview?.coverage_month ||
    set.preview?.coverage_start?.slice(0, 7) ||
    ''
  if (/^\d{4}-\d{2}$/.test(fromPreview)) return fromPreview
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function splitCoverageMonth(value: string): { year: string; month: string } {
  if (/^\d{4}-\d{2}$/.test(value)) {
    return { year: value.slice(0, 4), month: value.slice(5, 7) }
  }
  const now = new Date()
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1).padStart(2, '0'),
  }
}

export function BillSetPickerModal({
  open,
  onClose,
  onSelectManual,
  onSelectFixed,
  onSelectVariable,
  runningFixedUuid,
}: {
  open: boolean
  onClose: () => void
  onSelectManual: () => void
  onSelectFixed: (
    set: BillsSetItem,
    title: string,
    coverageMonth: string,
  ) => void
  onSelectVariable: (
    set: BillsSetItem,
    title: string,
    coverageMonth: string,
  ) => void
  runningFixedUuid: string | null
}) {
  const settingsQuery = useQuery({
    queryKey: ['merchant-settings'],
    queryFn: () => settingsService.get(),
    enabled: open,
  })

  const [titlePrompt, setTitlePrompt] = useState<{
    set: BillsSetItem
    mode: 'fixed' | 'variable'
  } | null>(null)
  const [billTitle, setBillTitle] = useState('')
  const [coverageMonth, setCoverageMonth] = useState('')
  const [titleError, setTitleError] = useState('')

  const selectedPeriod = useMemo(
    () => splitCoverageMonth(coverageMonth),
    [coverageMonth],
  )

  const yearOptions = useMemo(() => {
    const years = buildYearOptions()
    const selectedYear = Number(selectedPeriod.year)
    if (Number.isFinite(selectedYear) && !years.includes(selectedYear)) {
      return [...years, selectedYear].sort((a, b) => a - b)
    }
    return years
  }, [selectedPeriod.year])

  const billSets = useMemo(() => {
    return (settingsQuery.data?.bills_sets ?? []).filter((set) => set.is_active)
  }, [settingsQuery.data?.bills_sets])

  const fixedSets = billSets.filter((set) => set.amount_mode === 'fixed')
  const variableSets = billSets.filter((set) => set.amount_mode === 'variable')

  const periodQuery = useQuery({
    queryKey: [
      'bill-set-period-preview',
      titlePrompt?.set.uuid,
      coverageMonth,
    ],
    queryFn: () =>
      billService.periodPreview(titlePrompt!.set.uuid, coverageMonth),
    enabled: Boolean(titlePrompt?.set.uuid && coverageMonth),
  })

  useEffect(() => {
    if (!open) {
      setTitlePrompt(null)
      setBillTitle('')
      setCoverageMonth('')
      setTitleError('')
    }
  }, [open])

  useEffect(() => {
    if (!periodQuery.data?.preview) return
    setBillTitle(periodQuery.data.preview.title)
    if (periodQuery.data.already_billed) {
      setTitleError(
        periodQuery.data.message ??
          `Already billed for ${periodQuery.data.preview.coverage_period_label}.`,
      )
    } else {
      setTitleError('')
    }
  }, [periodQuery.data])

  const openTitlePrompt = (set: BillsSetItem, mode: 'fixed' | 'variable') => {
    setTitlePrompt({ set, mode })
    setCoverageMonth(defaultCoverageMonth(set))
    setBillTitle(set.preview?.title ?? set.title)
    setTitleError('')
  }

  const handleTitleProceed = () => {
    if (!titlePrompt) return
    const nextTitle = billTitle.trim()
    if (!nextTitle) {
      setTitleError('Title is required.')
      return
    }
    if (!coverageMonth) {
      setTitleError('Please select a billing month.')
      return
    }
    if (periodQuery.data?.already_billed) {
      setTitleError(
        periodQuery.data.message ??
          `Already billed for ${periodQuery.data.preview.coverage_period_label}. Choose a different month.`,
      )
      return
    }
    if (periodQuery.isFetching || periodQuery.isError) {
      setTitleError('Unable to verify this month. Please try again.')
      return
    }

    const { set, mode } = titlePrompt
    setTitlePrompt(null)
    setTitleError('')

    if (mode === 'fixed') {
      onSelectFixed(set, nextTitle, coverageMonth)
    } else {
      onSelectVariable(set, nextTitle, coverageMonth)
    }
  }

  if (!open) return null

  const periodPreview = periodQuery.data?.preview
  const alreadyBilled = Boolean(periodQuery.data?.already_billed)

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-6">
        <button
          type="button"
          className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
          aria-label="Close"
          onClick={onClose}
        />
        <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)]">
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Generate Bill</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose Manual input or a Bills Set for this period.
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

          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <section className="space-y-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Manual</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Default 3-step wizard — pick customers, enter bill details,
                  then confirm.
                </p>
              </div>
              <button
                type="button"
                disabled={runningFixedUuid !== null}
                onClick={onSelectManual}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-primary bg-secondary/50 px-4 py-3 text-left transition hover:bg-secondary disabled:opacity-60"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">Manual input</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Customer → Bill info → Summary
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  <Plus className="size-3.5" />
                  Start wizard
                </span>
              </button>
            </section>

            {settingsQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin text-primary" />
                Loading bill sets…
              </div>
            ) : (
              <>
                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Fixed amount
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Bills every active customer instantly for the selected
                      month.
                    </p>
                  </div>
                  {fixedSets.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
                      No fixed bill sets saved.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {fixedSets.map((set) => (
                        <li key={set.uuid}>
                          <button
                            type="button"
                            disabled={runningFixedUuid !== null}
                            onClick={() => openTitlePrompt(set, 'fixed')}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-secondary/40 px-4 py-3 text-left transition hover:border-primary hover:bg-secondary disabled:opacity-60"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">
                                {set.title}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {set.preview?.title ?? set.title} · Due{' '}
                                {set.preview?.due_on_label ?? '—'}
                              </p>
                            </div>
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                              {runningFixedUuid === set.uuid ? (
                                <LoaderCircle className="size-3.5 animate-spin" />
                              ) : (
                                <Plus className="size-3.5" />
                              )}
                              {set.fixed_amount_label}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="space-y-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Variable amount
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Enter a settlement amount per customer, then proceed.
                    </p>
                  </div>
                  {variableSets.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border px-3 py-4 text-xs text-muted-foreground">
                      No variable bill sets saved.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {variableSets.map((set) => (
                        <li key={set.uuid}>
                          <button
                            type="button"
                            disabled={runningFixedUuid !== null}
                            onClick={() => openTitlePrompt(set, 'variable')}
                            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-left transition hover:border-primary hover:bg-muted/40 disabled:opacity-60"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground">
                                {set.title}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {set.preview?.title ?? set.title} · Due{' '}
                                {set.preview?.due_on_label ?? '—'}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                              Variable
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </div>
      </div>

      {titlePrompt ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-3 py-4 sm:px-6">
          <button
            type="button"
            className="absolute inset-0 bg-[#2a1a3d]/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setTitlePrompt(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)]">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Bill title
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select the billing month, then confirm the title for{' '}
                  <span className="font-medium text-foreground">
                    {titlePrompt.set.title}
                  </span>
                  {titlePrompt.mode === 'fixed' &&
                  titlePrompt.set.fixed_amount_label
                    ? ` · ${titlePrompt.set.fixed_amount_label}`
                    : ''}
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTitlePrompt(null)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              {titleError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {titleError}
                </div>
              ) : null}

              <div>
                <p className="text-sm font-semibold text-foreground">
                  Billing period
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Choose month and year for this bill run
                </p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="bill-set-month"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Month
                    </label>
                    <select
                      id="bill-set-month"
                      value={selectedPeriod.month}
                      onChange={(e) => {
                        setCoverageMonth(
                          `${selectedPeriod.year}-${e.target.value}`,
                        )
                        setTitleError('')
                      }}
                      className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {MONTH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="bill-set-year"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Year
                    </label>
                    <select
                      id="bill-set-year"
                      value={selectedPeriod.year}
                      onChange={(e) => {
                        setCoverageMonth(
                          `${e.target.value}-${selectedPeriod.month}`,
                        )
                        setTitleError('')
                      }}
                      className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={String(year)}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="bill-set-title"
                  className="text-sm font-semibold text-foreground"
                >
                  Title
                </label>
                <input
                  id="bill-set-title"
                  value={billTitle}
                  onChange={(e) => {
                    setBillTitle(e.target.value)
                    if (!alreadyBilled) setTitleError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleTitleProceed()
                    }
                  }}
                  placeholder="e.g. Monthly Dues — August 2026"
                  className="mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {periodQuery.isFetching ? (
                    <span className="inline-flex items-center gap-1.5">
                      <LoaderCircle className="size-3 animate-spin" />
                      Checking month…
                    </span>
                  ) : periodPreview ? (
                    <>
                      Coverage {periodPreview.coverage_label} · Due{' '}
                      {periodPreview.due_on_label}
                    </>
                  ) : (
                    'Select a month to preview coverage dates.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border bg-[#fbfafc] px-5 py-4">
              <button
                type="button"
                onClick={() => setTitlePrompt(null)}
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTitleProceed}
                disabled={
                  alreadyBilled ||
                  periodQuery.isFetching ||
                  periodQuery.isError
                }
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export function VariableBillSetModal({
  open,
  billSet,
  billTitle,
  coverageMonth,
  onClose,
  onSuccess,
}: {
  open: boolean
  billSet: BillsSetItem | null
  billTitle?: string
  coverageMonth?: string
  onClose: () => void
  onSuccess: (message: string) => void
}) {
  const customersQuery = useQuery({
    queryKey: ['merchant-customers-options'],
    queryFn: () => customerService.listAll(),
    enabled: open && Boolean(billSet),
  })

  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!open || !billSet) return
    setAmounts({})
    setError('')
    setSearch('')
  }, [open, billSet])

  const resolvedTitle =
    billTitle?.trim() || billSet?.preview?.title || billSet?.title || ''

  const customers = useMemo(() => {
    const list = (customersQuery.data ?? []).filter(
      (customer) => customer.status === 'active',
    )
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter((customer) =>
      [
        customer.full_name,
        customer.account_number,
        customer.email ?? '',
        customer.phone ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q),
    )
  }, [customersQuery.data, search])

  const readyItems = useMemo(() => {
    return customers
      .map((customer) => {
        const raw = amounts[customer.uuid]?.trim() ?? ''
        const amount = Number(raw)
        if (!raw || !Number.isFinite(amount) || amount <= 0) return null
        return { customer_uuid: customer.uuid, amount: Number(amount.toFixed(2)) }
      })
      .filter(Boolean) as Array<{ customer_uuid: string; amount: number }>
  }, [customers, amounts])

  const mutation = useMutation({
    mutationFn: () =>
      billService.generateVariableFromSet({
        bill_set_uuid: billSet!.uuid,
        title: resolvedTitle || undefined,
        coverage_month: coverageMonth || undefined,
        items: readyItems,
      }),
    onSuccess: (data) => {
      onSuccess(
        data.message ??
          `Created ${data.created_count} bill(s) successfully.`,
      )
      onClose()
    },
    onError: (err) => {
      setError(axiosMessage(err, 'Unable to generate bills.'))
    },
  })

  if (!open || !billSet) return null

  const setAmount = (uuid: string, value: string) => {
    setAmounts((current) => ({ ...current, [uuid]: value }))
    setError('')
  }

  const fillAll = (value: string) => {
    const next: Record<string, string> = {}
    customers.forEach((customer) => {
      next[customer.uuid] = value
    })
    setAmounts(next)
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
        disabled={mutation.isPending}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)]">
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {resolvedTitle || billSet.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter amounts to settle, then proceed. Dates come from Bills
                Set.
              </p>
              {billSet.preview ? (
                <p className="mt-2 text-xs font-medium text-primary">
                  Coverage {billSet.preview.coverage_label} · Due{' '}
                  {billSet.preview.due_on_label}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative flex-1">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Fill all ₱"
                className="w-32 rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    fillAll((e.target as HTMLInputElement).value)
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value) fillAll(e.target.value)
                }}
              />
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                {readyItems.length} ready
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            {customersQuery.isLoading ? (
              <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin text-primary" />
                Loading customers…
              </div>
            ) : customers.length === 0 ? (
              <div className="py-14 text-center text-sm text-muted-foreground">
                No active customers found.
              </div>
            ) : (
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-[#f8f5fb]">
                    <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Account</th>
                      <th className="px-4 py-3 w-44">Amount (₱)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer: Customer) => {
                      const value = amounts[customer.uuid] ?? ''
                      const valid =
                        value !== '' &&
                        Number.isFinite(Number(value)) &&
                        Number(value) > 0
                      return (
                        <tr
                          key={customer.uuid}
                          className={cn(
                            'border-b border-border/70 last:border-0',
                            valid ? 'bg-secondary/30' : '',
                          )}
                        >
                          <td className="px-4 py-3 font-medium text-foreground">
                            {customer.full_name}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-semibold text-gold-foreground">
                              {customer.account_number}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={value}
                              onChange={(e) =>
                                setAmount(customer.uuid, e.target.value)
                              }
                              placeholder="0.00"
                              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-[#fbfafc] px-5 py-4 sm:px-6">
          <p className="text-xs text-muted-foreground">
            Only rows with an amount &gt; 0 will be billed
            {readyItems.length > 0
              ? ` · Total ${money(
                  readyItems.reduce((sum, item) => sum + item.amount, 0),
                )}`
              : ''}
            .
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={mutation.isPending}
              className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={mutation.isPending || readyItems.length === 0}
              onClick={() => mutation.mutate()}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
            >
              {mutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Proceed ({readyItems.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
