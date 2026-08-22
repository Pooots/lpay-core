import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Download,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Upload,
  UserRound,
  X,
} from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import { customerService } from '@/services/customerService'
import type {
  Customer,
  CustomerBillRow,
  CustomerDetail,
  CustomerImportRow,
  CustomerPayload,
  CustomerStatus,
  CustomerTransactionRow,
} from '@/types/customer'
import { cn } from '@/lib/utils'

type ModalMode = 'create' | 'edit' | 'view' | null

function axiosMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback
  const message = error.response?.data?.message as string | undefined
  if (message) return message
  const errors = error.response?.data?.errors as
    | Record<string, string[]>
    | undefined
  if (errors) {
    return Object.values(errors).flat().join(' ') || fallback
  }
  return fallback
}

function billStatusClass(status: string) {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700'
    case 'overdue':
      return 'bg-rose-50 text-rose-700'
    case 'partial':
      return 'bg-amber-50 text-amber-800'
    case 'issued':
      return 'bg-sky-50 text-sky-700'
    default:
      return 'bg-secondary text-primary'
  }
}

function CustomerFormModal({
  mode,
  customer,
  open,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  mode: 'create' | 'edit'
  customer: Customer | null
  open: boolean
  onClose: () => void
  onSubmit: (payload: CustomerPayload) => void
  isSubmitting: boolean
  error: string
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [phase, setPhase] = useState('')
  const [block, setBlock] = useState('')
  const [lot, setLot] = useState('')
  const [street, setStreet] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [status, setStatus] = useState<CustomerStatus>('active')

  useEffect(() => {
    if (!open) return
    if (mode === 'edit' && customer) {
      setFirstName(customer.first_name)
      setLastName(customer.last_name ?? '')
      setEmail(customer.email ?? '')
      setPhone(customer.phone ?? '')
      setPhase(customer.phase ?? '')
      setBlock(customer.block ?? '')
      setLot(customer.lot ?? '')
      setStreet(customer.street ?? '')
      setDateOfBirth(customer.date_of_birth ?? '')
      setStatus(customer.status)
      return
    }
    setFirstName('')
    setLastName('')
    setEmail('')
    setPhone('')
    setPhase('')
    setBlock('')
    setLot('')
    setStreet('')
    setDateOfBirth('')
    setStatus('active')
  }, [open, mode, customer])

  if (!open) return null

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email || undefined,
      phone: phone || undefined,
      phase: phase || undefined,
      block: block || undefined,
      lot: lot || undefined,
      street: street || undefined,
      date_of_birth: dateOfBirth || undefined,
      status,
    })
  }

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

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
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border bg-white p-6 shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)] sm:p-7"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {mode === 'create' ? 'Create Member' : 'Edit Account'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === 'create'
                ? 'Add a member under your merchant account.'
                : 'Update this member’s account information.'}
            </p>
            {mode === 'edit' && customer ? (
              <p className="mt-2 font-mono text-xs font-semibold tracking-wide text-gold-foreground">
                {customer.account_number}
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

        {error ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-foreground">
                First name
              </label>
              <input
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">
                Last name
              </label>
              <input
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="member@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="+63 900 000 0000"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-semibold text-foreground">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as CustomerStatus)}
                className={`${inputClass} bg-white`}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">
                Date of birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Address</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Phase, block, lot, and street
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Phase
                </label>
                <input
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Block
                </label>
                <input
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Lot
                </label>
                <input
                  value={lot}
                  onChange={(e) => setLot(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  Street
                </label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className={inputClass}
                />
              </div>
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
            ) : mode === 'create' ? (
              <Plus className="size-4" />
            ) : (
              <Pencil className="size-4" />
            )}
            {mode === 'create' ? 'Create' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

function UploadMembersModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean
  onClose: () => void
  onImported: (message: string) => void
}) {
  const [fileName, setFileName] = useState('')
  const [previewRows, setPreviewRows] = useState<CustomerImportRow[] | null>(
    null,
  )
  const [parseErrors, setParseErrors] = useState<
    Array<{ row: number; message: string }>
  >([])
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    created: number
    skipped: number
    errors: Array<{ row: number; message: string }>
  } | null>(null)
  const [previewing, setPreviewing] = useState(false)

  const confirmMutation = useMutation({
    mutationFn: (rows: CustomerImportRow[]) =>
      customerService.importConfirm(rows),
    onSuccess: (data) => {
      setResult(data)
      setError('')
      if (data.created > 0) {
        onImported(
          data.created === 1
            ? '1 member imported successfully.'
            : `${data.created} members imported successfully.`,
        )
        window.setTimeout(() => onClose(), 600)
      } else if (data.errors.length > 0) {
        setError(
          data.errors[0]
            ? `Row ${data.errors[0].row}: ${data.errors[0].message}`
            : 'No members were imported.',
        )
      }
    },
    onError: (err) => {
      setResult(null)
      setError(axiosMessage(err, 'Unable to import members.'))
    },
  })

  useEffect(() => {
    if (!open) return
    setFileName('')
    setPreviewRows(null)
    setParseErrors([])
    setError('')
    setResult(null)
    setPreviewing(false)
  }, [open])

  const loadPreview = async (selected: File) => {
    setPreviewing(true)
    setError('')
    setResult(null)
    setPreviewRows(null)
    setParseErrors([])
    try {
      const preview = await customerService.importPreview(selected)
      setFileName(preview.file_name || selected.name)
      setPreviewRows(
        preview.rows.map((row) => ({
          ...row,
          email: row.email ?? '',
          password: row.password ?? '',
          phone: row.phone ?? '',
          phase: row.phase ?? '',
          block: row.block ?? '',
          lot: row.lot ?? '',
          street: row.street ?? '',
          date_of_birth: row.date_of_birth ?? '',
          registered_at: row.registered_at ?? '',
          status: row.status || 'active',
        })),
      )
      setParseErrors(preview.errors)
      if (preview.rows.length === 0 && preview.errors.length > 0) {
        setError('No valid rows found. Fix the CSV issues listed below.')
      }
    } catch (err) {
      setFileName('')
      setPreviewRows(null)
      setError(axiosMessage(err, 'Unable to preview CSV file.'))
    } finally {
      setPreviewing(false)
    }
  }

  const updateRow = (
    index: number,
    field: keyof CustomerImportRow,
    value: string,
  ) => {
    setPreviewRows((current) => {
      if (!current) return current
      return current.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      )
    })
  }

  const removeRow = (index: number) => {
    setPreviewRows((current) =>
      current ? current.filter((_, i) => i !== index) : current,
    )
  }

  if (!open) return null

  const reviewing = previewRows !== null
  const cellInput =
    'h-9 w-full min-w-[110px] rounded-lg border border-border bg-white px-2 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col rounded-3xl border border-border bg-white shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)]',
          reviewing ? 'max-w-6xl' : 'max-w-lg',
        )}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {reviewing ? 'Review Members' : 'Upload Members'}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {reviewing
                ? `Review and update rows from ${fileName || 'your CSV'} before importing.`
                : 'Import members from a CSV file. Name can be “Last, First” or separate First Name / Last Name columns.'}
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7 sm:py-5">
          {!reviewing ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/15 bg-secondary/40 p-4 text-xs text-muted-foreground">
                <p className="font-semibold text-primary">Expected columns</p>
                <p className="mt-1">
                  First Name, Last Name (or Name), Email, Password, Phone,
                  Status, Date of Birth, Join Date, Phase, Block, Lot, Street
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    const blob = await customerService.downloadTemplate()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'member-upload-template.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  } catch {
                    setError('Unable to download template.')
                  }
                }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <Download className="size-4" />
                Download CSV template
              </button>

              <div>
                <label className="text-sm font-semibold text-foreground">
                  CSV file
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  disabled={previewing}
                  onChange={(e) => {
                    const selected = e.target.files?.[0] ?? null
                    if (selected) void loadPreview(selected)
                  }}
                  className="mt-1.5 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground"
                />
              </div>

              {previewing ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="size-4 animate-spin text-primary" />
                  Reading CSV…
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {previewRows.length} member
                  {previewRows.length === 1 ? '' : 's'} ready to import
                  {parseErrors.length > 0
                    ? ` · ${parseErrors.length} row${parseErrors.length === 1 ? '' : 's'} skipped from file`
                    : ''}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewRows(null)
                    setFileName('')
                    setParseErrors([])
                    setResult(null)
                    setError('')
                  }}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  Choose another file
                </button>
              </div>

              {parseErrors.length > 0 ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <p className="font-semibold">Skipped rows from file</p>
                  <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto">
                    {parseErrors.slice(0, 12).map((item) => (
                      <li key={`${item.row}-${item.message}`}>
                        Row {item.row}: {item.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="max-h-[48vh] overflow-auto">
                  <table className="w-full min-w-[1100px] border-collapse text-left text-xs">
                    <thead className="sticky top-0 z-10 bg-[#faf7fc]">
                      <tr className="border-b border-border text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        <th className="px-2 py-2">#</th>
                        <th className="px-2 py-2">First name</th>
                        <th className="px-2 py-2">Last name</th>
                        <th className="px-2 py-2">Email</th>
                        <th className="px-2 py-2">Password</th>
                        <th className="px-2 py-2">Phone</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">DOB</th>
                        <th className="px-2 py-2">Join date</th>
                        <th className="px-2 py-2">Phase</th>
                        <th className="px-2 py-2">Block</th>
                        <th className="px-2 py-2">Lot</th>
                        <th className="px-2 py-2">Street</th>
                        <th className="px-2 py-2 text-right"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, index) => (
                        <tr
                          key={`${row.row ?? index}-${index}`}
                          className="border-b border-border/70 last:border-0"
                        >
                          <td className="px-2 py-1.5 text-muted-foreground">
                            {row.row ?? index + 1}
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={row.first_name}
                              onChange={(e) =>
                                updateRow(index, 'first_name', e.target.value)
                              }
                              className={cellInput}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={row.last_name}
                              onChange={(e) =>
                                updateRow(index, 'last_name', e.target.value)
                              }
                              className={cellInput}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={row.email ?? ''}
                              onChange={(e) =>
                                updateRow(index, 'email', e.target.value)
                              }
                              className={cellInput}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={row.password ?? ''}
                              onChange={(e) =>
                                updateRow(index, 'password', e.target.value)
                              }
                              className={cellInput}
                              placeholder="Optional"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={row.phone ?? ''}
                              onChange={(e) =>
                                updateRow(index, 'phone', e.target.value)
                              }
                              className={cellInput}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <select
                              value={row.status || 'active'}
                              onChange={(e) =>
                                updateRow(index, 'status', e.target.value)
                              }
                              className={cellInput}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="date"
                              value={row.date_of_birth ?? ''}
                              onChange={(e) =>
                                updateRow(
                                  index,
                                  'date_of_birth',
                                  e.target.value,
                                )
                              }
                              className={cellInput}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="date"
                              value={row.registered_at ?? ''}
                              onChange={(e) =>
                                updateRow(
                                  index,
                                  'registered_at',
                                  e.target.value,
                                )
                              }
                              className={cellInput}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={row.phase ?? ''}
                              onChange={(e) =>
                                updateRow(index, 'phase', e.target.value)
                              }
                              className={cn(cellInput, 'min-w-[70px]')}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={row.block ?? ''}
                              onChange={(e) =>
                                updateRow(index, 'block', e.target.value)
                              }
                              className={cn(cellInput, 'min-w-[70px]')}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={row.lot ?? ''}
                              onChange={(e) =>
                                updateRow(index, 'lot', e.target.value)
                              }
                              className={cn(cellInput, 'min-w-[70px]')}
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              value={row.street ?? ''}
                              onChange={(e) =>
                                updateRow(index, 'street', e.target.value)
                              }
                              className={cn(cellInput, 'min-w-[70px]')}
                            />
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <button
                              type="button"
                              onClick={() => removeRow(index)}
                              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {result ? (
            <div className="mt-4 rounded-xl border border-border bg-muted/30 px-3 py-3 text-sm">
              <p className="font-medium text-foreground">
                Created {result.created} · Skipped {result.skipped}
              </p>
              {result.errors.length > 0 ? (
                <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto text-xs text-rose-700">
                  {result.errors.slice(0, 20).map((item) => (
                    <li key={`${item.row}-${item.message}`}>
                      Row {item.row}: {item.message}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-[#fbfafc] px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Close
          </button>
          {reviewing && !result ? (
            <button
              type="button"
              disabled={
                previewing ||
                confirmMutation.isPending ||
                previewRows.length === 0 ||
                previewRows.some(
                  (row) =>
                    !(row.first_name ?? '').toString().trim() ||
                    !(row.last_name ?? '').toString().trim(),
                )
              }
              onClick={() => {
                setError('')
                const rows: CustomerImportRow[] = previewRows.map((row) => {
                  const password = (row.password ?? '').toString().trim()
                  const email = (row.email ?? '').toString().trim()
                  const payload: CustomerImportRow = {
                    row: row.row,
                    first_name: (row.first_name ?? '').toString().trim(),
                    last_name: (row.last_name ?? '').toString().trim(),
                    email: email || null,
                    phone: (row.phone ?? '').toString().trim() || null,
                    phase: (row.phase ?? '').toString().trim() || null,
                    block: (row.block ?? '').toString().trim() || null,
                    lot: (row.lot ?? '').toString().trim() || null,
                    street: (row.street ?? '').toString().trim() || null,
                    date_of_birth:
                      (row.date_of_birth ?? '').toString().trim() || null,
                    registered_at:
                      (row.registered_at ?? '').toString().trim() || null,
                    status: ((row.status as CustomerStatus) || 'active'),
                  }
                  if (password) {
                    payload.password = password
                  }
                  return payload
                })

                if (rows.length === 0) {
                  setError('No members left to import.')
                  return
                }

                confirmMutation.mutate(rows)
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-70"
            >
              {confirmMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Confirm import ({previewRows.length})
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function MissedBillsTable({ bills }: { bills: CustomerBillRow[] }) {
  if (bills.length === 0) {
    return (
      <p className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-3 text-sm text-emerald-800">
        No missed bill payments.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-rose-100">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-rose-100 bg-rose-50/60 text-[11px] font-semibold uppercase tracking-wide text-rose-700">
            <th className="px-3 py-2.5">Bill</th>
            <th className="px-3 py-2.5">Due</th>
            <th className="px-3 py-2.5">Balance</th>
            <th className="px-3 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr key={bill.uuid} className="border-b border-rose-50 last:border-0">
              <td className="px-3 py-2.5">
                <p className="font-medium text-foreground">{bill.title}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {bill.bill_number}
                </p>
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {bill.due_on_label || '—'}
              </td>
              <td className="px-3 py-2.5 font-semibold text-rose-700">
                {bill.balance_label}
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                    billStatusClass(bill.status),
                  )}
                >
                  {bill.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TransactionsTable({
  transactions,
}: {
  transactions: CustomerTransactionRow[]
}) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
        No payment transactions yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5">Date</th>
            <th className="px-3 py-2.5">Reference</th>
            <th className="px-3 py-2.5">Bill</th>
            <th className="px-3 py-2.5">Amount</th>
            <th className="px-3 py-2.5">Method</th>
            <th className="px-3 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx.uuid}
              className="border-b border-border/70 last:border-0"
            >
              <td className="px-3 py-2.5 text-muted-foreground">
                {tx.paid_label || '—'}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs font-semibold text-foreground">
                {tx.reference_number}
              </td>
              <td className="px-3 py-2.5">
                <p className="font-medium text-foreground">
                  {tx.bill_title || '—'}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {tx.bill_number || ''}
                </p>
              </td>
              <td className="px-3 py-2.5 font-semibold text-foreground">
                {tx.amount_label}
              </td>
              <td className="px-3 py-2.5 capitalize text-muted-foreground">
                {tx.payment_method_label}
              </td>
              <td className="px-3 py-2.5">
                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
                  {tx.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function BillsHistoryTable({ bills }: { bills: CustomerBillRow[] }) {
  if (bills.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
        No bills generated for this member yet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5">Bill</th>
            <th className="px-3 py-2.5">Amount</th>
            <th className="px-3 py-2.5">Paid</th>
            <th className="px-3 py-2.5">Balance</th>
            <th className="px-3 py-2.5">Due</th>
            <th className="px-3 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {bills.map((bill) => (
            <tr
              key={bill.uuid}
              className="border-b border-border/70 last:border-0"
            >
              <td className="px-3 py-2.5">
                <p className="font-medium text-foreground">{bill.title}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {bill.bill_number}
                </p>
              </td>
              <td className="px-3 py-2.5 text-foreground">{bill.amount_label}</td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {bill.amount_paid_label}
              </td>
              <td className="px-3 py-2.5 font-medium text-foreground">
                {bill.balance_label}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {bill.due_on_label || '—'}
              </td>
              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize',
                    billStatusClass(bill.status),
                  )}
                >
                  {bill.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CustomerViewModal({
  customerUuid,
  open,
  onClose,
  onEdit,
}: {
  customerUuid: string
  open: boolean
  onClose: () => void
  onEdit: (customer: CustomerDetail) => void
}) {
  const detailQuery = useQuery({
    queryKey: ['merchant-customer-detail', customerUuid],
    queryFn: () => customerService.get(customerUuid),
    enabled: open && !!customerUuid,
  })

  if (!open) return null

  const detail = detailQuery.data

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/35 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)]">
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5 sm:px-7">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Member account
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Profile, missed bills, and full payment history
            </p>
            {detail ? (
              <p className="mt-2 font-mono text-xs font-semibold tracking-wide text-gold-foreground">
                {detail.account_number}
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

        <div className="overflow-y-auto px-6 py-5 sm:px-7">
          {detailQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading member details…
            </div>
          ) : detailQuery.isError || !detail ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              Unable to load member details. Please try again.
            </div>
          ) : (
            <div className="space-y-6">
              <section className="grid gap-4 rounded-2xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
                <InfoRow label="First name" value={detail.first_name} />
                <InfoRow label="Last name" value={detail.last_name || '—'} />
                <InfoRow label="Status" value={detail.status} />
                <InfoRow label="Email" value={detail.email || '—'} />
                <InfoRow label="Phone" value={detail.phone || '—'} />
                <InfoRow
                  label="Date of birth"
                  value={detail.date_of_birth_label || '—'}
                />
                <InfoRow
                  label="Address"
                  value={detail.address_label || '—'}
                />
                <InfoRow
                  label="Registered"
                  value={detail.registered_label || '—'}
                />
                <InfoRow
                  label="Account credit"
                  value={detail.credit_balance_label}
                />
              </section>

              <section className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Bills
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {detail.summary.bill_count}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700">
                    Missed
                  </p>
                  <p className="mt-1 text-2xl font-bold text-rose-700">
                    {detail.summary.missed_count}
                  </p>
                  <p className="mt-0.5 text-xs text-rose-600">
                    {detail.summary.missed_total_label}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-white p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Payments
                  </p>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {detail.summary.transaction_count}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {detail.summary.payment_total_label}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Missed bill payments
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Overdue bills that still have an unpaid balance
                  </p>
                </div>
                <MissedBillsTable bills={detail.missed_bills} />
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Payment history / transactions
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    All payment transactions for this member
                  </p>
                </div>
                <TransactionsTable transactions={detail.transactions} />
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    All bills
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Complete bill list for this account
                  </p>
                </div>
                <BillsHistoryTable bills={detail.bills} />
              </section>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-6 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Close
          </button>
          {detail ? (
            <button
              type="button"
              onClick={() => onEdit(detail)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
            >
              <Pencil className="size-4" />
              Edit account
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function CustomersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selected, setSelected] = useState<Customer | null>(null)
  const [formError, setFormError] = useState('')
  const [banner, setBanner] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const customersQuery = useQuery({
    queryKey: ['merchant-customers', debouncedSearch],
    queryFn: () => customerService.list(debouncedSearch || undefined),
  })

  const createMutation = useMutation({
    mutationFn: customerService.create,
    onSuccess: async () => {
      setModalMode(null)
      setFormError('')
      await queryClient.invalidateQueries({ queryKey: ['merchant-customers'] })
    },
    onError: (error) => {
      setFormError(axiosMessage(error, 'Unable to create member.'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({
      uuid,
      payload,
    }: {
      uuid: string
      payload: CustomerPayload
    }) => customerService.update(uuid, payload),
    onSuccess: async (_data, variables) => {
      setModalMode(null)
      setSelected(null)
      setFormError('')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['merchant-customers'] }),
        queryClient.invalidateQueries({
          queryKey: ['merchant-customer-detail', variables.uuid],
        }),
      ])
    },
    onError: (error) => {
      setFormError(axiosMessage(error, 'Unable to update member.'))
    },
  })

  const customers = useMemo(
    () => customersQuery.data ?? [],
    [customersQuery.data],
  )

  return (
    <MerchantShell>
      <div className="home-rise space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Members
            </h1>
            <p className="mt-1 text-sm text-muted-foreground sm:text-base">
              Create and manage members for your billing account
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setBanner('')
                setUploadOpen(true)
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-white px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-secondary"
            >
              <Upload className="size-4" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => {
                setSelected(null)
                setFormError('')
                setBanner('')
                setModalMode('create')
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[0_10px_24px_-12px_rgb(75_29_110_/_0.7)] transition hover:bg-[#3f1860]"
            >
              <Plus className="size-4 text-gold" />
              Create Member
            </button>
          </div>
        </div>

        {banner ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {banner}
          </div>
        ) : null}

        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members by name, account number, email..."
            className="w-full rounded-2xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] sm:p-6">
          {customersQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin text-primary" />
              Loading members…
            </div>
          ) : customersQuery.isError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-6 text-sm text-rose-700">
              Unable to load members. Please refresh and try again.
            </div>
          ) : customers.length === 0 ? (
            <div className="py-16 text-center">
              <UserRound className="mx-auto size-10 text-primary/40" />
              <p className="mt-3 font-medium text-foreground">No members yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create your first member to start generating bills.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="pb-3 pr-4">Account No.</th>
                    <th className="pb-3 pr-4">First Name</th>
                    <th className="pb-3 pr-4">Last Name</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Address</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Registered</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => (
                    <tr
                      key={customer.uuid}
                      className="border-b border-border/70 last:border-0"
                    >
                      <td className="py-3.5 pr-4">
                        <span className="font-mono text-xs font-semibold text-gold-foreground">
                          {customer.account_number}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4 font-medium text-foreground">
                        {customer.first_name}
                      </td>
                      <td className="py-3.5 pr-4 font-medium text-foreground">
                        {customer.last_name || '—'}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {customer.email || '—'}
                      </td>
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {customer.address_label || '—'}
                      </td>
                      <td className="py-3.5 pr-4">
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
                      <td className="py-3.5 pr-4 text-muted-foreground">
                        {customer.registered_label || '—'}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(customer)
                              setFormError('')
                              setModalMode('view')
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-secondary"
                          >
                            <Eye className="size-3.5" />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelected(customer)
                              setFormError('')
                              setModalMode('edit')
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-muted"
                          >
                            <Pencil className="size-3.5" />
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {uploadOpen ? (
        <UploadMembersModal
          open
          onClose={() => setUploadOpen(false)}
          onImported={async (message) => {
            setBanner(message)
            await queryClient.invalidateQueries({
              queryKey: ['merchant-customers'],
            })
          }}
        />
      ) : null}

      {modalMode === 'create' || modalMode === 'edit' ? (
        <CustomerFormModal
          mode={modalMode}
          customer={selected}
          open
          onClose={() => {
            setModalMode(null)
            setSelected(null)
            setFormError('')
          }}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          error={formError}
          onSubmit={(payload) => {
            if (modalMode === 'create') {
              createMutation.mutate(payload)
              return
            }
            if (selected) {
              updateMutation.mutate({ uuid: selected.uuid, payload })
            }
          }}
        />
      ) : null}

      {modalMode === 'view' && selected ? (
        <CustomerViewModal
          customerUuid={selected.uuid}
          open
          onClose={() => {
            setModalMode(null)
            setSelected(null)
          }}
          onEdit={(detail) => {
            setSelected(detail)
            setFormError('')
            setModalMode('edit')
          }}
        />
      ) : null}
    </MerchantShell>
  )
}
