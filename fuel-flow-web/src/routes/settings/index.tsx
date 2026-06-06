/**
 * [M07-F07] Settings landing — stub. Renders a "Coming soon" placeholder inside
 * the app shell until M08 (Settings & Configuration) ships its content.
 */
import { createFileRoute } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { ComingSoon } from "@/components/common/coming-soon"

export const Route = createFileRoute("/settings/")({
  component: SettingsStubPage,
})

function SettingsStubPage() {
  const { t } = useTranslation()
  return <ComingSoon title={t("nav.settings")} />
}
