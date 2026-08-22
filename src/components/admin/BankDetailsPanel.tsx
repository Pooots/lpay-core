import { useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'
import { LoaderCircle, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { useDialog } from '@/components/ui/AppDialog'
import type { MerchantBank, MerchantBankPayload } from '@/types/settings'

type BankHandlers = {
  onCreate: (payload: MerchantBankPayload) => Promise<MerchantBank>
  onUpdate: (
    uuid: string,
    payload: Partial<MerchantBankPayload>,
  ) => Promise<MerchantBank>
  onDelete: (uuid: string) => Promise<void>
  onChanged: () => Promise<void>
}

const emptyForm: MerchantBankPayload = {
  bank_name: '',
  account_name: '',
  account_number: '',
  account_type: 'savings',
  branch: '',
  is_primary: false,
  notes: '',
}

const inputClass =
  'mt-1.5 w-full rounded-xl border border-border px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export function BankDetailsPanel({
  banks,
  handlers,
  canManage = true,
}: {
  banks: MerchantBank[]
  handlers: BankHandlers
  canManage?: boolean
}) {
  const dialog = useDialog()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<MerchantBank | null>(null)
  const [form, setForm] = useState<MerchantBankPayload>(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: MerchantBankPayload = {
        bank_name: form.bank_name.trim(),
        account_name: form.account_name.trim(),
        account_number: form.account_number.trim(),
        account_type: form.account_type || 'savings',
        branch: form.branch?.trim() || null,
        is_primary: Boolean(form.is_primary),
        notes: form.notes?.trim() || null,
      }
      if (editing) {
        return handlers.onUpdate(editing.uuid, payload)
      }
      return handlers.onCreate(payload)
    },
    onSuccess: async () => {
      setError('')
      setSuccess(editing ? 'Bank account updated.' : 'Bank account added.')
      setModalOpen(false)
      setEditing(null)
      setForm(emptyForm)
      await handlers.onChanged()
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to save bank account.'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (uuid: string) => handlers.onDelete(uuid),
    onSuccess: async () => {
      setError('')
      setSuccess('Bank account removed.')
      await handlers.onChanged()
    },
    onError: (err) => {
      setSuccess('')
      setError(axiosMessage(err, 'Unable to remove bank account.'))
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, is_primary: banks.length === 0 })
    setError('')
    setModalOpen(true)
  }

  const openEdit = (bank: MerchantBank) => {
    setEditing(bank)
    setForm({
      bank_name: bank.bank_name,
      account_name: bank.account_name,
      account_number: bank.account_number,
      account_type: bank.account_type || 'savings',
      branch: bank.branch ?? '',
      is_primary: bank.is_primary,
      notes: bank.notes ?? '',
    })
    setError('')
    setModalOpen(true)
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    setSuccess('')
    saveMutation.mutate()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Recorded bank accounts
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Banks used for payouts and settlement transfers
          </p>
        </div>
        {canManage ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860]"
          >
            <Plus className="size-4" />
            Add bank
          </button>
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

      {banks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-[#fcfaff] px-4 py-10 text-center text-sm text-muted-foreground">
          No bank accounts recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fcfaff] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3">Account name</th>
                <th className="px-4 py-3">Account number</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Branch</th>
                {canManage ? (
                  <th className="px-4 py-3 text-right">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {banks.map((bank) => (
                <tr key={bank.uuid} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-semibold text-foreground">
                      {bank.bank_name}
                      {bank.is_primary ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                          <Star className="size-3 fill-current" />
                          Primary
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {bank.account_name}
                  </td>
                  <td className="px-4 py-3 font-mono text-foreground">
                    {bank.account_number}
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    {bank.account_type_label}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {bank.branch || '—'}
                  </td>
                  {canManage ? (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(bank)}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-primary transition hover:bg-secondary"
                          aria-label="Edit bank"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void (async () => {
                              const ok = await dialog.confirm({
                                title: 'Remove bank account',
                                message: `Remove ${bank.bank_name} account ${bank.account_number}?`,
                                confirmLabel: 'Remove',
                                cancelLabel: 'Cancel',
                                tone: 'danger',
                              })
                              if (ok) deleteMutation.mutate(bank.uuid)
                            })()
                          }}
                          disabled={deleteMutation.isPending}
                          className="inline-flex size-8 items-center justify-center rounded-lg border border-rose-200 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                          aria-label="Delete bank"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6">
              <button
                type="button"
                className="absolute inset-0 bg-[#2a1a3d]/40 backdrop-blur-sm"
                aria-label="Close dialog"
                onClick={() => setModalOpen(false)}
              />
              <div className="relative flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)]">
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {editing ? 'Edit bank account' : 'Add bank account'}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Enter the merchant payout bank details
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <form
                  onSubmit={onSubmit}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 sm:px-6">
                    <Field label="Bank name">
                      <input
                        required
                        value={form.bank_name}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            bank_name: e.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder="e.g. BDO Unibank"
                      />
                    </Field>
                    <Field label="Account name">
                      <input
                        required
                        value={form.account_name}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            account_name: e.target.value,
                          }))
                        }
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Account number">
                      <input
                        required
                        value={form.account_number}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            account_number: e.target.value,
                          }))
                        }
                        className={`${inputClass} font-mono`}
                      />
                    </Field>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Account type">
                        <select
                          value={form.account_type}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              account_type: e.target.value,
                            }))
                          }
                          className={inputClass}
                        >
                          <option value="savings">Savings</option>
                          <option value="checking">Checking</option>
                          <option value="current">Current</option>
                        </select>
                      </Field>
                      <Field label="Branch (optional)">
                        <input
                          value={form.branch ?? ''}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              branch: e.target.value,
                            }))
                          }
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    <Field label="Notes (optional)">
                      <textarea
                        value={form.notes ?? ''}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        rows={2}
                        className={`${inputClass} resize-y`}
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={Boolean(form.is_primary)}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            is_primary: e.target.checked,
                          }))
                        }
                        className="size-4 accent-[#4B1D6E]"
                      />
                      Set as primary payout account
                    </label>
                  </div>

                  <div className="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-[#fcfaff]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
                    >
                      {saveMutation.isPending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : null}
                      {editing ? 'Save changes' : 'Add bank'}
                    </button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
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
