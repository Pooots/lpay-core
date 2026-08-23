import { adminApi } from '@/lib/api'
import type {
  CreateMerchantPayload,
  Merchant,
  MerchantDetail,
  MerchantStatus,
  UpdateMerchantPayload,
} from '@/types/merchant'
import type { MerchantBank, MerchantBankPayload } from '@/types/settings'

type MerchantsResponse = {
  data: Merchant[]
  summary?: {
    pending: number
    active: number
    suspended: number
    expired: number
    total: number
  }
}

type MerchantResponse = {
  data: Merchant
  message?: string
}

type MerchantDetailResponse = {
  data: MerchantDetail
}

type BankResponse = {
  data: MerchantBank
  message?: string
}

export type MerchantLifecycleFilter =
  | 'all'
  | 'pending'
  | 'active'
  | 'suspended'
  | 'expired'

export type MerchantsListResult = {
  data: Merchant[]
  summary: {
    pending: number
    active: number
    suspended: number
    expired: number
    total: number
  }
}

export const merchantService = {
  async list(
    q?: string,
    lifecycle?: Exclude<MerchantLifecycleFilter, 'all'>,
  ): Promise<MerchantsListResult> {
    const { data } = await adminApi.get<MerchantsResponse>(
      '/admin/super/merchants',
      {
        params: {
          ...(q ? { q } : {}),
          ...(lifecycle ? { lifecycle } : {}),
        },
      },
    )
    return {
      data: data.data,
      summary: data.summary ?? {
        pending: 0,
        active: 0,
        suspended: 0,
        expired: 0,
        total: data.data.length,
      },
    }
  },

  async get(uuid: string): Promise<MerchantDetail> {
    const { data } = await adminApi.get<MerchantDetailResponse>(
      `/admin/super/merchants/${uuid}`,
    )
    return data.data
  },

  async create(payload: CreateMerchantPayload): Promise<Merchant> {
    const { data } = await adminApi.post<MerchantResponse>(
      '/admin/super/merchants',
      payload,
    )
    return data.data
  },

  async update(
    uuid: string,
    payload: UpdateMerchantPayload,
  ): Promise<Merchant> {
    const { data } = await adminApi.put<MerchantResponse>(
      `/admin/super/merchants/${uuid}`,
      payload,
    )
    return data.data
  },

  async updateStatus(uuid: string, status: MerchantStatus): Promise<Merchant> {
    const { data } = await adminApi.patch<MerchantResponse>(
      `/admin/super/merchants/${uuid}/status`,
      { status },
    )
    return data.data
  },

  async uploadLogo(uuid: string, file: File): Promise<Merchant> {
    const form = new FormData()
    form.append('logo', file)
    const { data } = await adminApi.post<MerchantResponse>(
      `/admin/super/merchants/${uuid}/logo`,
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    return data.data
  },

  async removeLogo(uuid: string): Promise<Merchant> {
    const { data } = await adminApi.delete<MerchantResponse>(
      `/admin/super/merchants/${uuid}/logo`,
    )
    return data.data
  },

  async approvePayout(uuid: string, payoutUuid: string): Promise<void> {
    await adminApi.post(
      `/admin/super/merchants/${uuid}/payouts/${payoutUuid}/approve`,
    )
  },

  async releasePayout(uuid: string, payoutUuid: string): Promise<void> {
    await adminApi.post(
      `/admin/super/merchants/${uuid}/payouts/${payoutUuid}/release`,
    )
  },

  async createBank(
    merchantUuid: string,
    payload: MerchantBankPayload,
  ): Promise<MerchantBank> {
    const { data } = await adminApi.post<BankResponse>(
      `/admin/super/merchants/${merchantUuid}/banks`,
      payload,
    )
    return data.data
  },

  async updateBank(
    merchantUuid: string,
    bankUuid: string,
    payload: Partial<MerchantBankPayload>,
  ): Promise<MerchantBank> {
    const { data } = await adminApi.put<BankResponse>(
      `/admin/super/merchants/${merchantUuid}/banks/${bankUuid}`,
      payload,
    )
    return data.data
  },

  async deleteBank(merchantUuid: string, bankUuid: string): Promise<void> {
    await adminApi.delete(
      `/admin/super/merchants/${merchantUuid}/banks/${bankUuid}`,
    )
  },
}
