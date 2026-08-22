import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { Download, Expand, X } from 'lucide-react'
import { useDialog } from '@/components/ui/AppDialog'
import { merchantPayUrl } from '@/lib/merchantPay'

function resolveLogoUrl(logoUrl?: string | null): string | undefined {
  if (!logoUrl) return undefined
  if (logoUrl.startsWith('/')) return logoUrl
  try {
    const parsed = new URL(logoUrl)
    if (parsed.pathname.startsWith('/storage/')) {
      return parsed.pathname + parsed.search
    }
  } catch {
    // keep original
  }
  return logoUrl
}

export function MerchantCodeQr({
  code,
  logoUrl,
  size = 148,
}: {
  code: string
  logoUrl?: string | null
  size?: number
}) {
  const dialog = useDialog()
  const payUrl = useMemo(() => merchantPayUrl(code), [code])
  const resolvedLogo = useMemo(() => resolveLogoUrl(logoUrl), [logoUrl])
  const [open, setOpen] = useState(false)
  const previewRef = useRef<HTMLCanvasElement>(null)
  const modalRef = useRef<HTMLCanvasElement>(null)

  const imageSettings = useMemo(() => {
    if (!resolvedLogo) return undefined
    return {
      src: resolvedLogo,
      height: Math.round(size * 0.22),
      width: Math.round(size * 0.22),
      excavate: true,
    }
  }, [resolvedLogo, size])

  const modalSize = 280
  const modalImageSettings = useMemo(() => {
    if (!resolvedLogo) return undefined
    return {
      src: resolvedLogo,
      height: Math.round(modalSize * 0.22),
      width: Math.round(modalSize * 0.22),
      excavate: true,
    }
  }, [resolvedLogo])

  const downloadPng = () => {
    const canvas = modalRef.current ?? previewRef.current
    if (!canvas) return

    try {
      const link = document.createElement('a')
      link.download = `lpay-qr-${code.toLowerCase()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      void dialog.alert({
        title: 'Download failed',
        message: 'Unable to download QR image. Please try again.',
        tone: 'danger',
        confirmLabel: 'OK',
      })
    }
  }

  return (
    <>
      <div className="inline-flex flex-col items-center gap-3 rounded-2xl border border-border bg-[#fcfaff] p-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative rounded-xl bg-white p-3 shadow-[0_8px_20px_-16px_rgb(75_29_110_/_0.45)] transition hover:ring-2 hover:ring-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="View and download QR code"
          title="Click to enlarge and download"
        >
          <QRCodeCanvas
            ref={previewRef}
            value={payUrl}
            size={size}
            bgColor="#ffffff"
            fgColor="#4B1D6E"
            level={resolvedLogo ? 'H' : 'M'}
            includeMargin={false}
            imageSettings={imageSettings}
          />
          <span className="pointer-events-none absolute inset-x-0 bottom-2 mx-auto flex w-fit items-center gap-1 rounded-full bg-primary/90 px-2 py-0.5 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
            <Expand className="size-3" />
            View
          </span>
        </button>
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Merchant code
          </p>
          <p className="mt-1 font-mono text-lg font-bold tracking-wide text-primary">
            {code}
          </p>
          <p className="mt-2 max-w-[11rem] text-[11px] leading-snug text-muted-foreground">
            Scan to open this merchant’s payment page. Click QR to download.
          </p>
        </div>
      </div>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6">
              <button
                type="button"
                className="absolute inset-0 bg-[#2a1a3d]/40 backdrop-blur-sm"
                aria-label="Close dialog"
                onClick={() => setOpen(false)}
              />
              <div className="relative w-full max-w-md rounded-2xl border border-border bg-white p-5 shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)] sm:p-6">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Merchant QR code
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Customers can scan this to open your payment page
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center rounded-2xl border border-border bg-[#fcfaff] p-6">
                  <div className="rounded-xl bg-white p-4 shadow-sm">
                    <QRCodeCanvas
                      ref={modalRef}
                      value={payUrl}
                      size={modalSize}
                      bgColor="#ffffff"
                      fgColor="#4B1D6E"
                      level={resolvedLogo ? 'H' : 'M'}
                      includeMargin
                      imageSettings={modalImageSettings}
                    />
                  </div>
                  <p className="mt-4 font-mono text-xl font-bold tracking-wide text-primary">
                    {code}
                  </p>
                  <p className="mt-1 max-w-xs break-all text-center text-xs text-muted-foreground">
                    {payUrl}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-[#fcfaff]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={downloadPng}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-[#3f1860]"
                  >
                    <Download className="size-4" />
                    Download PNG
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
