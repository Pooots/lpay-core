import { useRef, useState } from 'react'
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react'

type Props = {
  logoUrl: string | null | undefined
  uploading?: boolean
  removing?: boolean
  onUpload: (file: File) => Promise<void> | void
  onRemove?: () => Promise<void> | void
}

export function MerchantLogoUploader({
  logoUrl,
  uploading = false,
  removing = false,
  onUpload,
  onRemove,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewError, setPreviewError] = useState(false)
  const busy = uploading || removing

  return (
    <div className="rounded-2xl border border-border bg-[#fcfaff] p-4">
      <p className="text-sm font-semibold text-foreground">Merchant logo</p>
      <p className="mt-1 text-xs text-muted-foreground">
        JPG, PNG, WEBP or GIF · max 2MB. Shown on your payment page.
      </p>

      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="grid size-24 place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-white">
          {logoUrl && !previewError ? (
            <img
              src={logoUrl}
              alt="Merchant logo"
              className="size-full object-contain p-2"
              onError={() => setPreviewError(true)}
            />
          ) : (
            <ImagePlus className="size-8 text-primary/40" />
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-[#3f1860] disabled:opacity-60"
          >
            {uploading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {logoUrl ? 'Replace logo' : 'Upload logo'}
          </button>
          {logoUrl && onRemove ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onRemove()}
              className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
            >
              {removing ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (!file) return
          setPreviewError(false)
          void onUpload(file)
        }}
      />
    </div>
  )
}
