import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import {
  type LoginResponse,
  type OrganizationInfo,
  type StationInfo,
  type SubscriptionInfo,
  type UserInfo,
} from '@/lib/api/auth/login'

interface AuthState {
  expiresIn: number | null
  isAuthenticated: boolean
  user: UserInfo | null
  organization: OrganizationInfo | null
  stations: StationInfo[] | null
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
      organization: null,
      stations: null,
      subscription: null,
      setAuthState: (loginResponse: LoginResponse) => {
        set({
          expiresIn: loginResponse.expiresIn,
          isAuthenticated: true,
          user: loginResponse.user,
          organization: loginResponse.organization ?? null,
          stations: loginResponse.stations ?? null,
          subscription: loginResponse.subscription ?? null,
        })
      },
      logout: () => {
        set({
          expiresIn: null,
          isAuthenticated: false,
          user: null,
          organization: null,
          stations: null,
          subscription: null,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({
        user: s.user,
        organization: s.organization,
        stations: s.stations,
        subscription: s.subscription,
        isAuthenticated: s.isAuthenticated,
        expiresIn: s.expiresIn,
      }),
    }
  )
)