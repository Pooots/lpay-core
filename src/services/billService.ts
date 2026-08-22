import { merchantApi } from '@/lib/api'
import type { Bill, BillPayload, GenerateBillsPayload } from '@/types/bill'
import type {
  BillSetPeriodPreview,
  BillsSetPreview,
  RunBillSetResult,
} from '@/types/settings'

type BillsResponse = { data: Bill[] }
type BillResponse = { data: Bill; message?: string }
type GenerateBillsResponse = {
  data: Bill[]
  count: number
  message?: string
}
type RunBillSetResponse = { data: RunBillSetResult; message?: string }
type GenerateVariableResponse = {
  data: {
    created_count: number
    skipped_count: number
    preview: BillsSetPreview
    bills: Bill[]
  }
  message?: string
}
type PeriodPreviewResponse = { data: BillSetPeriodPreview }

export type VariableBillItem = {
  customer_uuid: string
  amount: number
}

export const billService = {
  async list(q?: string): Promise<Bill[]> {
    const { data } = await merchantApi.get<BillsResponse>('/admin/bills', {
      params: q ? { q } : undefined,
    })
    return data.data
  },

  async get(uuid: string): Promise<Bill> {
    const { data } = await merchantApi.get<BillResponse>(`/admin/bills/${uuid}`)
    return data.data
  },

  async create(payload: BillPayload): Promise<Bill> {
    const { data } = await merchantApi.post<BillResponse>(
      '/admin/bills',
      payload,
    )
    return data.data
  },

  async generate(payload: GenerateBillsPayload): Promise<Bill[]> {
    const { data } = await merchantApi.post<GenerateBillsResponse>(
      '/admin/bills/generate',
      payload,
    )
    return data.data
  },

  async periodPreview(
    uuid: string,
    coverageMonth: string,
  ): Promise<BillSetPeriodPreview> {
    const { data } = await merchantApi.get<PeriodPreviewResponse>(
      `/admin/bills/sets/${uuid}/period-preview`,
      { params: { coverage_month: coverageMonth } },
    )
    return data.data
  },

  async runBillSet(
    uuid: string,
    options?: { title?: string; coverage_month?: string },
  ): Promise<{ result: RunBillSetResult; message?: string }> {
    const { data } = await merchantApi.post<RunBillSetResponse>(
      `/admin/bills/run-set/${uuid}`,
      {
        ...(options?.title ? { title: options.title } : {}),
        ...(options?.coverage_month
          ? { coverage_month: options.coverage_month }
          : {}),
      },
    )
    return { result: data.data, message: data.message }
  },

  async generateVariableFromSet(payload: {
    bill_set_uuid: string
    title?: string
    coverage_month?: string
    items: VariableBillItem[]
  }): Promise<{
    created_count: number
    skipped_count: number
    preview: BillsSetPreview
    bills: Bill[]
    message?: string
  }> {
    const { data } = await merchantApi.post<GenerateVariableResponse>(
      '/admin/bills/generate-variable',
      payload,
    )
    return { ...data.data, message: data.message }
  },

  async update(uuid: string, payload: BillPayload): Promise<Bill> {
    const { data } = await merchantApi.put<BillResponse>(
      `/admin/bills/${uuid}`,
      payload,
    )
    return data.data
  },

  async remove(uuid: string): Promise<void> {
    await merchantApi.delete(`/admin/bills/${uuid}`)
  },
}
