import { merchantApi } from '@/lib/api'
import type { TrackerMatrix } from '@/types/tracker'

type TrackerResponse = { data: TrackerMatrix }

export type TrackerQuery = {
  year?: number
  bill_set_uuid?: string
  q?: string
}

export const trackerService = {
  async matrix(params?: TrackerQuery): Promise<TrackerMatrix> {
    const { data } = await merchantApi.get<TrackerResponse>('/admin/tracker', {
      params: {
        year: params?.year,
        bill_set_uuid: params?.bill_set_uuid || undefined,
        q: params?.q || undefined,
      },
    })
    return data.data
  },
}
