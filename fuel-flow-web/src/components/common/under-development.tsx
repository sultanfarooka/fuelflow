/**
 * [M07-F10-R03/R05] Shared placeholder for module pages that exist in the nav
 * but have no built implementation yet. Accepts module name, description, and
 * an optional icon so each module can pass its own branding.
 */
import { IconHammer, type Icon } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UnderDevelopmentProps {
  /** Translated module name shown as the page heading. */
  moduleName: string
  /** Optional one-line description of what the module will do. */
  description?: string
  /** Optional Tabler icon to represent the module. Defaults to IconHammer. */
  icon?: Icon
}

export function UnderDevelopment({ moduleName, description, icon: ModuleIcon = IconHammer }: UnderDevelopmentProps) {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">{moduleName}</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ModuleIcon className="size-5" />
            </span>
            <div>
              <CardTitle>{t("underDevelopment.title")}</CardTitle>
              <CardDescription>
                {description ?? t("underDevelopment.body")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("underDevelopment.detail")}
        </CardContent>
      </Card>
    </div>
  )
}
