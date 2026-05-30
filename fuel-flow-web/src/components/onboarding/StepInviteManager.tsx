import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface Props {
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}

// M01-F05-R02 (manager accounts) not yet shipped — form renders but invite is disabled
export function StepInviteManager({ onBack, onSkip }: Props) {
  const { t } = useTranslation()
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {t("onboarding.step8.hint")}
      </p>

      <Card size="sm">
        <CardHeader>
          <CardTitle>{t("onboarding.step8.cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="manager-name">{t("onboarding.step8.fullName")}</FieldLabel>
              <Input id="manager-name" placeholder="e.g. Ahmed Khan" disabled />
            </Field>
            <Field>
              <FieldLabel htmlFor="manager-phone">{t("onboarding.step8.phone")}</FieldLabel>
              <Input
                id="manager-phone"
                type="tel"
                placeholder="+92XXXXXXXXXX"
                disabled
              />
            </Field>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="w-fit">
                  <Button type="button" disabled>
                    {t("onboarding.step8.sendInvite")}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {t("onboarding.step8.comingSoon")}
              </TooltipContent>
            </Tooltip>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="h-10 px-4 text-sm">
          {t("onboarding.actions.back")}
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip} className="h-10 px-4 text-sm">
          {t("onboarding.actions.skip")}
        </Button>
      </div>
    </div>
  )
}
