import axios from 'axios'

// Relative by default so the browser hits the current domain's /api.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

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
