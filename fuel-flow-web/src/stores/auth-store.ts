import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { type LoginResponse, type UserInfo, type SubscriptionInfo } from '@/lib/api/auth/login'

interface AuthState {
  expiresIn: number | null
  isAuthenticated: boolean
  user: UserInfo | null
  subscription: SubscriptionInfo | null
  setAuthState: (loginResponse: LoginResponse) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      expiresIn: null,
      isAuthenticated: false,
      user: null,
      subscription: null,
      setAuthState: (loginResponse: LoginResponse) => {
        set({
          expiresIn: loginResponse.expiresIn,
          isAuthenticated: true,
          user: loginResponse.user,
          subscription: loginResponse.subscription,
        })
      },
      logout: () => {
        set({
          expiresIn: null,
          isAuthenticated: false,
          user: null,
          subscription: null,
        })
      },
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, subscription: s.subscription, isAuthenticated: s.isAuthenticated, expiresIn: s.expiresIn }) }
  )
)