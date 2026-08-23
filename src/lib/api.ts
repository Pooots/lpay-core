import axios from 'axios'

/**
 * Resolve API base URL for local (relative / Vite proxy) and Vercel → Hostinger.
 * If Vercel env is only the Hostinger origin (no /api/v1), append it automatically.
 */
function resolveApiBaseUrl(raw: string | undefined): string {
  const value = (raw || '/api/v1').trim().replace(/\/+$/, '')

  if (!value.startsWith('http://') && !value.startsWith('https://')) {
    return value.startsWith('/') ? value : `/${value}`
  }

  try {
    const url = new URL(value)
    const path = url.pathname.replace(/\/+$/, '') || '/'

    if (path === '/' || path === '/api' || !path.includes('/api/v1')) {
      url.pathname = '/api/v1'
    }

    url.search = ''
    url.hash = ''
    return `${url.origin}${url.pathname.replace(/\/+$/, '')}`
  } catch {
    return '/api/v1'
  }
}

const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL as string | undefined,
)

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

export const merchantApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

function isAuthFormRequest(config: { url?: string }): boolean {
  const url = config.url ?? ''
  return url.includes('/login')
}

/** Pending merchants may still pay / complete plan checkout to self-activate. */
function isPendingPlanPaymentRequest(config: {
  url?: string
  method?: string
}): boolean {
  const method = (config.method ?? 'get').toLowerCase()
  if (['get', 'head', 'options'].includes(method)) return true

  const url = (config.url ?? '').replace(/^\//, '')
  return (
    url === 'admin/plans/checkout' ||
    url.startsWith('admin/plans/checkout?') ||
    url === 'admin/plans/renew' ||
    url.startsWith('admin/plans/renew?') ||
    url.includes('admin/plans/payments/')
  )
}

adminApi.interceptors.request.use(
  (config) => {
    if (isAuthFormRequest(config)) {
      if (config.headers) {
        delete config.headers.Authorization
        delete config.headers.authorization
      }
      return config
    }

    const adminToken = localStorage.getItem('admin_token')
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
    }

    return config
  },
  (error) => Promise.reject(error),
)

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthFormRequest(error.config ?? {})) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      localStorage.removeItem('admin_role')
      localStorage.removeItem('is_admin')
      window.location.href = '/admin/super/login'
    }

    return Promise.reject(error)
  },
)

merchantApi.interceptors.request.use(
  (config) => {
    if (isAuthFormRequest(config)) {
      if (config.headers) {
        delete config.headers.Authorization
        delete config.headers.authorization
      }
      return config
    }

    const merchantToken = localStorage.getItem('merchant_token')
    if (merchantToken) {
      config.headers.Authorization = `Bearer ${merchantToken}`
    }

    const method = (config.method ?? 'get').toLowerCase()
    if (!['get', 'head', 'options'].includes(method)) {
      if (isPendingPlanPaymentRequest(config)) {
        return config
      }

      try {
        const raw = localStorage.getItem('merchant_profile')
        const merchant = raw && raw !== 'null' ? JSON.parse(raw) : null
        if (merchant?.status === 'pending') {
          return Promise.reject({
            isAxiosError: true,
            response: {
              status: 403,
              data: {
                message:
                  'Merchant onboarding is pending. Pay for a plan under Plan to activate, or wait for a super admin to activate your account.',
                error: 'pending_onboarding',
              },
            },
            message: 'Pending onboarding',
            config,
          })
        }
      } catch {
        // ignore parse errors
      }
    }

    return config
  },
  (error) => Promise.reject(error),
)

merchantApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthFormRequest(error.config ?? {})) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('merchant_token')
      localStorage.removeItem('merchant_user')
      localStorage.removeItem('merchant_profile')
      localStorage.removeItem('merchant_role')
      window.location.href = '/admin/login'
    }

    return Promise.reject(error)
  },
)

export default api
