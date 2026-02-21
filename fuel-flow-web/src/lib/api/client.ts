/**
 * API client configuration for Fuel Flow
 *
 * This file sets up the base API client with:
 * - Base URL configuration
 * - JWT token handling
 * - Request/response interceptors
 * - Error handling
 */

import axios, { type AxiosInstance } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5035/api/v1'

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor — add JWT token when available
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — normalize errors to Error with API message
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      `HTTP ${error.response?.status ?? 'Unknown'}`
    throw new Error(message)
  }
)

/**
 * API client with JWT auth support.
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
