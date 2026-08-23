import {
  useCallback,
  type FormEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { useDialog } from '@/components/ui/AppDialog'
import {
  PENDING_ONBOARDING_MESSAGE,
  useMerchantAccess,
} from '@/components/admin/MerchantAccess'

/** Labels that change data — blocked while pending. */
const WRITE_LABEL =
  /\b(create|save|generate|import|upload|registration|void|payout|record|delete|remove|edit|confirm|request|submit|add field|add bank|add member|bill all|run bill|download template|choose file|browse files?|send email|save fields|save changes|record manual)\b/i

function labelOf(el: HTMLElement): string {
  return (
    el.getAttribute('aria-label') ||
    el.getAttribute('title') ||
    el.textContent ||
    ''
  )
    .replace(/\s+/g, ' ')
    .trim()
}

function isWriteControl(el: HTMLElement): boolean {
  if (el.closest('[data-allow-pending]')) return false

  const tag = el.tagName.toLowerCase()
  if (tag === 'input' && (el as HTMLInputElement).type === 'file') return true
  if (tag === 'input' && (el as HTMLInputElement).type === 'submit') return true
  if (tag === 'button' || el.getAttribute('role') === 'button') {
    const type = (el as HTMLButtonElement).type || 'submit'
    if (type === 'submit') return true
    return WRITE_LABEL.test(labelOf(el))
  }
  return false
}

/**
 * Lets merchants browse modules while pending; blocks write clicks/submits.
 */
export function MerchantWriteGate({ children }: { children: ReactNode }) {
  const { canTransact, isPendingOnboarding } = useMerchantAccess()
  const dialog = useDialog()

  const notify = useCallback(() => {
    void dialog.alert({
      title: 'Pending Onboarding',
      message: PENDING_ONBOARDING_MESSAGE,
      confirmLabel: 'OK',
    })
  }, [dialog])

  const onClickCapture = useCallback(
    (event: MouseEvent) => {
      if (canTransact || !isPendingOnboarding) return
      const target = event.target as HTMLElement | null
      if (!target) return
      const control = target.closest(
        'button, [type="submit"], input[type="file"], [role="button"]',
      ) as HTMLElement | null
      if (!control || !isWriteControl(control)) return
      event.preventDefault()
      event.stopPropagation()
      notify()
    },
    [canTransact, isPendingOnboarding, notify],
  )

  const onSubmitCapture = useCallback(
    (event: FormEvent) => {
      if (canTransact || !isPendingOnboarding) return
      const form = event.target as HTMLElement
      if (form.closest('[data-allow-pending]')) return
      event.preventDefault()
      event.stopPropagation()
      notify()
    },
    [canTransact, isPendingOnboarding, notify],
  )

  if (canTransact) return <>{children}</>

  return (
    <div onClickCapture={onClickCapture} onSubmitCapture={onSubmitCapture}>
      {children}
    </div>
  )
}
