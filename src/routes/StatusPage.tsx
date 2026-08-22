import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, LoaderCircle, Server, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type HealthResponse = {
  ok: boolean
  service: string
  status: string
  app: string
  env: string
  database?: string
  time: string
  php: string
}

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/health')
  if (!res.ok) {
    throw new Error(`Health check failed (${res.status})`)
  }
  return res.json()
}

function StatusPill({
  ok,
  loading,
  label,
}: {
  ok: boolean
  loading?: boolean
  label: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium',
        loading && 'bg-secondary text-primary',
        !loading && ok && 'bg-[#f4efd8] text-[#5c480f]',
        !loading && !ok && 'bg-rose-100 text-rose-900',
      )}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : ok ? (
        <CheckCircle2 className="size-4 text-gold" />
      ) : (
        <XCircle className="size-4" />
      )}
      {label}
    </div>
  )
}

export default function StatusPage() {
  const health = useQuery({
    queryKey: ['api-health'],
    queryFn: fetchHealth,
    refetchInterval: 15_000,
  })

  const backendOk = health.isSuccess && health.data.ok

  return (
    <main className="relative min-h-screen overflow-hidden bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 70% 50% at 15% 20%, rgb(75 29 110 / 0.06), transparent 55%), radial-gradient(ellipse 55% 45% at 90% 80%, rgb(201 162 39 / 0.08), transparent 50%)',
        }}
      />
      <div
        aria-hidden
        className="status-orb pointer-events-none absolute -left-20 top-24 size-64 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="status-orb pointer-events-none absolute -right-16 bottom-8 size-72 rounded-full bg-gold/15 blur-3xl"
        style={{ animationDelay: '1.4s' }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <img
          src="/lpay-logo.png"
          alt="LPay — Link Payment, bills generation platform"
          className="status-rise h-auto w-full max-w-[280px] object-contain object-left sm:max-w-[340px]"
        />

        <div className="status-rise-delay mt-6 h-px w-40 status-gold-line" />

        <h1 className="status-rise-delay mt-6 max-w-xl text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
          Foundation is ready
        </h1>
        <p className="status-rise-delay mt-3 max-w-lg text-base text-muted-foreground">
          Frontend design is live. Backend health is checked through the Vite
          proxy to Laravel.
        </p>

        <div className="status-rise-delay-2 mt-10 space-y-5">
          <div className="flex flex-wrap gap-3">
            <StatusPill ok loading={false} label="Frontend design working" />
            <StatusPill
              ok={backendOk}
              loading={health.isLoading || health.isFetching}
              label={
                health.isLoading
                  ? 'Checking backend API…'
                  : backendOk
                    ? 'Backend API working'
                    : 'Backend API unreachable'
              }
            />
          </div>

          <div className="border-t border-border pt-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
              <Server className="size-4 text-gold" />
              /api/health
            </div>
            {health.isError ? (
              <p className="text-sm text-rose-700">
                {(health.error as Error).message}. Start{' '}
                <code className="rounded bg-secondary px-1 text-primary">
                  lpay-ws
                </code>{' '}
                with{' '}
                <code className="rounded bg-secondary px-1 text-primary">
                  php artisan serve
                </code>
                .
              </p>
            ) : health.data ? (
              <pre className="overflow-x-auto rounded-xl bg-primary p-4 text-xs leading-relaxed text-primary-foreground">
                {JSON.stringify(health.data, null, 2)}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                Waiting for response…
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
