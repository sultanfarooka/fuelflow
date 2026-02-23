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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5035/api/v1'

let onAuthFailure: () => void = () => { window.location.href = '/auth/login' }

export function setupAuthFailureHandler(handler: () => void) {
  onAuthFailure = handler
}

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 401 interceptor: try refresh, retry; on refresh failure, call onAuthFailure
let isRefreshing = false

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const isRefreshRequest = originalRequest.url?.includes('/auth/refreshToken')
      if (isRefreshRequest) {
        onAuthFailure()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return Promise.reject(error)
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        await axiosInstance.post('/auth/refreshToken', {})
        isRefreshing = false
        return axiosInstance(originalRequest)
      } catch (refreshError) {
        isRefreshing = false
        onAuthFailure()
        return Promise.reject(refreshError)
      }
    }

    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      `HTTP ${error.response?.status ?? 'Unknown'}`
    throw new Error(message)
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

  delete: <T>(endpoint: string) =>
    axiosInstance.delete<T>(endpoint).then((res) => res.data),
}
