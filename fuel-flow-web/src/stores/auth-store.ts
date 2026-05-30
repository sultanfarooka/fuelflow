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
  /**
   * [M12-F02-R01] Effective onboarding dev-bypass flag from the auth
   * response. Mirrors the backend's `IHostEnvironment.IsDevelopment() &&
   * Features:OnboardingDevBypass`. Consumed by the dashboard route guard
   * and the wizard "Skip to Dashboard" affordance.
   */
  devBypassActive: boolean
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
      devBypassActive: false,
      setAuthState: (loginResponse: LoginResponse) => {
        set({
          expiresIn: loginResponse.expiresIn,
          isAuthenticated: true,
          user: loginResponse.user,
          organization: loginResponse.organization ?? null,
          stations: loginResponse.stations ?? null,
          subscription: loginResponse.subscription ?? null,
          devBypassActive: loginResponse.devBypassActive ?? false,
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
          devBypassActive: false,
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
        devBypassActive: s.devBypassActive,
      }),
    }
  )
)