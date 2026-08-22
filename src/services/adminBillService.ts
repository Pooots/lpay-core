import { adminApi } from '@/lib/api'
import type { AdminBill, AdminBillsSummary } from '@/types/adminBill'

type BillsResponse = {
  data: AdminBill[]
  summary: AdminBillsSummary
}

type BillResponse = {
  data: AdminBill
}

export const adminBillService = {
  async list(params?: {
    q?: string
    status?: string
  }): Promise<BillsResponse> {
    const { data } = await adminApi.get<BillsResponse>('/admin/super/bills', {
      params,
    })
    return data
  },

  async get(uuid: string): Promise<AdminBill> {
    const { data } = await adminApi.get<BillResponse>(
      `/admin/super/bills/${uuid}`,
    )
    return data.data
  },
}
