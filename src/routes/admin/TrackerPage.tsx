import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  LayoutGrid,
  LoaderCircle,
  Search,
  Wallet,
} from 'lucide-react'
import { MerchantShell } from '@/components/admin/MerchantShell'
import { TablePagination } from '@/components/ui/TablePagination'
import { trackerService } from '@/services/trackerService'
import { emptyPaginationMeta } from '@/types/pagination'
import type { TrackerCell, TrackerColumn } from '@/types/tracker'
import { cn } from '@/lib/utils'

function cellTone(cell: TrackerCell | null | undefined) {
  if (!cell) {
    return {
      bg: 'bg-white',
      text: 'text-muted-foreground/40',
      ring: '',
    }
  }

  switch (cell.status) {
    case 'paid':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        ring: 'ring-1 ring-inset ring-emerald-100',
      }
    case 'partial':
      return {
        bg: 'bg-[#fbf6e8]',
        text: 'text-gold-foreground',
        ring: 'ring-1 ring-inset ring-[#ead9a0]',
      }
    case 'overdue':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        ring: 'ring-1 ring-inset ring-rose-100',
      }
    case 'issued':
    default:
      return {
        bg: 'bg-[#f3ecf8]',
        text: 'text-primary',
        ring: 'ring-1 ring-inset ring-[#e2d4ef]',
      }
  }
}

function itemTone(status: string) {
  switch (status) {
    case 'paid':
      return 'bg-emerald-50 text-emerald-700'
    case 'partial':
      return 'bg-[#fbf6e8] text-gold-foreground'
    case 'overdue':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-[#f3ecf8] text-primary'
  }
}

function CellHoverTip({
  column,
  cell,
  children,
}: {
  column: TrackerColumn
  cell: TrackerCell
  children: ReactNode
}) {
  const [tip, setTip] = useState<{
    top: number
    left: number
    placeAbove: boolean
  } | null>(null)

  const items = cell.items?.length ? cell.items : []
  const hasBreakdown = items.length > 1

  const show = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    const tipHeight = Math.min(80 + items.length * 52, 320)
    const gap = 8
    const placeAbove = rect.top >= tipHeight + gap + 12
    const top = placeAbove ? rect.top - gap : rect.bottom + gap
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, 140),
      window.innerWidth - 140,
    )
    setTip({ top, left, placeAbove })
  }

  return (
    <>
      <div
        className="mx-auto flex h-10 w-full max-w-[96px] items-center justify-center"
        onMouseEnter={(e) => show(e.currentTarget)}
        onMouseLeave={() => setTip(null)}
        onFocus={(e) => show(e.currentTarget)}
        onBlur={() => setTip(null)}
      >
        {children}
      </div>
      {tip
        ? createPortal(
            <div
              role="tooltip"
              className="pointer-events-none fixed z-[80] w-64 -translate-x-1/2 rounded-xl border border-border bg-white p-3 text-left text-xs shadow-[0_18px_40px_-20px_rgb(42_26_61_/_0.45)]"
              style={{
                top: tip.top,
                left: tip.left,
                transform: tip.placeAbove
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-primary">{column.title}</p>
                <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-primary">
                  {cell.bill_count} bill{cell.bill_count === 1 ? '' : 's'}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">
                {cell.status_label} · Total {cell.amount_label}
              </p>
              {cell.balance > 0 ? (
                <p className="mt-0.5 text-muted-foreground">
                  Balance {cell.balance_label}
                </p>
              ) : null}

              <div
                className={cn(
                  'mt-2 space-y-2',
                  hasBreakdown ? 'border-t border-border pt-2' : '',
                )}
              >
                {(hasBreakdown ? items : items.slice(0, 1)).map((item) => (
                  <div
                    key={item.bill_uuid}
                    className="rounded-lg border border-border/80 bg-[#faf8fc] px-2.5 py-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 font-medium leading-snug text-foreground">
                        {item.title}
                      </p>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                          itemTone(item.status),
                        )}
                      >
                        {item.status_label}
                      </span>
                    </div>
                    <p className="mt-1 tabular-nums text-muted-foreground">
                      {item.amount_label}
                      {item.balance > 0
                        ? ` · Bal ${item.balance_label}`
                        : ''}
                    </p>
                    {item.due_on ? (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Due {item.due_on}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

export default function TrackerPage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [billSetUuid, setBillSetUuid] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 250)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [year, billSetUuid])

  const years = useMemo(() => {
    const list: number[] = []
    for (let y = currentYear + 1; y >= currentYear - 4; y -= 1) {
      list.push(y)
    }
    return list
  }, [currentYear])

  const trackerQuery = useQuery({
    queryKey: ['merchant-tracker', year, billSetUuid, debouncedSearch, page],
    queryFn: () =>
      trackerService.matrix({
        year,
        bill_set_uuid: billSetUuid || undefined,
        q: debouncedSearch || undefined,
        page,
        per_page: 10,
      }),
  })

  const data = trackerQuery.data?.data
  const paginationMeta = trackerQuery.data?.meta ?? emptyPaginationMeta(10)
  const columns = data?.columns ?? []
  const rows = data?.rows ?? []
  const summary = data?.summary

  return (
    <MerchantShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              Payment Tracker
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Track member payments by month. Same-month bills are summed in one
              cell — hover to see the breakdown.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <LayoutGrid className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Members</p>
                <p className="text-xl font-bold text-foreground">
                  {summary?.members ?? 0}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
                <CalendarRange className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Bill periods</p>
                <p className="text-xl font-bold text-foreground">
                  {summary?.periods ?? 0}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Paid checks</p>
                <p className="text-xl font-bold text-foreground">
                  {summary?.paid_cells ?? 0}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">
                    / {(summary?.paid_cells ?? 0) + (summary?.unpaid_cells ?? 0)}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-white p-4 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#f7efd4] text-gold-foreground">
                <Wallet className="size-5" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-xl font-bold text-foreground">
                  {summary?.total_outstanding_label ?? '₱0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)] lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members by name, account number, email..."
              className="h-11 w-full rounded-xl border border-border bg-[#faf8fc] pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-11 rounded-xl border border-border bg-[#faf8fc] px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={billSetUuid}
            onChange={(e) => setBillSetUuid(e.target.value)}
            className="h-11 min-w-[200px] rounded-xl border border-border bg-[#faf8fc] px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
          >
            <option value="">All bill titles</option>
            {(data?.bill_sets ?? []).map((set) => (
              <option key={set.uuid} value={set.uuid}>
                {set.title}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-[0_10px_30px_-24px_rgb(75_29_110_/_0.35)]">
          {trackerQuery.isLoading ? (
            <div className="flex items-center justify-center gap-2 px-6 py-20 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Loading tracker…
            </div>
          ) : trackerQuery.isError ? (
            <div className="px-6 py-16 text-center text-sm text-rose-700">
              Unable to load payment tracker. Please try again.
            </div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              No members found for this filter.
            </div>
          ) : columns.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-muted-foreground">
              No generated bills for {year} yet. Generate bills to populate the
              tracker.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#faf7fc]">
                    <th className="sticky left-0 z-20 min-w-[200px] bg-[#faf7fc] px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Member
                    </th>
                    <th className="sticky left-[200px] z-20 min-w-[96px] bg-[#faf7fc] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Status
                    </th>
                    {columns.map((column) => (
                      <th
                        key={column.key}
                        title={column.title}
                        className="min-w-[88px] px-2 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
                      >
                        <span className="block whitespace-nowrap">
                          {column.short_label}
                        </span>
                      </th>
                    ))}
                    <th className="min-w-[110px] bg-[#efe6f6] px-3 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.customer_uuid}
                      className="border-b border-border/70 last:border-b-0"
                    >
                      <td className="sticky left-0 z-10 bg-white px-4 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {row.full_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {row.account_number}
                          </p>
                        </div>
                      </td>
                      <td className="sticky left-[200px] z-10 bg-white px-3 py-2.5">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                            row.member_status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700',
                          )}
                        >
                          {row.member_status === 'active'
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>
                      {columns.map((column) => {
                        const cell = row.cells[column.key]
                        const tone = cellTone(cell)
                        const hasBreakdown = (cell?.bill_count ?? 0) > 1
                        const chip = (
                          <div
                            className={cn(
                              'relative flex h-10 w-full max-w-[96px] items-center justify-center gap-0.5 rounded-lg px-1.5 text-xs font-semibold tabular-nums',
                              tone.bg,
                              tone.text,
                              tone.ring,
                            )}
                          >
                            {cell ? (
                              <>
                                <span>{cell.display}</span>
                                {hasBreakdown ? (
                                  <ChevronDown className="size-3 opacity-70" />
                                ) : null}
                              </>
                            ) : (
                              <span className="text-[10px]">—</span>
                            )}
                          </div>
                        )

                        return (
                          <td key={column.key} className="px-1.5 py-1.5">
                            {cell ? (
                              <CellHoverTip column={column} cell={cell}>
                                {chip}
                              </CellHoverTip>
                            ) : (
                              <div className="mx-auto flex h-10 w-full max-w-[96px] items-center justify-center">
                                {chip}
                              </div>
                            )}
                          </td>
                        )
                      })}
                      <td className="bg-[#f6f0fa] px-3 py-2.5 text-right">
                        <p className="font-semibold tabular-nums text-primary">
                          {row.total_paid_label}
                        </p>
                        {row.total_balance > 0 ? (
                          <p className="text-[11px] text-rose-600">
                            Due {row.total_balance_label}
                          </p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {!trackerQuery.isLoading && !trackerQuery.isError ? (
            <TablePagination
              meta={paginationMeta}
              onPageChange={setPage}
              disabled={trackerQuery.isFetching}
              label="members"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-emerald-50 ring-1 ring-emerald-100" />
            Paid
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-[#fbf6e8] ring-1 ring-[#ead9a0]" />
            Partial
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-[#f3ecf8] ring-1 ring-[#e2d4ef]" />
            Unpaid
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-rose-50 ring-1 ring-rose-100" />
            Overdue
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-3 rounded bg-white ring-1 ring-border" />
            Not billed
          </span>
        </div>
      </div>
    </MerchantShell>
  )
}
