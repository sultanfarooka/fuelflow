/**
 * [M07-F07-R02] Top-bar station switcher. Lists every station the user can see
 * plus an "All Stations" option (org consolidated view). Selecting a station
 * sets it active (module nav links scope to it) and navigates to its overview;
 * "All Stations" clears the active station and returns to `/dashboard`.
 */
import { useNavigate } from "@tanstack/react-router"
import { IconCheck, IconChevronDown, IconGasStation } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/stores/auth-store"
import { useUiStore } from "@/stores/ui-store"

export function StationSwitcher() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const stations = useAuthStore((s) => s.stations)
  const activeStationId = useUiStore((s) => s.activeStationId)
  const setActiveStation = useUiStore((s) => s.setActiveStation)

  if (!stations || stations.length === 0) return null

  const activeStation = stations.find((s) => s.id === activeStationId)
  const label = activeStation?.name ?? t("stationSwitcher.allStations")

  const selectStation = (stationId: string) => {
    setActiveStation(stationId)
    navigate({ to: "/dashboard/station/$stationId", params: { stationId } })
  }

  const selectAll = () => {
    setActiveStation(null)
    navigate({ to: "/dashboard" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[12rem] gap-2">
          <IconGasStation className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{label}</span>
          <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{t("stationSwitcher.label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {stations.map((station) => (
          <DropdownMenuItem
            key={station.id}
            onClick={() => selectStation(station.id)}
            className="cursor-pointer justify-between"
          >
            <span className="truncate">{station.name}</span>
            {station.id === activeStationId && <IconCheck className="size-4" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={selectAll}
          className="cursor-pointer justify-between"
        >
          <span>{t("stationSwitcher.allStations")}</span>
          {activeStationId === null && <IconCheck className="size-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
