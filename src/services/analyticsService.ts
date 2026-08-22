import { merchantApi } from '@/lib/api'
import type { AnalyticsData } from '@/types/analytics'

type AnalyticsResponse = { data: AnalyticsData }

export const analyticsService = {
  async get(): Promise<AnalyticsData> {
    const { data } = await merchantApi.get<AnalyticsResponse>('/admin/analytics')
    return data.data
  },

  async exportReport(): Promise<void> {
    const response = await merchantApi.get('/admin/analytics/export', {
      responseType: 'blob',
    })

    const blob = new Blob([response.data], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    const disposition = response.headers['content-disposition'] as
      | string
      | undefined
    const match = disposition?.match(/filename="?([^"]+)"?/i)
    link.href = url
    link.download = match?.[1] ?? `lpay-analytics-${Date.now()}.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
