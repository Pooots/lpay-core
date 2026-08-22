import { adminApi } from '@/lib/api'
import type {
  CommissionHistoryRow,
  GatewayRatesSettings,
  MerchantCommissionSettings,
  PaymentMethodsSettings,
} from '@/types/platformSettings'

type DataResponse<T> = { data: T; message?: string }

export const platformSettingsService = {
  async getMerchantCommission(): Promise<MerchantCommissionSettings> {
    const { data } = await adminApi.get<DataResponse<MerchantCommissionSettings>>(
      '/admin/super/settings/merchant-commission',
    )
    return data.data
  },

  async updateMerchantCommission(
    payload: Omit<MerchantCommissionSettings, 'updated_at'>,
  ): Promise<MerchantCommissionSettings> {
    const { data } = await adminApi.put<DataResponse<MerchantCommissionSettings>>(
      '/admin/super/settings/merchant-commission',
      payload,
    )
    return data.data
  },

  async getMerchantCommissionHistory(): Promise<CommissionHistoryRow[]> {
    const { data } = await adminApi.get<DataResponse<CommissionHistoryRow[]>>(
      '/admin/super/settings/merchant-commission/history',
    )
    return data.data
  },

  async getPaymentMethods(): Promise<PaymentMethodsSettings> {
    const { data } = await adminApi.get<DataResponse<PaymentMethodsSettings>>(
      '/admin/super/settings/payment-methods',
    )
    return data.data
  },

  async updatePaymentMethods(
    payment_methods: Array<{ name: string; value: boolean }>,
  ): Promise<PaymentMethodsSettings> {
    const { data } = await adminApi.put<DataResponse<PaymentMethodsSettings>>(
      '/admin/super/settings/payment-methods',
      { payment_methods },
    )
    return data.data
  },

  async getGatewayRates(): Promise<GatewayRatesSettings> {
    const { data } = await adminApi.get<DataResponse<GatewayRatesSettings>>(
      '/admin/super/settings/gateway-rates',
    )
    return data.data
  },

  async updateGatewayRates(
    payload: Pick<GatewayRatesSettings, 'paymongo' | 'paypal'>,
  ): Promise<GatewayRatesSettings> {
    const { data } = await adminApi.put<DataResponse<GatewayRatesSettings>>(
      '/admin/super/settings/gateway-rates',
      payload,
    )
    return data.data
  },
}
