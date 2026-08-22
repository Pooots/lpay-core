import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type DialogTone = 'default' | 'danger'

type AlertOptions = {
  title?: string
  message: string
  confirmLabel?: string
  tone?: DialogTone
}

type ConfirmOptions = {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: DialogTone
}

type DialogApi = {
  alert: (options: AlertOptions | string) => Promise<void>
  confirm: (options: ConfirmOptions | string) => Promise<boolean>
}

type ActiveDialog =
  | {
      kind: 'alert'
      title: string
      message: string
      confirmLabel: string
      tone: DialogTone
      resolve: () => void
    }
  | {
      kind: 'confirm'
      title: string
      message: string
      confirmLabel: string
      cancelLabel: string
      tone: DialogTone
      resolve: (value: boolean) => void
    }

const DialogContext = createContext<DialogApi | null>(null)

function normalizeAlert(options: AlertOptions | string): Required<
  Pick<AlertOptions, 'title' | 'message' | 'confirmLabel' | 'tone'>
> {
  if (typeof options === 'string') {
    return {
      title: 'Notice',
      message: options,
      confirmLabel: 'OK',
      tone: 'default',
    }
  }

  return {
    title: options.title ?? 'Notice',
    message: options.message,
    confirmLabel: options.confirmLabel ?? 'OK',
    tone: options.tone ?? 'default',
  }
}

function normalizeConfirm(options: ConfirmOptions | string): Required<
  Pick<
    ConfirmOptions,
    'title' | 'message' | 'confirmLabel' | 'cancelLabel' | 'tone'
  >
> {
  if (typeof options === 'string') {
    return {
      title: 'Confirm',
      message: options,
      confirmLabel: 'Proceed',
      cancelLabel: 'Cancel',
      tone: 'default',
    }
  }

  return {
    title: options.title ?? 'Confirm',
    message: options.message,
    confirmLabel: options.confirmLabel ?? 'Proceed',
    cancelLabel: options.cancelLabel ?? 'Cancel',
    tone: options.tone ?? 'default',
  }
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<ActiveDialog | null>(null)
  const queueRef = useRef<ActiveDialog[]>([])

  const showNext = useCallback(() => {
    const next = queueRef.current.shift() ?? null
    setDialog(next)
  }, [])

  const enqueue = useCallback((entry: ActiveDialog) => {
    setDialog((current) => {
      if (current) {
        queueRef.current.push(entry)
        return current
      }
      return entry
    })
  }, [])

  const alert = useCallback(
    (options: AlertOptions | string) => {
      const normalized = normalizeAlert(options)
      return new Promise<void>((resolve) => {
        enqueue({
          kind: 'alert',
          ...normalized,
          resolve: () => {
            setDialog(null)
            resolve()
            queueMicrotask(showNext)
          },
        })
      })
    },
    [enqueue, showNext],
  )

  const confirm = useCallback(
    (options: ConfirmOptions | string) => {
      const normalized = normalizeConfirm(options)
      return new Promise<boolean>((resolve) => {
        enqueue({
          kind: 'confirm',
          ...normalized,
          resolve: (value) => {
            setDialog(null)
            resolve(value)
            queueMicrotask(showNext)
          },
        })
      })
    },
    [enqueue, showNext],
  )

  const api = useMemo(() => ({ alert, confirm }), [alert, confirm])

  return (
    <DialogContext.Provider value={api}>
      {children}
      {dialog ? (
        <AppDialogModal
          kind={dialog.kind}
          title={dialog.title}
          message={dialog.message}
          confirmLabel={dialog.confirmLabel}
          cancelLabel={dialog.kind === 'confirm' ? dialog.cancelLabel : undefined}
          tone={dialog.tone}
          onConfirm={() => {
            if (dialog.kind === 'alert') dialog.resolve()
            else dialog.resolve(true)
          }}
          onCancel={() => {
            if (dialog.kind === 'confirm') dialog.resolve(false)
            else dialog.resolve()
          }}
        />
      ) : null}
    </DialogContext.Provider>
  )
}

export function useDialog(): DialogApi {
  const ctx = useContext(DialogContext)
  if (!ctx) {
    throw new Error('useDialog must be used within DialogProvider')
  }
  return ctx
}

function AppDialogModal({
  kind,
  title,
  message,
  confirmLabel,
  cancelLabel,
  tone,
  onConfirm,
  onCancel,
}: {
  kind: 'alert' | 'confirm'
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  tone: DialogTone
  onConfirm: () => void
  onCancel: () => void
}) {
  const confirmClass =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white'
      : 'bg-primary hover:bg-[#3f1860] text-primary-foreground'

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-3 py-4 sm:px-6">
      <button
        type="button"
        className="absolute inset-0 bg-[#2a1a3d]/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-white shadow-[0_24px_60px_-28px_rgb(75_29_110_/_0.45)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-5">
          <div>
            <h2
              id="app-dialog-title"
              className="text-xl font-bold text-foreground"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-primary"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="px-5 py-5">
          <p
            id="app-dialog-message"
            className="text-sm leading-relaxed text-muted-foreground"
          >
            {message}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-[#fbfafc] px-5 py-4">
          {kind === 'confirm' ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-semibold',
              confirmClass,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
