import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 * [M07-F07-R02] Client-only UI state for the app shell. Holds the active
 * station selected via the top-bar station switcher; module nav links are
 * scoped to this id. `null` means "All Stations" (org consolidated view).
 *
 * Per the state-management rules in fuel-flow-web/CLAUDE.md, station *selection*
 * is client UI state (Zustand), not server data (TanStack Query). The station
 * list itself lives in the auth store.
 */
interface UiState {
  activeStationId: string | null
  setActiveStation: (stationId: string | null) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeStationId: null,
      setActiveStation: (stationId) => set({ activeStationId: stationId }),
    }),
    {
      name: "fuel-flow-ui",
      partialize: (s) => ({ activeStationId: s.activeStationId }),
    }
  )
)
