import { adminApi } from '@/lib/api'
import type {
  AdminMember,
  AdminMemberDetail,
  AdminMembersSummary,
} from '@/types/adminMember'

type ListResponse = {
  data: AdminMember[]
  summary: AdminMembersSummary
}

type DetailResponse = {
  data: AdminMemberDetail
}

export const adminMemberService = {
  async list(params?: {
    q?: string
    status?: string
  }): Promise<ListResponse> {
    const { data } = await adminApi.get<ListResponse>('/admin/super/members', {
      params,
    })
    return data
  },

  async get(uuid: string): Promise<AdminMemberDetail> {
    const { data } = await adminApi.get<DetailResponse>(
      `/admin/super/members/${uuid}`,
    )
    return data.data
  },
}
