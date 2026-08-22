import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import axios from 'axios'
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { adminAuthService } from '@/services/adminAuthService'
import { cn } from '@/lib/utils'

export default function SuperAdminLoginPage() {
  const navigate = useNavigate()
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
      await adminAuthService.login({ email, password })
      await navigate({ to: '/admin/super/dashboard', replace: true })
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fcfaff] px-6 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 55% 40% at 50% 0%, rgb(75 29 110 / 0.08), transparent 55%), radial-gradient(ellipse 40% 35% at 85% 85%, rgb(201 162 39 / 0.08), transparent 50%)',
        }}
      />

      <div className="home-rise relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link to="/">
            <img
              src="/lpay-logo.png"
              alt="LPay"
              className="h-auto max-h-14 w-auto object-contain"
            />
          </Link>
          <div className="mt-3 h-px w-16 home-gold-line" />
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            Super Admin Portal
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-border bg-white p-6 shadow-[0_20px_50px_-24px_rgb(75_29_110_/_0.35)] sm:p-8"
        >
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_rgb(75_29_110_/_0.55)]">
            <ShieldCheck className="size-6" />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Enter your super admin email and password.
          </p>

          {error ? (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <label
            htmlFor="admin-email"
            className="mt-6 block text-sm font-semibold text-foreground"
          >
            Email
          </label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@lpay.com"
              className={cn(
                'w-full rounded-xl border border-border bg-white py-3 pl-10 pr-4 text-sm text-foreground outline-none transition',
                'placeholder:text-muted-foreground/70',
                'focus:border-primary focus:ring-2 focus:ring-primary/20',
              )}
            />
          </div>

          <label
            htmlFor="admin-password"
            className="mt-4 block text-sm font-semibold text-foreground"
          >
            Password
          </label>
          <div className="relative mt-2">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="admin-password"
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
        </form>
      </div>
    </main>
  )
}
