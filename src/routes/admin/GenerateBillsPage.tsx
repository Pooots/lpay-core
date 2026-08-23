import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePlus2,
  LoaderCircle,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import {
  BillSetPickerModal,
  VariableBillSetModal,
} from '@/components/admin/BillSetGenerateFlow'
import { useDialog } from '@/components/ui/AppDialog'
import { TablePagination } from '@/components/ui/TablePagination'
import { billService } from '@/services/billService'
import { memberService } from '@/services/memberService'
import { settingsService } from '@/services/settingsService'
import type { Bill, BillPayload, BillStatus, GenerateBillsPayload } from '@/types/bill'
import type { Member } from '@/types/member'
import { emptyPaginationMeta } from '@/types/pagination'
import type { BillsSetItem, BillsSetPreview } from '@/types/settings'
import { cn } from '@/lib/utils'

type ModalMode = 'create' | 'single' | 'view' | null
type WizardStep = 1 | 2 | 3

const WIZARD_STEPS = [
  { step: 1 as const, label: 'Customer' },
  { step: 2 as const, label: 'Bill info' },
  { step: 3 as const, label: 'Summary' },
]

function statusClass(status: BillStatus) {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700'
    case 'overdue':
      return 'bg-rose-50 text-rose-700'
    case 'cancelled':
      return 'bg-secondary text-muted-foreground'
    case 'draft':
      return 'bg-amber-50 text-amber-800'
    default:
      return 'bg-secondary text-primary'
  }
}

function formatDisplayDate(value: string) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatAmount(value: string) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '₱0.00'
  return `₱${amount.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function WizardSteps({ current }: { current: WizardStep }) {
  return (
    <ol className="grid grid-cols-3 gap-2">
      {WIZARD_STEPS.map((item) => {
        const active = current === item.step
        const done = current > item.step
        return (
          <li
            key={item.step}
            className={cn(
              'rounded-xl border px-3 py-2.5 text-center',
              active
                ? 'border-primary bg-secondary text-primary'
                : done
                  ? 'border-primary/30 bg-primary/5 text-primary'
                  : 'border-border bg-muted/40 text-muted-foreground',
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide">
              Step {item.step}
            </p>
            <p className="mt-0.5 text-xs font-semibold sm:text-sm">
              {item.label}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

function ConfirmGenerateDialog({
  open,
  customerCount,
  amountLabel,
  isSubmitting,
  onCancel,
  onConfirm,
  title,
  confirmLabel,
}: {
  open: boolean
  customerCount: number
  amountLabel: string
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: () => void
  title?: string
  confirmLabel?: string
}) {
  if (!open) return null

  const billWord = customerCount === 1 ? 'bill' : 'bills'
  const customerWord = customerCount === 1 ? 'customer' : 'customers'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/45"
        aria-label="Close confirmation"
        onClick={onCancel}
        disabled={isSubmitting}
      />
      <div className="relative w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.5)]">
        <h3 className="text-lg font-bold text-foreground">
          {title ?? `Generate ${billWord}?`}
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          You are about to create{' '}
          <span className="font-semibold text-foreground">
            {customerCount} {billWord}
          </span>{' '}
          for{' '}
          <span className="font-semibold text-foreground">
            {customerCount} {customerWord}
          </span>{' '}
          at{' '}
          <span className="font-semibold text-foreground">{amountLabel}</span>{' '}
          each. Please confirm before proceeding.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            {confirmLabel ?? `Yes, generate ${billWord}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function BillFormModal({
  mode,
  bill,
  open,
  onClose,
  onSubmit,
  onBulkSubmit,
  isSubmitting,
  error,
  manualEntry = false,
}: {
  mode: Exclude<ModalMode, null>
  bill: Bill | null
  open: boolean
  onClose: () => void
  onSubmit: (payload: BillPayload) => void
  onBulkSubmit: (payload: GenerateBillsPayload) => void
  isSubmitting: boolean
  error: string
  /** When true (Generate → Manual), skip Bills Set and show full manual fields. */
  manualEntry?: boolean
}) {
  const customersQuery = useQuery({
    queryKey: ['merchant-customers-options'],
    queryFn: () => memberService.listAll(),
    enabled: open && (mode === 'create' || mode === 'single'),
  })

  const settingsQuery = useQuery({
    queryKey: ['merchant-settings'],
    queryFn: () => settingsService.get(),
    enabled:
      open &&
      (mode === 'create' || mode === 'single') &&
      !manualEntry,
  })

  const billsSets = useMemo(() => {
    if (manualEntry) return []
    const list = settingsQuery.data?.bills_sets ?? []
    return list.filter((set) => set.is_active && set.preview)
  }, [manualEntry, settingsQuery.data?.bills_sets])

  const [selectedBillSetId, setSelectedBillSetId] = useState('')

  useEffect(() => {
    if (!open || manualEntry || (mode !== 'create' && mode !== 'single')) return
    if (billsSets.length === 0) {
      setSelectedBillSetId('')
      return
    }
    setSelectedBillSetId((current) => {
      if (current && billsSets.some((set) => set.uuid === current)) {
        return current
      }
      return billsSets[0]?.uuid ?? ''
    })
  }, [open, mode, billsSets, manualEntry])

  const selectedBillSet: BillsSetItem | null =
    billsSets.find((set) => set.uuid === selectedBillSetId) ?? null
  const billsSetPreview: BillsSetPreview | null =
    selectedBillSet?.preview ?? null
  const useBillSet = !manualEntry && Boolean(billsSetPreview)

  const [step, setStep] = useState<WizardStep>(1)
  const [stepError, setStepError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')

  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [dueOn, setDueOn] = useState('')
  const [coverageStart, setCoverageStart] = useState('')
  const [coverageEnd, setCoverageEnd] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<BillStatus>('issued')

  useEffect(() => {
    if (!open) return

    setStep(1)
    setStepError('')
    setConfirmOpen(false)
    setCustomerSearch('')

    if (mode === 'view' && bill) {
      setSelectedCustomerIds([bill.customer_uuid])
      setTitle(bill.title)
      setDescription(bill.description ?? '')
      setAmount(String(bill.amount))
      setDueOn(bill.due_on)
      setCoverageStart(bill.coverage_start)
      setCoverageEnd(bill.coverage_end)
      setNotes(bill.notes ?? '')
      setStatus(bill.status)
      return
    }

    setSelectedCustomerIds([])
    setAmount('')
    setNotes('')
    setStatus('issued')

    const today = new Date()
    const nextMonth = new Date(today)
    nextMonth.setMonth(nextMonth.getMonth() + 1)
    const toInput = (d: Date) => d.toISOString().slice(0, 10)

    setTitle('')
    setDescription('')
    setDueOn(toInput(nextMonth))
    setCoverageStart(toInput(new Date(today.getFullYear(), today.getMonth(), 1)))
    setCoverageEnd(toInput(new Date(today.getFullYear(), today.getMonth() + 1, 0)))
  }, [open, mode, bill])

  useEffect(() => {
    if (
      !open ||
      manualEntry ||
      (mode !== 'create' && mode !== 'single') ||
      !billsSetPreview
    ) {
      return
    }
    applyBillSetPreview(billsSetPreview, {
      setTitle,
      setDescription,
      setDueOn,
      setCoverageStart,
      setCoverageEnd,
    })
    if (
      selectedBillSet?.amount_mode === 'fixed' &&
      selectedBillSet.fixed_amount != null &&
      selectedBillSet.fixed_amount > 0
    ) {
      setAmount(String(selectedBillSet.fixed_amount))
    }
  }, [open, mode, billsSetPreview, selectedBillSet, manualEntry])

  useEffect(() => {
    if (error) {
      setConfirmOpen(false)
    }
  }, [error])

  const allCustomers = customersQuery.data ?? []

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase()
    if (!q) return allCustomers
    return allCustomers.filter((customer) => {
      const haystack = [
        customer.full_name,
        customer.account_number,
        customer.email ?? '',
        customer.phone ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [allCustomers, customerSearch])

  const selectedCustomers = useMemo(
    () =>
      allCustomers.filter((customer) =>
        selectedCustomerIds.includes(customer.uuid),
      ),
    [allCustomers, selectedCustomerIds],
  )

  const allFilteredSelected =
    filteredCustomers.length > 0 &&
    filteredCustomers.every((customer) =>
      selectedCustomerIds.includes(customer.uuid),
    )

  if (!open) return null

  const buildBasePayload = (): Omit<BillPayload, 'customer_uuid'> => ({
    title,
    description: description || undefined,
    amount: Number(amount),
    due_on: dueOn,
    coverage_start: coverageStart,
    coverage_end: coverageEnd,
    notes: notes || undefined,
    status,
  })

  const buildGeneratePayload = (): GenerateBillsPayload => ({
    customer_uuids: selectedCustomerIds,
    ...buildBasePayload(),
  })

  const isWizard = mode === 'create' || mode === 'single'
  const isSingle = mode === 'single'

  const validateStep1 = () => {
    if (selectedCustomerIds.length === 0) {
      setStepError(
        isSingle
          ? 'Please select a customer to continue.'
          : 'Please select at least one customer to continue.',
      )
      return false
    }
    if (isSingle && selectedCustomerIds.length !== 1) {
      setStepError('Select only one customer for a single transaction.')
      return false
    }
    setStepError('')
    return true
  }

  const validateStep2 = () => {
    if (!title.trim()) {
      setStepError('Bill title is required.')
      return false
    }
    if (!amount || Number(amount) <= 0) {
      setStepError('Enter a valid settlement amount greater than zero.')
      return false
    }
    if (!dueOn) {
      setStepError('Due on date is required.')
      return false
    }
    if (!coverageStart || !coverageEnd) {
      setStepError('Coverage start and end dates are required.')
      return false
    }
    if (coverageEnd < coverageStart) {
      setStepError('Coverage end date must be on or after the start date.')
      return false
    }
    setStepError('')
    return true
  }

  const goNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((current) => (current < 3 ? ((current + 1) as WizardStep) : current))
  }

  const goBack = () => {
    setStepError('')
    setStep((current) => (current > 1 ? ((current - 1) as WizardStep) : current))
  }

  const handleViewSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit(buildBasePayload())
  }

  const toggleCustomer = (uuid: string) => {
    setStepError('')
    if (isSingle) {
      setSelectedCustomerIds([uuid])
      return
    }
    setSelectedCustomerIds((current) =>
      current.includes(uuid)
        ? current.filter((id) => id !== uuid)
        : [...current, uuid],
    )
  }

  const toggleAllFiltered = () => {
    setStepError('')
    if (allFilteredSelected) {
      const filteredIds = new Set(filteredCustomers.map((c) => c.uuid))
      setSelectedCustomerIds((current) =>
        current.filter((id) => !filteredIds.has(id)),
      )
      return
    }
    setSelectedCustomerIds((current) => {
      const next = new Set(current)
      filteredCustomers.forEach((customer) => next.add(customer.uuid))
      return Array.from(next)
    })
  }

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-3 py-4 sm:px-6 sm:py-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)]">
        <div className="border-b border-border px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground sm:text-2xl">
                {mode === 'create'
                  ? 'Generate Bill'
                  : mode === 'single'
                    ? 'Single transaction'
                    : 'View / Update Bill'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === 'create'
                  ? useBillSet
                    ? 'Select customers, enter the settlement amount, then review.'
                    : 'Select customers, enter bill details, then review before generating.'
                  : mode === 'single'
                    ? useBillSet
                      ? 'Select one customer, enter the amount, then confirm.'
                      : 'Create one bill for a single customer.'
                    : 'Review and update bill details.'}
              </p>
              {mode === 'view' && bill ? (
                <p className="mt-2 font-mono text-xs font-semibold tracking-wide text-gold-foreground">
                  {bill.bill_number}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
            >
              <X className="size-5" />
            </button>
          </div>

          {isWizard ? (
            <div className="mt-5">
              <WizardSteps current={step} />
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {(error || stepError) && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {stepError || error}
            </div>
          )}

          {mode === 'view' ? (
            <form onSubmit={handleViewSubmit} className="space-y-4">
              {bill ? (
                <div className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm">
                  <p className="font-medium text-foreground">{bill.customer_name}</p>
                  <p className="mt-0.5 font-mono text-xs text-gold-foreground">
                    {bill.account_number}
                  </p>
                </div>
              ) : null}

              <BillInfoFields
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                amount={amount}
                setAmount={setAmount}
                dueOn={dueOn}
                setDueOn={setDueOn}
                coverageStart={coverageStart}
                setCoverageStart={setCoverageStart}
                coverageEnd={coverageEnd}
                setCoverageEnd={setCoverageEnd}
                notes={notes}
                setNotes={setNotes}
                status={status}
                setStatus={setStatus}
                inputClass={inputClass}
              />

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
                  ) : null}
                  Save changes
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {isSingle ? 'Select customer' : 'Select customers'}
                      </h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {isSingle
                          ? 'Choose one customer for this single transaction.'
                          : 'Check one or more customers to receive this bill.'}
                      </p>
                    </div>
                    <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
                      {selectedCustomerIds.length} selected
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search by name, account number, email, or phone..."
                      className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-border">
                    {customersQuery.isLoading ? (
                      <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
                        <LoaderCircle className="size-4 animate-spin text-primary" />
                        Loading customers…
                      </div>
                    ) : filteredCustomers.length === 0 ? (
                      <div className="py-14 text-center text-sm text-muted-foreground">
                        {allCustomers.length === 0
                          ? 'No customers found. Create a customer first.'
                          : 'No customers match your search.'}
                      </div>
                    ) : (
                      <div className="max-h-[340px] overflow-auto">
                        <table className="w-full min-w-[720px] text-left text-sm">
                          <thead className="sticky top-0 z-10 bg-[#f8f5fb]">
                            <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              <th className="w-12 px-4 py-3">
                                {isSingle ? null : (
                                  <input
                                    type="checkbox"
                                    checked={allFilteredSelected}
                                    onChange={toggleAllFiltered}
                                    className="size-4 rounded border-border text-primary accent-[#4B1D6E]"
                                    aria-label="Select all customers"
                                  />
                                )}
                              </th>
                              <th className="px-3 py-3">Customer</th>
                              <th className="px-3 py-3">Account No.</th>
                              <th className="px-3 py-3">Email</th>
                              <th className="px-3 py-3">Phone</th>
                              <th className="px-3 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCustomers.map((customer: Member) => {
                              const checked = selectedCustomerIds.includes(
                                customer.uuid,
                              )
                              return (
                                <tr
                                  key={customer.uuid}
                                  onClick={() => toggleCustomer(customer.uuid)}
                                  className={cn(
                                    'cursor-pointer border-b border-border/70 last:border-0 transition',
                                    checked
                                      ? 'bg-secondary/70'
                                      : 'hover:bg-muted/50',
                                  )}
                                >
                                  <td className="px-4 py-3.5">
                                    <input
                                      type={isSingle ? 'radio' : 'checkbox'}
                                      name={
                                        isSingle
                                          ? 'single-customer'
                                          : undefined
                                      }
                                      checked={checked}
                                      onChange={() =>
                                        toggleCustomer(customer.uuid)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      className="size-4 rounded border-border text-primary accent-[#4B1D6E]"
                                      aria-label={`Select ${customer.full_name}`}
                                    />
                                  </td>
                                  <td className="px-3 py-3.5 font-medium text-foreground">
                                    {customer.full_name}
                                  </td>
                                  <td className="px-3 py-3.5">
                                    <span className="font-mono text-xs font-semibold text-gold-foreground">
                                      {customer.account_number}
                                    </span>
                                  </td>
                                  <td className="px-3 py-3.5 text-muted-foreground">
                                    {customer.email || '—'}
                                  </td>
                                  <td className="px-3 py-3.5 text-muted-foreground">
                                    {customer.phone || '—'}
                                  </td>
                                  <td className="px-3 py-3.5">
                                    <span
                                      className={cn(
                                        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                                        customer.status === 'active'
                                          ? 'bg-emerald-50 text-emerald-700'
                                          : 'bg-secondary text-primary',
                                      )}
                                    >
                                      {customer.status}
                                    </span>
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
              ) : null}

              {step === 2 ? (
                <BillInfoFields
                  title={title}
                  setTitle={setTitle}
                  description={description}
                  setDescription={setDescription}
                  amount={amount}
                  setAmount={setAmount}
                  dueOn={dueOn}
                  setDueOn={setDueOn}
                  coverageStart={coverageStart}
                  setCoverageStart={setCoverageStart}
                  coverageEnd={coverageEnd}
                  setCoverageEnd={setCoverageEnd}
                  notes={notes}
                  setNotes={setNotes}
                  status={status}
                  setStatus={setStatus}
                  inputClass={inputClass}
                  datesLocked={useBillSet}
                  billsSetPreview={billsSetPreview}
                  billsSets={billsSets}
                  selectedBillSetId={selectedBillSetId}
                  onSelectBillSet={setSelectedBillSetId}
                  amountLocked={
                    selectedBillSet?.amount_mode === 'fixed' &&
                    (selectedBillSet.fixed_amount ?? 0) > 0
                  }
                  settingsLoading={settingsQuery.isLoading}
                />
              ) : null}

              {step === 3 ? (
                <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
                    <h3 className="text-sm font-bold text-foreground">
                      Bill details
                    </h3>
                    <dl className="space-y-3 text-sm">
                      <SummaryRow label="Bill title" value={title || '—'} />
                      <SummaryRow label="Amount" value={formatAmount(amount)} />
                      <SummaryRow
                        label="Due on"
                        value={formatDisplayDate(dueOn)}
                      />
                      <SummaryRow
                        label="Coverage"
                        value={`${formatDisplayDate(coverageStart)} – ${formatDisplayDate(coverageEnd)}`}
                      />
                      <SummaryRow
                        label="Description"
                        value={description.trim() || '—'}
                      />
                      <SummaryRow label="Status" value={status} capitalize />
                      <SummaryRow
                        label="Internal notes"
                        value={notes.trim() || '—'}
                      />
                    </dl>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-border bg-white p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-foreground">
                        Selected customers
                      </h3>
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {selectedCustomers.length}
                      </span>
                    </div>
                    <ul className="max-h-[280px] space-y-2 overflow-y-auto">
                      {selectedCustomers.map((customer) => (
                        <li
                          key={customer.uuid}
                          className="rounded-xl border border-border bg-muted/20 px-3 py-2.5"
                        >
                          <p className="text-sm font-medium text-foreground">
                            {customer.full_name}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] font-semibold text-gold-foreground">
                            {customer.account_number}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {isWizard ? (
          <div className="border-t border-border bg-[#fbfafc] px-5 py-4 sm:px-7">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Cancel
              </button>

              <div className="flex flex-wrap gap-2">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                  >
                    <ChevronLeft className="size-4" />
                    Back
                  </button>
                ) : null}

                {step < 3 ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
                  >
                    Next
                    <ChevronRight className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!validateStep1() || !validateStep2()) {
                        setStep(validateStep1() ? 2 : 1)
                        return
                      }
                      setConfirmOpen(true)
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
                  >
                    <Plus className="size-4" />
                    {isSingle
                      ? 'Create transaction'
                      : `Generate bill${
                          selectedCustomerIds.length > 1
                            ? `s (${selectedCustomerIds.length})`
                            : ''
                        }`}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <ConfirmGenerateDialog
        open={confirmOpen}
        customerCount={selectedCustomerIds.length}
        amountLabel={formatAmount(amount)}
        isSubmitting={isSubmitting}
        title={isSingle ? 'Create single transaction?' : undefined}
        confirmLabel={isSingle ? 'Yes, create transaction' : undefined}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (isSingle) {
            onSubmit({
              customer_uuid: selectedCustomerIds[0],
              ...buildBasePayload(),
            })
            return
          }
          onBulkSubmit(buildGeneratePayload())
        }}
      />
    </div>
  )
}

function SummaryRow({
  label,
  value,
  capitalize = false,
}: {
  label: string
  value: string
  capitalize?: boolean
}) {
  return (
    <div className="grid gap-1 border-b border-border/70 pb-3 last:border-0 last:pb-0 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          'font-medium text-foreground',
          capitalize && 'capitalize',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function applyBillSetPreview(
  preview: BillsSetPreview,
  setters: {
    setTitle: (value: string) => void
    setDescription: (value: string) => void
    setDueOn: (value: string) => void
    setCoverageStart: (value: string) => void
    setCoverageEnd: (value: string) => void
  },
) {
  setters.setTitle(preview.title)
  setters.setDescription(preview.description ?? '')
  setters.setDueOn(preview.due_on)
  setters.setCoverageStart(preview.coverage_start)
  setters.setCoverageEnd(preview.coverage_end)
}

function BillInfoFields({
  title,
  setTitle,
  description,
  setDescription,
  amount,
  setAmount,
  dueOn,
  setDueOn,
  coverageStart,
  setCoverageStart,
  coverageEnd,
  setCoverageEnd,
  notes,
  setNotes,
  status,
  setStatus,
  inputClass,
  datesLocked = false,
  billsSetPreview = null,
  billsSets = [],
  selectedBillSetId = '',
  onSelectBillSet,
  amountLocked = false,
  settingsLoading = false,
}: {
  title: string
  setTitle: (value: string) => void
  description: string
  setDescription: (value: string) => void
  amount: string
  setAmount: (value: string) => void
  dueOn: string
  setDueOn: (value: string) => void
  coverageStart: string
  setCoverageStart: (value: string) => void
  coverageEnd: string
  setCoverageEnd: (value: string) => void
  notes: string
  setNotes: (value: string) => void
  status: BillStatus
  setStatus: (value: BillStatus) => void
  inputClass: string
  datesLocked?: boolean
  billsSetPreview?: BillsSetPreview | null
  billsSets?: BillsSetItem[]
  selectedBillSetId?: string
  onSelectBillSet?: (uuid: string) => void
  amountLocked?: boolean
  settingsLoading?: boolean
}) {
  if (datesLocked) {
    return (
      <div className="space-y-4">
        {settingsLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading Bills Set…
          </div>
        ) : null}

        {billsSets.length > 1 && onSelectBillSet ? (
          <div>
            <label className="text-sm font-semibold text-foreground">
              Bill set
            </label>
            <select
              value={selectedBillSetId}
              onChange={(e) => onSelectBillSet(e.target.value)}
              className={inputClass}
            >
              {billsSets.map((set) => (
                <option key={set.uuid} value={set.uuid}>
                  {set.title}
                  {set.amount_mode === 'fixed' && set.fixed_amount_label
                    ? ` (${set.fixed_amount_label})`
                    : ''}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="rounded-2xl border border-primary/20 bg-secondary/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            From Bills Set
          </p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Title</dt>
              <dd className="mt-0.5 font-semibold text-foreground">
                {billsSetPreview?.title || title || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Due on</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {billsSetPreview?.due_on_label || formatDisplayDate(dueOn)}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs text-muted-foreground">Coverage</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                {billsSetPreview?.coverage_label ||
                  `${formatDisplayDate(coverageStart)} – ${formatDisplayDate(coverageEnd)}`}
              </dd>
            </div>
            {(billsSetPreview?.description || description) ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Description</dt>
                <dd className="mt-0.5 text-foreground">
                  {billsSetPreview?.description || description}
                </dd>
              </div>
            ) : null}
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Change these dates anytime in Settings → Bills Set.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground">
            Settlement amount (₱)
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {amountLocked
              ? 'Fixed from Bills Set (e.g. Monthly Dues).'
              : 'Enter the amount to bill each selected customer.'}
          </p>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            placeholder="0.00"
            readOnly={amountLocked}
            autoFocus={!amountLocked}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BillStatus)}
              className={inputClass}
            >
              <option value="draft">Draft</option>
              <option value="issued">Issued</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-foreground">
              Internal notes
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
              placeholder="Optional"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        Tip: set up <span className="font-semibold">Settings → Bills Set</span>{' '}
        once so Generate Bills only needs the settlement amount.
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">
          Bill title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder="e.g. Monthly association dues"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-foreground">
            Amount (₱)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">Due on</label>
          <input
            type="date"
            value={dueOn}
            onChange={(e) => setDueOn(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-foreground">Coverage</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Billing period this charge covers
        </p>
        <div className="mt-2 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Start date
            </label>
            <input
              type="date"
              value={coverageStart}
              onChange={(e) => setCoverageStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              End date
            </label>
            <input
              type="date"
              value={coverageEnd}
              onChange={(e) => setCoverageEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-semibold text-foreground">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={inputClass}
          placeholder="Optional details shown on the bill"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-semibold text-foreground">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BillStatus)}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="issued">Issued</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-foreground">
            Internal notes
          </label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
            placeholder="Optional"
          />
        </div>
      </div>
    </div>
  )
}

export default function GenerateBillsPage() {
  const queryClient = useQueryClient()
  const dialog = useDialog()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [manualEntry, setManualEntry] = useState(false)
  const [selected, setSelected] = useState<Bill | null>(null)
  const [formError, setFormError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [variableSet, setVariableSet] = useState<BillsSetItem | null>(null)
  const [variableTitle, setVariableTitle] = useState('')
  const [variableCoverageMonth, setVariableCoverageMonth] = useState('')
  const [banner, setBanner] = useState('')
  const [runningFixedUuid, setRunningFixedUuid] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const billsQuery = useQuery({
    queryKey: ['merchant-bills', debouncedSearch, page],
    queryFn: () =>
      billService.list({
        q: debouncedSearch || undefined,
        page,
        per_page: 10,
      }),
  })

  const runFixedMutation = useMutation({
    mutationFn: ({
      uuid,
      title,
      coverage_month,
    }: {
      uuid: string
      title: string
      coverage_month: string
    }) => billService.runBillSet(uuid, { title, coverage_month }),
    onMutate: ({ uuid }) => setRunningFixedUuid(uuid),
    onSuccess: async (data) => {
      setRunningFixedUuid(null)
      setPickerOpen(false)
      setBanner(
        data.message ??
          `Created ${data.result.created_count} bill(s) for all active customers.`,
      )
      await queryClient.invalidateQueries({ queryKey: ['merchant-bills'] })
    },
    onError: (error) => {
      setRunningFixedUuid(null)
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
      setBanner('')
      setFormError(message ?? 'Unable to generate fixed bills.')
      void dialog.alert({
        title: 'Unable to generate',
        message: message ?? 'Unable to generate fixed bills.',
        tone: 'danger',
        confirmLabel: 'OK',
      })
    },
  })

  const createMutation = useMutation({
    mutationFn: billService.generate,
    onSuccess: async (bills) => {
      setModalMode(null)
      setManualEntry(false)
      setFormError('')
      setBanner(
        bills.length === 1
          ? 'Bill generated successfully.'
          : `${bills.length} bills generated successfully.`,
      )
      await queryClient.invalidateQueries({ queryKey: ['merchant-bills'] })
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
      setFormError(message ?? 'Unable to generate bill.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: BillPayload
    }) => billService.update(uuid, payload),
    onSuccess: async () => {
      setModalMode(null)
      setManualEntry(false)
      setSelected(null)
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['merchant-bills'] })
    },
    onError: (error) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message as string | undefined)
        : null
      setFormError(message ?? 'Unable to update bill.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => billService.remove(uuid),
    onSuccess: async () => {
      setBanner('Bill deleted successfully.')
      await queryClient.invalidateQueries({ queryKey: ['merchant-bills'] })
    },
    onError: async (error) => {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.message as string | undefined)
        : null
      await dialog.alert({
        title: 'Unable to delete',
        message: message ?? 'Unable to delete bill.',
        tone: 'danger',
        confirmLabel: 'OK',
      })
    },
  })

  const bills = useMemo(
    () => billsQuery.data?.data ?? [],
    [billsQuery.data],
  )
  const paginationMeta = billsQuery.data?.meta ?? emptyPaginationMeta(10)

  return (
    <MerchantShell>
      <div className="home-rise space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Generate Bills
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Select a Bills Set to generate bills for this period
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFormError('')
              setBanner('')
              setPickerOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-12px_rgb(75_29_110_/_0.7)] transition hover:bg-[#3f1860]"
          >
            <Plus className="size-4 text-gold" />
            Generate Bill
          </button>
        </div>

        {banner ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {banner}
          </div>
        ) : null}
        {formError && !modalMode ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {formError}
          </div>
        ) : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by bill number, customer, account number..."
            className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          {billsQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading bills…
            </div>
          ) : billsQuery.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              Unable to load bills. Please refresh and try again.
            </div>
          ) : bills.length === 0 ? (
            <div className="py-16 text-center">
              <FilePlus2 className="mx-auto size-10 text-primary/40" />
              <p className="mt-3 font-medium text-foreground">No bills yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Generate your first bill for a customer.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Bill No.</th>
                    <th className="pb-3 pr-4">Customer</th>
                    <th className="pb-3 pr-4">Title</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Due on</th>
                    <th className="pb-3 pr-4">Coverage</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr
                      key={bill.uuid}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-xs font-semibold text-gold-foreground">
                          {bill.bill_number}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="font-medium text-foreground">
                          {bill.customer_name}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {bill.account_number}
                        </p>
                      </td>
                      <td className="py-3.5 pr-4 text-foreground">{bill.title}</td>
                      <td className="py-3.5 pr-4 font-semibold text-foreground">
                        {bill.amount_label}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {bill.due_on_label || '—'}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {bill.coverage_label || '—'}
                      </td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                            statusClass(bill.status),
                          )}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(bill)
                              setFormError('')
                              setManualEntry(false)
                              setModalMode('view')
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary"
                          >
                            <Eye className="size-3.5" />
                            View
                          </button>
                          <button
                            type="button"
                            title="Delete bill"
                            aria-label={`Delete bill ${bill.bill_number}`}
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              void (async () => {
                                const ok = await dialog.confirm({
                                  title: 'Delete bill',
                                  message: `Delete bill ${bill.bill_number} for ${bill.customer_name}? This cannot be undone.`,
                                  confirmLabel: 'Delete',
                                  cancelLabel: 'Cancel',
                                  tone: 'danger',
                                })
                                if (ok) {
                                  deleteMutation.mutate(bill.uuid)
                                }
                              })()
                            }}
                            className="inline-flex size-8 items-center justify-center rounded-xl border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
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
          {!billsQuery.isLoading && !billsQuery.isError ? (
            <TablePagination
              meta={paginationMeta}
              onPageChange={setPage}
              disabled={billsQuery.isFetching}
              label="bills"
            />
          ) : null}
        </section>
      </div>

      {pickerOpen ? (
        <BillSetPickerModal
          open
          runningFixedUuid={runningFixedUuid}
          onClose={() => {
            if (!runFixedMutation.isPending) setPickerOpen(false)
          }}
          onSelectManual={() => {
            setPickerOpen(false)
            setSelected(null)
            setFormError('')
            setBanner('')
            setManualEntry(true)
            setModalMode('create')
          }}
          onSelectFixed={(set, title, coverageMonth) => {
            void (async () => {
              const ok = await dialog.confirm({
                title: 'Generate bills',
                message: `Generate “${title}” at ${set.fixed_amount_label} for ALL active customers for this month? Already billed customers for this period will be skipped.`,
                confirmLabel: 'Proceed',
                cancelLabel: 'Cancel',
              })
              if (ok) {
                runFixedMutation.mutate({
                  uuid: set.uuid,
                  title,
                  coverage_month: coverageMonth,
                })
              }
            })()
          }}
          onSelectVariable={(set, title, coverageMonth) => {
            setPickerOpen(false)
            setVariableSet(set)
            setVariableTitle(title)
            setVariableCoverageMonth(coverageMonth)
          }}
        />
      ) : null}

      {variableSet ? (
        <VariableBillSetModal
          open
          billSet={variableSet}
          billTitle={variableTitle}
          coverageMonth={variableCoverageMonth}
          onClose={() => {
            setVariableSet(null)
            setVariableTitle('')
            setVariableCoverageMonth('')
          }}
          onSuccess={async (message) => {
            setBanner(message)
            setVariableSet(null)
            setVariableTitle('')
            setVariableCoverageMonth('')
            await queryClient.invalidateQueries({ queryKey: ['merchant-bills'] })
          }}
        />
      ) : null}

      {modalMode === 'create' || (modalMode === 'view' && selected) ? (
        <BillFormModal
          mode={modalMode === 'create' ? 'create' : 'view'}
          bill={selected}
          open
          manualEntry={modalMode === 'create' && manualEntry}
          onClose={() => {
            setModalMode(null)
            setManualEntry(false)
            setSelected(null)
            setFormError('')
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          error={formError}
          onSubmit={(payload) => {
            if (modalMode === 'view' && selected) {
              updateMutation.mutate({ uuid: selected.uuid, payload })
            }
          }}
          onBulkSubmit={(payload) => {
            createMutation.mutate(payload)
          }}
        />
      ) : null}
    </MerchantShell>
  )
}
