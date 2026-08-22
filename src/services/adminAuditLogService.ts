import { adminApi } from '@/lib/api'
import type { AuditLog, AuditLogsResponse } from '@/types/auditLog'

type ItemResponse = { data: AuditLog }

export const adminAuditLogService = {
  async list(params?: {
    q?: string
    category?: string
    action?: string
    from?: string
    to?: string
  }): Promise<AuditLogsResponse> {
    const { data } = await adminApi.get<AuditLogsResponse>(
      '/admin/super/audit-logs',
      { params },
    )
    return data
  },

  async get(uuid: string): Promise<AuditLog> {
    const { data } = await adminApi.get<ItemResponse>(
      `/admin/super/audit-logs/${uuid}`,
    )
    return data.data
  },
}
