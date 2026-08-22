import { adminApi } from '@/lib/api'
import type { SuperAdminDashboardData } from '@/types/dashboard'

type DashboardResponse = { data: SuperAdminDashboardData }

export const superAdminDashboardService = {
  async get(): Promise<SuperAdminDashboardData> {
    const { data } = await adminApi.get<DashboardResponse>(
      '/admin/super/dashboard',
    )
    return data.data
  },
}
