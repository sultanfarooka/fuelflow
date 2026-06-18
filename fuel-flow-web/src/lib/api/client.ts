/**
 * API client configuration for Fuel Flow
 *
 * This file sets up the base API client with:
 * - Base URL configuration
 * - Cookie-based auth (withCredentials sends HTTP-only cookies automatically)
 * - 401 interceptor: refresh token, retry; on refresh failure, call onAuthFailure
 * - Response interceptors and error handling
 *
 * Call setupAuthFailureHandler() from main.tsx to wire logout + redirect.
 */

import axios, { type AxiosInstance } from 'axios'

import { emitNetworkError, emitNetworkOk } from '@/lib/network-status'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5035/api/v1'

// Endpoints where 401 should be returned to the component instead of triggering redirect
// Add endpoint paths here when you need to handle 401 in UI (e.g., ['/user/profile'])
const ENDPOINTS_RETURN_401_TO_COMPONENT: string[] = ['/auth/login']

let onAuthFailure: () => void = () => { window.location.href = '/auth/login' }

export function setupAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler
}

// Check if URL matches any endpoint that should return 401 to component
const shouldReturn401ToComponent = (url: string): boolean => {
  return ENDPOINTS_RETURN_401_TO_COMPONENT.some((endpoint) => url.includes(endpoint))
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 401 interceptor: try refresh, retry; on refresh failure, call onAuthFailure
// Queue pattern: multiple 401s wait for a single token refresh, then retry together
let isRefreshing = false
let refreshSubscribers: Array<(error?: Error) => void> = []

// Queue requests that hit 401 while a refresh is in progress
const subscribeTokenRefresh = (cb: (error?: Error) => void) => {
  refreshSubscribers.push(cb)
}

// Notify all queued requests when refresh completes (success or failure)
const notifyTokenRefreshSubscribers = (error?: Error) => {
  refreshSubscribers.forEach((cb) => cb(error))
  refreshSubscribers = []
}

// M07-F08 — track transient network failures (no server response) so the global
// offline banner can react. Does not alter the 401-refresh / redirect flow.
let networkErrored = false

axiosInstance.interceptors.response.use(
  (response) => {
    if (networkErrored) {
      networkErrored = false
      emitNetworkOk()
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // No response → offline or server unreachable (exclude user cancellations).
    if (!error.response && !axios.isCancel(error)) {
      networkErrored = true
      emitNetworkError()
    }

    const url: string = originalRequest?.url ?? ''
    const isRefreshRequest = url.includes('/auth/refreshToken')

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Endpoints that should return 401 to component without redirect
      if (shouldReturn401ToComponent(url)) {
        return Promise.reject(error)
      }

      // Refresh token request itself failed → trigger auth failure
      if (isRefreshRequest) {
        notifyTokenRefreshSubscribers(error)
        onAuthFailure()
        return Promise.reject(error)
      }

      // Queue pattern: wait for ongoing refresh to complete, then retry
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((err) => {
            if (err) reject(err)
            else resolve(axiosInstance(originalRequest))
          })
        })
      }

      // First 401: start token refresh
      originalRequest._retry = true
      isRefreshing = true

      try {
        await axiosInstance.post('/auth/refreshToken', {})
        isRefreshing = false
        notifyTokenRefreshSubscribers()
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        notifyTokenRefreshSubscribers(refreshError as Error)
        onAuthFailure()
        return Promise.reject(refreshError)
      }
    }

    const data = error.response?.data as
      | {
          error?: string
          message?: string
          title?: string
          detail?: string
          errors?: Record<string, string[]>
        }
      | undefined

    const fieldMessages =
      data?.errors &&
      Object.values(data.errors)
        .flat()
        .filter(Boolean)

    const message =
      (fieldMessages && fieldMessages[0]) ??
      data?.error ??
      data?.message ??
      data?.detail ??
      data?.title ??
      error.message ??
      `HTTP ${error.response?.status ?? 'Unknown'}`

    const wrappedError = new Error(message) as Error & {
      response?: typeof error.response
    }
    if (error.response) {
      wrappedError.response = error.response
    }
    throw wrappedError
  }
)

/**
 * API client with cookie-based auth.
 * withCredentials sends HTTP-only cookies on every request.
 * Methods return response.data directly (parsed JSON body).
 */
export const api = {
  get: <T>(endpoint: string) =>
    axiosInstance.get<T>(endpoint).then((res) => res.data),

  post: <T>(endpoint: string, data: unknown) =>
    axiosInstance.post<T>(endpoint, data).then((res) => res.data),

  put: <T>(endpoint: string, data: unknown) =>
    axiosInstance.put<T>(endpoint, data).then((res) => res.data),

  patch: <T>(endpoint: string, data: unknown) =>
    axiosInstance.patch<T>(endpoint, data).then((res) => res.data),

  delete: <T>(endpoint: string) =>
    axiosInstance.delete<T>(endpoint).then((res) => res.data),
}
