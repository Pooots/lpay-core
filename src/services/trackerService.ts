import { merchantApi } from '@/lib/api'
import type { TrackerMatrix } from '@/types/tracker'
import type { PaginationMeta } from '@/types/pagination'
import { DEFAULT_PAGE_SIZE, emptyPaginationMeta } from '@/types/pagination'

type TrackerResponse = { data: TrackerMatrix; meta?: PaginationMeta }

export type TrackerQuery = {
  year?: number
  bill_set_uuid?: string
  q?: string
  page?: number
  per_page?: number
}

export type TrackerResult = {
  data: TrackerMatrix
  meta: PaginationMeta
}

export const trackerService = {
  async matrix(params?: TrackerQuery): Promise<TrackerResult> {
    const { data } = await merchantApi.get<TrackerResponse>('/admin/tracker', {
      params: {
        year: params?.year,
        bill_set_uuid: params?.bill_set_uuid || undefined,
        q: params?.q || undefined,
        page: params?.page ?? 1,
        per_page: params?.per_page ?? DEFAULT_PAGE_SIZE,
      },
    })

    return {
      data: data.data,
      meta: data.meta ?? emptyPaginationMeta(params?.per_page ?? DEFAULT_PAGE_SIZE),
    }
  },
}
