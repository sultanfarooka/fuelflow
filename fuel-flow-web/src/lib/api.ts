/**
 * API client configuration for Fuel Flow
 * 
 * This file sets up the base API client with:
 * - Base URL configuration
 * - JWT token handling
 * - Request/response interceptors
 * - Error handling
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

/**
 * API client with JWT auth support
 */
class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  /**
   * Get auth token from localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  /**
   * Base fetch wrapper with auth and error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken()
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as { error?: string; message?: string }
      throw new Error(error.error ?? error.message ?? `HTTP ${response.status}`)
    }

    return response.json()
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL)
