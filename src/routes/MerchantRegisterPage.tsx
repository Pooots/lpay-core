import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Receipt,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import { merchantAuthService } from '@/services/merchantAuthService'
import { cn } from '@/lib/utils'

const steps = [
  {
    title: 'Create your merchant account',
    detail: 'Register your business — no plan is required at signup.',
  },
  {
    title: 'Sign in and choose a plan',
    detail: 'Browse modules in view-only mode, then pick the plan that fits.',
  },
  {
    title: 'Pay to activate modules',
    detail: 'Unlock billing, collections, and member tools after payment.',
  },
] as const

const capabilities = [
  { label: 'Generate bills', icon: FileText },
  { label: 'Collect payments', icon: WalletCards },
  { label: 'Issue receipts', icon: Receipt },
] as const

export default function MerchantRegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (password !== passwordConfirmation) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await merchantAuthService.register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: passwordConfirmation,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
      })
      await navigate({
        to: '/admin/dashboard',
        replace: true,
      })
    } catch (requestError) {
      const message = axios.isAxiosError(requestError)
        ? (requestError.response?.data?.message as string | undefined) ||
          (requestError.response?.data?.errors
            ? Object.values(
                requestError.response.data.errors as Record<string, string[]>,
              )
                .flat()
                .join(' ')
            : undefined)
        : null
      setError(message ?? 'Unable to create merchant account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="relative order-2 hidden overflow-hidden bg-primary lg:order-1 lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-12 xl:px-14">
        <div
          aria-hidden
          className="register-glow pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-[radial-gradient(circle,rgb(232_197_71_/_0.35),transparent_68%)]"
        />
        <div
          aria-hidden
          className="register-orb pointer-events-none absolute right-10 top-28 size-40 rounded-full bg-white/5 blur-2xl"
        />
        <div
          aria-hidden
          className="register-orb-delay pointer-events-none absolute -bottom-16 left-8 size-56 rounded-full bg-[radial-gradient(circle,rgb(255_255_255_/_0.12),transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(135deg, transparent 40%, rgb(255 255 255 / 0.04) 50%, transparent 60%)',
          }}
        />

        <div className="relative">
          <Link
            to="/"
            className="register-panel-item register-panel-item-1 mb-8 inline-block"
          >
            <img
              src="/lpay-logo.png"
              alt="iLPay"
              className="h-12 w-auto object-contain brightness-0 invert"
            />
          </Link>

          <span className="register-panel-item register-panel-item-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold">
            <Sparkles className="size-3.5" />
            For businesses
          </span>

          <h2 className="register-panel-item register-panel-item-3 mt-6 max-w-md text-3xl font-bold tracking-tight text-white xl:text-[2.15rem] xl:leading-tight">
            iLPay is your bill payment generation platform.
          </h2>
          <p className="register-panel-item register-panel-item-4 mt-4 max-w-md text-sm leading-relaxed text-white/80">
            Create member bills, accept online and manual payments, track
            collections, and issue receipts — built for clubs, communities, and
            service businesses that need a simple way to get paid.
          </p>

          <div className="register-panel-item register-panel-item-5 mt-6 flex flex-wrap gap-2">
            {capabilities.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90"
              >
                <Icon className="size-3.5 text-gold" />
                {label}
              </span>
            ))}
          </div>

          <ol className="register-panel-item register-panel-item-6 mt-9 space-y-3">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className={cn(
                  'register-step register-step-card flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3',
                  `register-step-${index + 1}`,
                )}
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/15 text-sm font-bold text-gold">
                  {index + 1}
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/70">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="register-panel-item register-panel-item-6 relative mt-10 space-y-3 border-t border-white/10 pt-6">
          <p className="flex items-start gap-2 text-sm leading-relaxed text-white/85">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" />
            <span>
              Registration is free. Your account starts as{' '}
              <strong className="font-semibold text-white">Pending</strong> until
              you activate a plan.
            </span>
          </p>
          <p className="flex items-start gap-2 text-sm leading-relaxed text-white/75">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-gold" />
            <span>
              Pending merchants can browse modules in view-only mode — no
              transactions until activation.
            </span>
          </p>
        </div>
      </section>

      <section className="order-1 flex min-h-screen flex-col bg-[#fcfaff] px-6 py-8 sm:px-10 lg:order-2 lg:px-12 lg:py-10">
        <div className="shrink-0 lg:hidden">
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

          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Create merchant account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join iLPay — the bill payment generation platform. Create your
            account free, then choose and pay a plan after login to activate
            modules.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-3xl border border-border bg-white p-6 shadow-[0_20px_50px_-24px_rgb(75_29_110_/_0.35)] sm:p-8"
          >
            {error ? (
              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <label
              htmlFor="merchant-name"
              className="block text-sm font-semibold text-foreground"
            >
              Business / merchant name
            </label>
            <div className="relative mt-2">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="merchant-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aurora Digital Studio"
                className={cn(
                  'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none transition',
                  'placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20',
                )}
              />
            </div>

            <label
              htmlFor="register-email"
              className="mt-4 block text-sm font-semibold text-foreground"
            >
              Email
            </label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@business.ph"
                className={cn(
                  'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none transition',
                  'placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20',
                )}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="register-password"
                  className="block text-sm font-semibold text-foreground"
                >
                  Password
                </label>
                <div className="relative mt-2">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className={cn(
                      'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-11 text-sm outline-none transition',
                      'placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  htmlFor="register-password-confirm"
                  className="block text-sm font-semibold text-foreground"
                >
                  Confirm password
                </label>
                <div className="relative mt-2">
                  <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="register-password-confirm"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Repeat password"
                    className={cn(
                      'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none transition',
                      'placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20',
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="register-phone"
                  className="block text-sm font-semibold text-foreground"
                >
                  Phone <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <div className="relative mt-2">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="register-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+63 917 000 0000"
                    className={cn(
                      'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none transition',
                      'placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20',
                    )}
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="register-address"
                  className="block text-sm font-semibold text-foreground"
                >
                  Address <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <div className="relative mt-2">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="register-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="City, Philippines"
                    className={cn(
                      'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm outline-none transition',
                      'placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20',
                    )}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:opacity-70"
            >
              {isSubmitting ? 'Creating account…' : 'Create merchant account'}
              {!isSubmitting ? <ArrowRight className="size-4" /> : null}
            </button>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                to="/admin/login"
                className="font-semibold text-primary hover:underline"
              >
                Login as Merchant
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  )
}
