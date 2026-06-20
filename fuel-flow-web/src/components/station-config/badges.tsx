/**
 * [M08-F08, M06-F01] Shared badge renderers for Station Configuration
 * panels. Accept primitive props (not entity DTOs) so any panel can
 * compose them without coupling its DTO shape to ours.
 *
 * - SourceBadge: Custom (primary tint) vs OMC (outline) — Fuel Types,
 *   Fuel Pricing, future per-station rows.
 * - StatusBadge: Active (success) vs Inactive (destructive) — anywhere a
 *   row has a Boolean "is enabled" state (Fuel Types, future Tanks).
 * - SellableBadge: Sellable (success) vs Not yet sellable (muted) —
 *   Fuel Types panel.
 *
 * Tokens only — no raw Tailwind palette. Success token comes from
 * src/index.css (declared as oklch in :root + .dark by #35).
 */
import { Badge } from "@/components/ui/badge"

export function SourceBadge({ isCustom }: { isCustom: boolean }) {
  return isCustom ? (
    <Badge className="border-transparent bg-primary/10 text-primary hover:bg-primary/10">
      Custom
    </Badge>
  ) : (
    <Badge variant="outline">OMC</Badge>
  )
}

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="border-transparent bg-success/10 text-success hover:bg-success/10">
      Active
    </Badge>
  ) : (
    <Badge className="border-transparent bg-destructive/10 text-destructive hover:bg-destructive/10">
      Inactive
    </Badge>
  )
}

export function SellableBadge({ isSellable }: { isSellable: boolean }) {
  return isSellable ? (
    <Badge className="border-transparent bg-success/10 text-success hover:bg-success/10">
      Sellable
    </Badge>
  ) : (
    <Badge className="border-transparent bg-muted text-muted-foreground hover:bg-muted">
      Not yet sellable
    </Badge>
  )
}
