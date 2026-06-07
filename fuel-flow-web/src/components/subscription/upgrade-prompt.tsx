/**
 * [M07-F10-R04/R05] Shown when a Starter-plan user navigates to a Pro+-gated
 * module. Links to the public pricing page (/pricing, M11-F08).
 */
import { IconLock } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface UpgradePromptProps {
  /** Translated feature name shown in the prompt body. */
  featureName: string
  /** Optional extra context shown below the main message. */
  description?: string
}

export function UpgradePrompt({ featureName, description }: UpgradePromptProps) {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">{featureName}</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconLock className="size-5" />
            </span>
            <div>
              <CardTitle>{t("upgradePrompt.title")}</CardTitle>
              <CardDescription>
                {t("upgradePrompt.body", { featureName })}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        {description && (
          <CardContent className="text-sm text-muted-foreground">
            {description}
          </CardContent>
        )}
        <CardContent>
          <Button asChild>
            <Link to="/pricing">{t("upgradePrompt.cta")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
