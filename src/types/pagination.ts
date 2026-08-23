export type PaginationMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number | null
  to: number | null
}

export type PaginatedResult<T> = {
  data: T[]
  meta: PaginationMeta
}

export const DEFAULT_PAGE_SIZE = 10

export function emptyPaginationMeta(
  perPage = DEFAULT_PAGE_SIZE,
): PaginationMeta {
  return {
    current_page: 1,
    last_page: 1,
    per_page: perPage,
    total: 0,
    from: null,
    to: null,
  }
}

/** Client-side slice helper for payloads that are not yet server-paginated. */
export function paginateArray<T>(
  items: T[],
  page: number,
  perPage = DEFAULT_PAGE_SIZE,
): PaginatedResult<T> {
  const total = items.length
  const lastPage = Math.max(Math.ceil(total / perPage) || 1, 1)
  const current = Math.min(Math.max(page, 1), lastPage)
  const start = (current - 1) * perPage
  const data = items.slice(start, start + perPage)

  return {
    data,
    meta: {
      current_page: current,
      last_page: lastPage,
      per_page: perPage,
      total,
      from: data.length ? start + 1 : null,
      to: data.length ? start + data.length : null,
    },
  }
}
