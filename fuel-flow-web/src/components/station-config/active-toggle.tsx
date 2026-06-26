/**
 * [M08-F03] Active/Inactive toggle for station-config entities (fuel types,
 * nozzles, …). Renders a real Switch reflecting `isActive`; flipping ON calls
 * `onActivate()`, flipping OFF calls `onDeactivate()` — the parent decides
 * whether to mutate directly or open a confirm dialog. The wrapper span keeps
 * the tooltip's data-state off the Switch so the Switch's own checked/unchecked
 * data-state drives its styling.
 */
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function ActiveToggle({
  isActive,
  entityLabel,
  isPending,
  onActivate,
  onDeactivate,
}: {
  isActive: boolean
  entityLabel: string
  isPending: boolean
  onActivate: () => void
  onDeactivate: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Switch
            checked={isActive}
            disabled={isPending}
            onCheckedChange={(checked) =>
              checked ? onActivate() : onDeactivate()
            }
            aria-label={
              isActive ? `Deactivate ${entityLabel}` : `Activate ${entityLabel}`
            }
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {isActive
          ? "Active — turn off to deactivate"
          : "Inactive — turn on to activate"}
      </TooltipContent>
    </Tooltip>
  )
}
