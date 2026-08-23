import { api, merchantApi } from '@/lib/api'
import type {
  Member,
  MemberDetail,
  MemberImportPreview,
  MemberImportResult,
  MemberImportRow,
  MemberPayload,
  MemberRegistrationSettings,
  PublicMemberRegistrationForm,
  PublicMemberRegistrationPayload,
  PublicMemberRegistrationResult,
} from '@/types/member'
import type { PaginatedResult, PaginationMeta } from '@/types/pagination'
import { DEFAULT_PAGE_SIZE, emptyPaginationMeta } from '@/types/pagination'

type MembersResponse = {
  data: Member[]
  meta?: PaginationMeta
}
type MemberResponse = { data: Member; message?: string }
type MemberDetailResponse = { data: MemberDetail }
type ImportResponse = { data: MemberImportResult; message?: string }
type ImportPreviewResponse = { data: MemberImportPreview }
type RegistrationSettingsResponse = {
  data: MemberRegistrationSettings
  message?: string
}
type PublicRegistrationFormResponse = { data: PublicMemberRegistrationForm }
type PublicRegistrationResultResponse = {
  data: PublicMemberRegistrationResult
  message?: string
}

export type MemberListParams = {
  q?: string
  page?: number
  per_page?: number
  status?: string
}

export const memberService = {
  async list(
    params: MemberListParams = {},
  ): Promise<PaginatedResult<Member>> {
    const { data } = await merchantApi.get<MembersResponse>('/admin/member', {
      params: {
        q: params.q || undefined,
        page: params.page ?? 1,
        per_page: params.per_page ?? DEFAULT_PAGE_SIZE,
        status: params.status || undefined,
      },
    })

    return {
      data: data.data,
      meta: data.meta ?? emptyPaginationMeta(params.per_page ?? DEFAULT_PAGE_SIZE),
    }
  },

  async listAll(params: Omit<MemberListParams, 'page' | 'per_page'> = {}): Promise<Member[]> {
    const { data } = await merchantApi.get<MembersResponse>('/admin/member', {
      params: {
        q: params.q || undefined,
        status: params.status || undefined,
        per_page: 500,
        page: 1,
      },
    })
    return data.data
  },

  async get(uuid: string): Promise<MemberDetail> {
    const { data } = await merchantApi.get<MemberDetailResponse>(
      `/admin/member/${uuid}`,
    )
    return data.data
  },

  async create(payload: MemberPayload): Promise<Member> {
    const { data } = await merchantApi.post<MemberResponse>(
      '/admin/member',
      payload,
    )
    return data.data
  },

  async update(uuid: string, payload: MemberPayload): Promise<Member> {
    const { data } = await merchantApi.put<MemberResponse>(
      `/admin/member/${uuid}`,
      payload,
    )
    return data.data
  },

  async importPreview(file: File): Promise<MemberImportPreview> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await merchantApi.post<ImportPreviewResponse>(
      '/admin/member/import/preview',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },

  async importConfirm(rows: MemberImportRow[]): Promise<MemberImportResult> {
    const { data } = await merchantApi.post<ImportResponse>(
      '/admin/member/import/confirm',
      { rows },
    )
    return data.data
  },

  async import(file: File): Promise<MemberImportResult> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await merchantApi.post<ImportResponse>(
      '/admin/member/import',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },

  async downloadTemplate(): Promise<Blob> {
    const { data } = await merchantApi.get('/admin/member/import-template', {
      responseType: 'blob',
    })
    return data as Blob
  },

  async getRegistrationSettings(): Promise<MemberRegistrationSettings> {
    const { data } = await merchantApi.get<RegistrationSettingsResponse>(
      '/admin/member/registration',
    )
    return data.data
  },

  async updateRegistrationSettings(payload: {
    enabled: boolean
    fields: MemberRegistrationSettings['fields']
  }): Promise<MemberRegistrationSettings> {
    const { data } = await merchantApi.put<RegistrationSettingsResponse>(
      '/admin/member/registration',
      payload,
    )
    return data.data
  },

  async getPublicRegistrationForm(
    merchantCode: string,
  ): Promise<PublicMemberRegistrationForm> {
    const { data } = await api.get<PublicRegistrationFormResponse>(
      `/portal/merchants/${encodeURIComponent(merchantCode)}/registration`,
    )
    return data.data
  },

  async submitPublicRegistration(
    merchantCode: string,
    values: PublicMemberRegistrationPayload,
    files: Record<string, File | null> = {},
  ): Promise<PublicMemberRegistrationResult> {
    const form = new FormData()
    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        form.append(key, String(value))
      }
    })
    Object.entries(files).forEach(([key, file]) => {
      if (file) form.append(key, file)
    })

    const { data } = await api.post<PublicRegistrationResultResponse>(
      `/portal/merchants/${encodeURIComponent(merchantCode)}/register`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },
}
