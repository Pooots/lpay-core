import { merchantApi } from '@/lib/api'
import type {
  BillsSetItem,
  MerchantBank,
  MerchantBankPayload,
  MerchantCustomRate,
  MerchantPaymentGatewaySettings,
  MerchantPaymentMethodItem,
  MerchantRatesSettings,
  MerchantSettingsData,
  MerchantSettingsProfile,
  RunBillSetResult,
  StoreBillsSetPayload,
  UpdateMerchantPaymentGatewayPayload,
  UpdateMerchantProfilePayload,
} from '@/types/settings'

type SettingsResponse = { data: MerchantSettingsData }
type ProfileResponse = { data: MerchantSettingsProfile; message?: string }
type BillsSetResponse = { data: BillsSetItem; message?: string }
type RunBillSetResponse = { data: RunBillSetResult; message?: string }
type BankResponse = { data: MerchantBank; message?: string }

export const settingsService = {
  async get(): Promise<MerchantSettingsData> {
    const { data } = await merchantApi.get<SettingsResponse>('/admin/settings')
    return data.data
  },

  async updateProfile(
    payload: UpdateMerchantProfilePayload,
  ): Promise<MerchantSettingsProfile> {
    const { data } = await merchantApi.put<ProfileResponse>(
      '/admin/settings/profile',
      payload,
    )
    return data.data
  },

  async createBillsSet(payload: StoreBillsSetPayload): Promise<BillsSetItem> {
    const { data } = await merchantApi.post<BillsSetResponse>(
      '/admin/settings/bills-set',
      payload,
    )
    return data.data
  },

  async deleteBillsSet(uuid: string): Promise<void> {
    await merchantApi.delete(`/admin/settings/bills-set/${uuid}`)
  },

  async runBillsSet(
    uuid: string,
    title?: string,
  ): Promise<{ result: RunBillSetResult; message?: string }> {
    const { data } = await merchantApi.post<RunBillSetResponse>(
      `/admin/bills/run-set/${uuid}`,
      title ? { title } : {},
    )
    return { result: data.data, message: data.message }
  },

  async uploadLogo(file: File): Promise<MerchantSettingsProfile> {
    const form = new FormData()
    form.append('logo', file)
    const { data } = await merchantApi.post<ProfileResponse>(
      '/admin/settings/logo',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    return data.data
  },

  async removeLogo(): Promise<MerchantSettingsProfile> {
    const { data } = await merchantApi.delete<ProfileResponse>(
      '/admin/settings/logo',
    )
    return data.data
  },

  async createBank(payload: MerchantBankPayload): Promise<MerchantBank> {
    const { data } = await merchantApi.post<BankResponse>(
      '/admin/settings/banks',
      payload,
    )
    return data.data
  },

  async updateBank(
    uuid: string,
    payload: Partial<MerchantBankPayload>,
  ): Promise<MerchantBank> {
    const { data } = await merchantApi.put<BankResponse>(
      `/admin/settings/banks/${uuid}`,
      payload,
    )
    return data.data
  },

  async deleteBank(uuid: string): Promise<void> {
    await merchantApi.delete(`/admin/settings/banks/${uuid}`)
  },

  async updatePaymentMethods(payload: {
    payment_methods?: Array<{ name: string; value: boolean }>
    platform_channels_enabled?: boolean
  }): Promise<{
    payment_methods: MerchantPaymentMethodItem[]
    payment_gateway: MerchantPaymentGatewaySettings
    platform_channels_enabled: boolean
    message?: string
  }> {
    const { data } = await merchantApi.put<{
      data: {
        payment_methods: MerchantPaymentMethodItem[]
        payment_gateway: MerchantPaymentGatewaySettings
        platform_channels_enabled: boolean
      }
      message?: string
    }>('/admin/settings/payment-methods', payload)
    return { ...data.data, message: data.message }
  },

  async updatePaymentGateway(
    payload: UpdateMerchantPaymentGatewayPayload,
  ): Promise<{
    payment_gateway: MerchantPaymentGatewaySettings
    payment_methods: MerchantPaymentMethodItem[]
    message?: string
  }> {
    const { data } = await merchantApi.put<{
      data: {
        payment_gateway: MerchantPaymentGatewaySettings
        payment_methods: MerchantPaymentMethodItem[]
      }
      message?: string
    }>('/admin/settings/payment-gateway', payload)
    return { ...data.data, message: data.message }
  },

  async updateMerchantRates(payload: {
    merchant_rates: MerchantCustomRate[]
    use_custom_rates?: boolean
  }): Promise<MerchantRatesSettings> {
    const { data } = await merchantApi.put<{ data: MerchantRatesSettings }>(
      '/admin/settings/merchant-rates',
      payload,
    )
    return data.data
  },
}
