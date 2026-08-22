import { useEffect, useState } from 'react'
import { Link, useParams, useSearch } from '@tanstack/react-router'
import { LoaderCircle, XCircle } from 'lucide-react'
import { portalService } from '@/services/portalService'

export default function PaymentCancelPage() {
  const { paymentUuid } = useParams({ from: '/payment/cancel/$paymentUuid' })
  const search = useSearch({ from: '/payment/cancel/$paymentUuid' }) as {
    account?: string
  }
  const accountNumber = (search.account ?? '').trim()

  const [message, setMessage] = useState('Cancelling checkout…')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const result = await portalService.cancelPayment(paymentUuid)
        if (cancelled) return
        setMessage(result.message ?? 'Payment cancelled.')
      } catch {
        if (cancelled) return
        setMessage('Checkout was cancelled. No payment was recorded.')
      } finally {
        if (!cancelled) setDone(true)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [paymentUuid])

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#fcfaff] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 text-center shadow-[0_20px_50px_-28px_rgb(75_29_110_/_0.3)]">
        {done ? (
          <XCircle className="mx-auto size-10 text-rose-600" />
        ) : (
          <LoaderCircle className="mx-auto size-10 animate-spin text-primary" />
        )}
        <h1 className="mt-4 text-xl font-bold text-foreground">
          Payment cancelled
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>

        <div className="mt-6 flex flex-col gap-2">
          {accountNumber ? (
            <Link
              to="/account"
              search={{ account: accountNumber, paid: undefined }}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
            >
              Back to account
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
