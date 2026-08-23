import { adminApi } from '@/lib/api'
import type { SuperAdminDashboardData } from '@/types/dashboard'

type DashboardResponse = { data: SuperAdminDashboardData }

export type DashboardRange =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom'

export type DashboardPeriodParams = {
  range: DashboardRange
  from?: string
  to?: string
}

export const superAdminDashboardService = {
  async get(params?: DashboardPeriodParams): Promise<SuperAdminDashboardData> {
    const { data } = await adminApi.get<DashboardResponse>(
      '/admin/super/dashboard',
      {
        params: {
          range: params?.range ?? 'monthly',
          from: params?.range === 'custom' ? params.from : undefined,
          to: params?.range === 'custom' ? params.to : undefined,
        },
      },
    )
    return data.data
  },
}
