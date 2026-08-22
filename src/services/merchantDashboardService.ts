import { merchantApi } from '@/lib/api'
import type { MerchantDashboardData } from '@/types/dashboard'

type DashboardResponse = { data: MerchantDashboardData }

export const merchantDashboardService = {
  async get(): Promise<MerchantDashboardData> {
    const { data } = await merchantApi.get<DashboardResponse>('/admin/dashboard')
    return data.data
  },
}
