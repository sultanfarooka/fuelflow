/**
 * [M07-F07] Shared placeholder for module pages that have a route + sidebar
 * link but no implementation yet (Shifts, Inventory, Finance, Reports,
 * Settings). Each module's own feature replaces its stub with real content.
 */
import { IconBarrierBlock } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ComingSoonProps {
  /** Translated module name shown as the page heading. */
  title: string
}

export function ComingSoon({ title }: ComingSoonProps) {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">{title}</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <IconBarrierBlock className="size-5" />
            </span>
            <div>
              <CardTitle>{t("comingSoon.title")}</CardTitle>
              <CardDescription>{t("comingSoon.body")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("comingSoon.detail")}
        </CardContent>
      </Card>
    </div>
  )
}
