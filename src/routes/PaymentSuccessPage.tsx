import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { portalService } from '@/services/portalService'

export default function PaymentSuccessPage() {
  const navigate = useNavigate()
  const { paymentUuid } = useParams({ from: '/payment/success/$paymentUuid' })
  const search = useSearch({ from: '/payment/success/$paymentUuid' }) as {
    account?: string
  }
  const accountNumber = (search.account ?? '').trim()

  const [phase, setPhase] = useState<'verifying' | 'success' | 'pending' | 'failed'>(
    'verifying',
  )
  const [message, setMessage] = useState('Confirming your payment with PayMongo…')
  const [reference, setReference] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let attempts = 0

    const verify = async () => {
      try {
        const result = await portalService.completePayment(paymentUuid)
        if (cancelled) return

        const status = result.status ?? result.data.payment.status
        setReference(result.data.payment.reference_number)
        setMessage(result.message ?? 'Payment confirmed.')

        if (status === 'completed') {
          setPhase('success')
          window.setTimeout(() => {
            void navigate({
              to: '/account',
              search: {
                account: accountNumber || undefined,
                paid: result.data.payment.reference_number,
              },
            })
          }, 1800)
          return
        }

        if (status === 'pending') {
          attempts += 1
          if (attempts < 5) {
            setPhase('pending')
            setMessage('Payment still processing. Checking again…')
            window.setTimeout(() => {
              void verify()
            }, 2500)
            return
          }
          setPhase('pending')
          setMessage(
            'Payment is still pending. You can refresh this page or check your account shortly.',
          )
          return
        }

        setPhase('failed')
        setMessage(result.message ?? 'Payment could not be confirmed.')
      } catch (err) {
        if (cancelled) return
        attempts += 1
        if (attempts < 4) {
          setPhase('pending')
          setMessage('Still verifying payment…')
          window.setTimeout(() => {
            void verify()
          }, 2500)
          return
        }
        setPhase('failed')
        setMessage(
          err instanceof Error
            ? err.message
            : 'Unable to verify payment. Please check your account.',
        )
      }
    }

    void verify()

    return () => {
      cancelled = true
    }
  }, [paymentUuid, accountNumber, navigate])

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#fcfaff] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-[0_20px_50px_-28px_rgb(75_29_110_/_0.3)]">
        {phase === 'verifying' || phase === 'pending' ? (
          <LoaderCircle className="mx-auto size-10 animate-spin text-primary" />
        ) : phase === 'success' ? (
          <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
        ) : (
          <XCircle className="mx-auto size-10 text-rose-600" />
        )}

        <h1 className="mt-4 text-xl font-bold text-foreground">
          {phase === 'success'
            ? 'Payment successful'
            : phase === 'failed'
              ? 'Payment not confirmed'
              : 'Verifying payment'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {reference ? (
          <p className="mt-3 font-mono text-xs font-semibold text-gold-foreground">
            {reference}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {accountNumber ? (
            <Link
              to="/account"
              search={{ account: accountNumber, paid: reference || undefined }}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
            >
              Go to account
            </Link>
          ) : (
            <Link
              to="/"
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
            >
              Go to home
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
