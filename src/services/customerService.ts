import { merchantApi } from '@/lib/api'
import type {
  Customer,
  CustomerDetail,
  CustomerImportPreview,
  CustomerImportResult,
  CustomerImportRow,
  CustomerPayload,
} from '@/types/customer'
import type { PaginatedResult, PaginationMeta } from '@/types/pagination'
import { DEFAULT_PAGE_SIZE, emptyPaginationMeta } from '@/types/pagination'

type CustomersResponse = {
  data: Customer[]
  meta?: PaginationMeta
}
type CustomerResponse = { data: Customer; message?: string }
type CustomerDetailResponse = { data: CustomerDetail }
type ImportResponse = { data: CustomerImportResult; message?: string }
type ImportPreviewResponse = { data: CustomerImportPreview }

export type CustomerListParams = {
  q?: string
  page?: number
  per_page?: number
  status?: string
}

export const customerService = {
  async list(
    params: CustomerListParams = {},
  ): Promise<PaginatedResult<Customer>> {
    const { data } = await merchantApi.get<CustomersResponse>(
      '/admin/customers',
      {
        params: {
          q: params.q || undefined,
          page: params.page ?? 1,
          per_page: params.per_page ?? DEFAULT_PAGE_SIZE,
          status: params.status || undefined,
        },
      },
    )

    return {
      data: data.data,
      meta: data.meta ?? emptyPaginationMeta(params.per_page ?? DEFAULT_PAGE_SIZE),
    }
  },

  /** Full list for pickers / bulk flows (no pagination). */
  async listAll(q?: string): Promise<Customer[]> {
    const { data } = await merchantApi.get<CustomersResponse>(
      '/admin/customers',
      { params: { q: q || undefined, all: 1 } },
    )
    return data.data
  },

  async get(uuid: string): Promise<CustomerDetail> {
    const { data } = await merchantApi.get<CustomerDetailResponse>(
      `/admin/customers/${uuid}`,
    )
    return data.data
  },

  async create(payload: CustomerPayload): Promise<Customer> {
    const { data } = await merchantApi.post<CustomerResponse>(
      '/admin/customers',
      payload,
    )
    return data.data
  },

  async update(uuid: string, payload: CustomerPayload): Promise<Customer> {
    const { data } = await merchantApi.put<CustomerResponse>(
      `/admin/customers/${uuid}`,
      payload,
    )
    return data.data
  },

  async importPreview(file: File): Promise<CustomerImportPreview> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await merchantApi.post<ImportPreviewResponse>(
      '/admin/customers/import/preview',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },

  async importConfirm(rows: CustomerImportRow[]): Promise<CustomerImportResult> {
    const { data } = await merchantApi.post<ImportResponse>(
      '/admin/customers/import/confirm',
      { rows },
      { timeout: 120000 },
    )
    return data.data
  },

  async import(file: File): Promise<CustomerImportResult> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await merchantApi.post<ImportResponse>(
      '/admin/customers/import',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return data.data
  },

  async downloadTemplate(): Promise<Blob> {
    const { data } = await merchantApi.get('/admin/customers/import-template', {
      responseType: 'blob',
    })
    return data as Blob
  },
}
