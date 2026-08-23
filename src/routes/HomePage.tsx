import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Headphones,
  Lock,
  Receipt,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    title: 'View pending bills',
    description: 'See all your due invoices in one place.',
    icon: FileText,
  },
  {
    title: 'Pay securely',
    description: 'Card, UPI, bank transfer & wallets.',
    icon: CreditCard,
  },
  {
    title: 'Track payment history',
    description: 'Every payment and receipt, organized.',
    icon: Receipt,
  },
  {
    title: 'Statement of account',
    description: 'Download or print your full SOA.',
    icon: BarChart3,
  },
] as const

const trustItems = [
  { label: '256-bit encrypted', icon: Lock },
  { label: 'Instant confirmation', icon: Clock3 },
  { label: '24/7 support', icon: Headphones },
] as const

const paymentMethods = [
  'Visa',
  'Mastercard',
  'UPI',
  'Bank Transfer',
  'Wallet',
] as const

export default function HomePage() {
  const navigate = useNavigate()
  const [accountNumber, setAccountNumber] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = accountNumber.trim()
    if (!value) {
      setError('Please enter your account number.')
      return
    }
    setError('')
    void navigate({
      to: '/account',
      search: { account: value, paid: undefined },
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

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-10 sm:pt-14">
        <header className="home-rise mb-8 flex flex-col items-center text-center sm:mb-10">
          <img
            src="/lpay-logo.png"
            alt="LPay — Link Payment"
            className="h-auto w-auto max-h-14 object-contain sm:max-h-16"
          />
          <p className="mt-3 text-[11px] font-semibold tracking-[0.28em] text-primary sm:text-xs">
            CONNECT. BILL. PAY.
          </p>
          <div className="mt-3 h-px w-16 home-gold-line" />
        </header>

        <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <section className="home-rise-delay order-1">
            <h1 className="max-w-xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Pay your bills with LPay, the simple way.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Enter your account number to instantly access your pending bills,
              payment history, and statement of account on LPay — no login
              required.
            </p>

            <div className="mt-8 hidden gap-3 sm:grid-cols-2 lg:grid">
              {features.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-white/90 p-4 shadow-[0_1px_0_rgb(75_29_110_/_0.04)]"
                >
                  <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-4" strokeWidth={2} />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <ul className="mt-8 hidden flex-wrap gap-x-6 gap-y-3 lg:flex">
              {trustItems.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-secondary text-gold">
                    <Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <section className="home-rise-delay-2 order-2 lg:sticky lg:top-10">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-border bg-white p-6 shadow-[0_20px_50px_-24px_rgb(75_29_110_/_0.35)] sm:p-8"
            >
              <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_rgb(75_29_110_/_0.55)]">
                <CreditCard className="size-5" />
              </div>

              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Access My Account
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your account number to view and pay your bills.
              </p>

              <label
                htmlFor="account-number"
                className="mt-6 block text-sm font-semibold text-foreground"
              >
                Account Number
              </label>
              <input
                id="account-number"
                name="accountNumber"
                type="text"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value)
                  setError('')
                }}
                placeholder="e.g. WR-T3Z4-082126-W2H7"
                autoComplete="off"
                className={cn(
                  'mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition',
                  'placeholder:text-muted-foreground/70',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                  error &&
                    'border-rose-300 focus:border-rose-400 focus:ring-rose-200',
                )}
              />
              {error ? (
                <p className="mt-2 text-sm text-rose-600">{error}</p>
              ) : null}

              <button
                type="submit"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
              >
                Access My Account
                <ArrowRight className="size-4" />
              </button>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 className="size-4 text-gold" />
                Secure payment portal
              </p>

              <div className="mt-6 border-t border-border pt-5">
                <p className="text-center text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
                  WE ACCEPT
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  {paymentMethods.map((method) => (
                    <span
                      key={method}
                      className="rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </form>
          </section>

          <section className="order-3 space-y-8 lg:hidden">
            <div className="grid gap-3 sm:grid-cols-2">
              {features.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-border bg-white/90 p-4 shadow-[0_1px_0_rgb(75_29_110_/_0.04)]"
                >
                  <div className="mb-3 flex size-9 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="size-4" strokeWidth={2} />
                  </div>
                  <h2 className="text-sm font-semibold text-foreground">
                    {title}
                  </h2>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {trustItems.map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <span className="flex size-7 items-center justify-center rounded-lg bg-secondary text-gold">
                    <Icon className="size-3.5" strokeWidth={2.25} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="home-rise mt-14 border-t border-border/80 pt-12 sm:mt-16">
          <div className="mb-6 text-center sm:mb-8 sm:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-foreground">
              For merchants
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Run billing on LPay
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Sign in to your merchant portal, or create a new account and
              choose a plan after your first login.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to="/admin/login"
              className="group relative overflow-hidden rounded-3xl border border-border bg-white p-6 shadow-[0_16px_40px_-28px_rgb(75_29_110_/_0.4)] transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_22px_48px_-24px_rgb(75_29_110_/_0.45)] sm:p-7"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-secondary/80 transition group-hover:bg-secondary"
              />
              <div className="relative mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_rgb(75_29_110_/_0.55)]">
                <UserRound className="size-5" />
              </div>
              <h3 className="relative text-xl font-bold tracking-tight text-foreground">
                Login as Merchant
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                Access your dashboard to manage members, generate bills, and
                track collections.
              </p>
              <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Go to merchant sign in
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>

            <Link
              to="/merchant/register"
              className="group relative overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-secondary via-white to-white p-6 shadow-[0_16px_40px_-28px_rgb(75_29_110_/_0.4)] transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_22px_48px_-24px_rgb(75_29_110_/_0.45)] sm:p-7"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-10 size-32 rounded-full bg-primary/5"
              />
              <div className="relative mb-5 flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-white text-primary shadow-[0_8px_20px_-10px_rgb(75_29_110_/_0.4)]">
                <Building2 className="size-5" />
              </div>
              <div className="relative mb-2 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <Sparkles className="size-3 text-gold" />
                New merchants
              </div>
              <h3 className="relative text-xl font-bold tracking-tight text-foreground">
                Create Merchant
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">
                Register your business, then pick a plan and pay to activate
                modules when you sign in.
              </p>
              <span className="relative mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Create merchant account
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
