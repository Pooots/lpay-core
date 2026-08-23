import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import axios from 'axios'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  Mail,
  Receipt,
  WalletCards,
} from 'lucide-react'
import { merchantAuthService } from '@/services/merchantAuthService'
import { cn } from '@/lib/utils'

const highlights = [
  {
    title: 'Generate bills fast',
    description: 'Create and send customer bills in minutes.',
    icon: FileText,
  },
  {
    title: 'Collect payments',
    description: 'Accept payments and track collections in one place.',
    icon: WalletCards,
  },
  {
    title: 'Issue receipts',
    description: 'Give customers clear payment confirmations instantly.',
    icon: Receipt,
  },
] as const

export default function MerchantLoginPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { registered?: string }
  const justRegistered = search.registered === '1'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await merchantAuthService.login({ email, password })
      await navigate({ to: '/admin/dashboard', replace: true })
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? (requestError.response?.data?.message as string | undefined)
        : null
      setError(message ?? 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Left: logo (top-left) + login */}
      <section className="flex min-h-screen flex-col bg-[#fcfaff] px-6 py-8 sm:px-10 lg:px-12 lg:py-10">
        <div className="shrink-0">
          <Link to="/" className="inline-block">
            <img
              src="/lpay-logo.png"
              alt="LPay"
              className="h-12 w-auto object-contain"
            />
          </Link>
          <p className="mt-2 text-xs font-semibold tracking-[0.22em] text-primary">
            CONNECT. BILL. PAY.
          </p>
        </div>

        <div className="home-rise mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <div className="mb-2 h-px w-16 home-gold-line" />

          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Merchant sign in
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Access your LPay merchant account to manage bills and payments.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-[0_20px_50px_-24px_rgb(75_29_110_/_0.35)] sm:p-8"
          >
            {justRegistered ? (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                Account created. Sign in, then choose a plan under Plan to
                activate.
              </div>
            ) : null}
            {error ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <label
              htmlFor="merchant-email"
              className="block text-sm font-semibold text-foreground"
            >
              Email
            </label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="merchant-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="merchant@business.ph"
                className={cn(
                  'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-foreground outline-none transition',
                  'placeholder:text-muted-foreground/70',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                )}
              />
            </div>

            <label
              htmlFor="merchant-password"
              className="mt-4 block text-sm font-semibold text-foreground"
            >
              Password
            </label>
            <div className="relative mt-2">
              <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="merchant-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className={cn(
                  'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-11 text-sm text-foreground outline-none transition',
                  'placeholder:text-muted-foreground/70',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              New to LPay?{' '}
              <Link
                to="/merchant/register"
                className="font-semibold text-primary hover:underline"
              >
                Create Merchant
              </Link>
            </p>
          </form>
        </div>
      </section>

      {/* Right: Merchant Portal information */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#4B1D6E] via-[#5A2480] to-[#2F1248] px-10 py-12 text-white lg:flex lg:flex-col xl:px-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgb(201 162 39 / 0.35), transparent 40%), radial-gradient(circle at 80% 80%, rgb(255 255 255 / 0.08), transparent 45%)',
          }}
        />

        <div className="relative my-auto max-w-lg">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#E8C547]">
            Merchant Portal
          </p>
          <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
            Bills generation and payment for your customers.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-white/80">
            LPay helps merchants create bills, collect payments, and manage
            customer receipts — simple, secure, and built for everyday billing.
          </p>

          <ul className="mt-10 space-y-4">
            {highlights.map(({ title, description, icon: Icon }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-[#E8C547] ring-1 ring-white/15">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-sm text-white/70">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <ul className="relative mt-auto space-y-2 pt-10 text-sm text-white/75">
          {[
            'Built for merchant billing workflows',
            'Secure payment collection',
            'Clear customer bill and receipt history',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle2 className="size-4 text-[#E8C547]" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
