import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PaginationMeta } from '@/types/pagination'
import { cn } from '@/lib/utils'

type TablePaginationProps = {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  disabled?: boolean
  className?: string
  label?: string
}

export function TablePagination({
  meta,
  onPageChange,
  disabled = false,
  className,
  label = 'items',
}: TablePaginationProps) {
  if (meta.total <= 0) {
    return null
  }

  const canPrev = meta.current_page > 1
  const canNext = meta.current_page < meta.last_page
  const range =
    meta.from != null && meta.to != null
      ? `${meta.from}–${meta.to}`
      : '0'

  return (
    <div
      className={cn(
        'mt-4 flex flex-col gap-3 border-t border-border/80 pt-4 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-xs text-muted-foreground sm:text-sm">
        Showing <span className="font-semibold text-foreground">{range}</span> of{' '}
        <span className="font-semibold text-foreground">{meta.total}</span>{' '}
        {label}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || !canPrev}
          onClick={() => onPageChange(meta.current_page - 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="size-3.5" />
          Prev
        </button>
        <span className="min-w-[4.5rem] text-center text-xs font-semibold text-foreground">
          {meta.current_page} / {meta.last_page}
        </span>
        <button
          type="button"
          disabled={disabled || !canNext}
          onClick={() => onPageChange(meta.current_page + 1)}
          className="inline-flex items-center gap-1 rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
