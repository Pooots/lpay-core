import { MerchantShell } from '@/components/admin/MerchantShell'

export default function MerchantComingSoonPage({ title }: { title: string }) {
  return (
    <MerchantShell>
      <div className="rounded-2xl border border-border bg-white p-8 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <div className="mt-4 h-px w-16 home-gold-line" />
        <p className="mt-4 text-muted-foreground">
          This module is coming soon for your merchant account.
        </p>
      </div>
    </MerchantShell>
  )
}
