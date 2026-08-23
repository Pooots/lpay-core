import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { CheckCircle2, LoaderCircle } from 'lucide-react'
import { memberService } from '@/services/memberService'
import type {
  MemberRegistrationFieldKey,
  PublicMemberRegistrationPayload,
  PublicMemberRegistrationResult,
} from '@/types/member'

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

export default function MemberRegisterPage() {
  const navigate = useNavigate()
  const params = useParams({ strict: false }) as { merchantCode?: string }
  const merchantCode = (params.merchantCode ?? '').trim()
  const [values, setValues] = useState<PublicMemberRegistrationPayload>({})
  const [files, setFiles] = useState<Record<string, File>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [result, setResult] = useState<PublicMemberRegistrationResult | null>(
    null,
  )

  const formQuery = useQuery({
    queryKey: ['public-member-registration', merchantCode],
    queryFn: () => memberService.getPublicRegistrationForm(merchantCode),
    enabled: Boolean(merchantCode),
    retry: false,
  })

  const submitMutation = useMutation({
    mutationFn: () =>
      memberService.submitPublicRegistration(merchantCode, values, files),
    onSuccess: (data) => {
      setError('')
      setResult(data)
    },
    onError: (err) => {
      setError(axiosMessage(err, 'Unable to complete registration.'))
    },
  })

  const fields = formQuery.data?.fields ?? []
  const merchant = formQuery.data?.merchant

  const canSubmit = useMemo(() => {
    return fields.every((field) => {
      if (!field.required) return true
      if (field.type === 'image') return Boolean(files[field.key])
      return Boolean((values[field.key] ?? '').trim())
    })
  }, [fields, values, files])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      setError('Please complete the required fields.')
      return
    }
    submitMutation.mutate()
  }

  const setImageFile = (key: string, file: File | null) => {
    setFiles((prev) => {
      const next = { ...prev }
      if (!file) delete next[key]
      else next[key] = file
      return next
    })
    setPreviews((prev) => {
      const next = { ...prev }
      if (prev[key]) URL.revokeObjectURL(prev[key])
      if (!file) delete next[key]
      else next[key] = URL.createObjectURL(file)
      return next
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

      <div className="relative mx-auto max-w-xl px-5 pb-16 pt-10 sm:px-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <Link to="/" className="shrink-0">
            <img
              src="/lpay-logo.png"
              alt="iLpay"
              className="h-auto max-h-12 w-auto object-contain"
            />
          </Link>
        </header>

        {!merchantCode ? (
          <section className="rounded-3xl border border-border bg-white p-8 text-center shadow-[0_20px_50px_-28px_rgb(75_29_110_/_0.3)]">
            <h1 className="text-xl font-bold text-foreground">
              Invalid registration link
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask your merchant for a valid registration link.
            </p>
          </section>
        ) : formQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            Loading registration form…
          </div>
        ) : formQuery.isError || !merchant ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
            <h1 className="text-xl font-bold text-rose-800">
              Registration unavailable
            </h1>
            <p className="mt-2 text-sm text-rose-700">
              {axiosMessage(
                formQuery.error,
                'Unable to load this registration form.',
              )}
            </p>
          </section>
        ) : result ? (
          <section className="rounded-3xl border border-border bg-white p-7 shadow-[0_20px_50px_-28px_rgb(75_29_110_/_0.3)]">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-6 text-emerald-600" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  You’re registered
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Welcome to {result.merchant.name}. Save your account number
                  to access bills and payments.
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-primary/15 bg-secondary/60 px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Account number
              </p>
              <p className="mt-1 font-mono text-lg font-bold text-primary">
                {result.account_number}
              </p>
              <p className="mt-2 text-sm text-foreground">{result.full_name}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                void navigate({
                  to: '/account',
                  search: { account: result.account_number, paid: undefined },
                })
              }
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
            >
              Go to my account
            </button>
          </section>
        ) : (
          <section className="rounded-3xl border border-border bg-white p-6 shadow-[0_20px_50px_-28px_rgb(75_29_110_/_0.3)] sm:p-7">
            <div className="rounded-2xl border border-primary/15 bg-gradient-to-r from-[#4B1D6E] to-[#6b3a8f] px-4 py-4 text-white">
              <div className="flex items-start gap-3.5">
                {merchant.logo_url ? (
                  <div className="shrink-0 rounded-xl bg-white p-1.5 shadow-sm">
                    <img
                      src={merchant.logo_url}
                      alt={`${merchant.name} logo`}
                      className="size-14 rounded-lg object-contain sm:size-16"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f3e6b0]">
                    Member registration
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight">
                    {merchant.name}
                  </h1>
                  <p className="mt-1 text-sm text-white/80">
                    Complete the form below to register as a member.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
              {fields.map((field) => (
                <label key={field.key} className="block text-sm">
                  <span className="mb-1.5 block font-medium text-foreground">
                    {field.label}
                    {field.required ? (
                      <span className="text-rose-600"> *</span>
                    ) : null}
                  </span>
                  {field.type === 'textarea' ? (
                    <textarea
                      required={field.required}
                      rows={3}
                      value={values[field.key as MemberRegistrationFieldKey] ?? ''}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  ) : field.type === 'image' ? (
                    <div className="space-y-2">
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                        required={field.required && !files[field.key]}
                        onChange={(e) =>
                          setImageFile(
                            field.key,
                            e.target.files?.[0] ?? null,
                          )
                        }
                        className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary"
                      />
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG, WEBP or GIF · max 5MB
                      </p>
                      {previews[field.key] ? (
                        <img
                          src={previews[field.key]}
                          alt={`${field.label} preview`}
                          className="max-h-40 rounded-xl border border-border object-contain"
                        />
                      ) : null}
                    </div>
                  ) : (
                    <input
                      type={
                        field.type === 'number'
                          ? 'number'
                          : field.type === 'date'
                            ? 'date'
                            : field.type === 'email'
                              ? 'email'
                              : 'text'
                      }
                      required={field.required}
                      value={values[field.key as MemberRegistrationFieldKey] ?? ''}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-white px-3 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  )}
                </label>
              ))}

              {error ? (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitMutation.isPending || !canSubmit}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860] disabled:opacity-60"
              >
                {submitMutation.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                Submit registration
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  )
}
