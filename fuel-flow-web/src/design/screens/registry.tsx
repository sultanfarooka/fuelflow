import type { ComponentType } from "react";

import M01F01Registration from "./M01/F01-registration";
import M01F02EmailVerification from "./M01/F02-email-verification";
import M01F03Login from "./M01/F03-login";
import M01F04PasswordRecovery from "./M01/F04-password-recovery";
import M01F05RolesHierarchy from "./M01/F05-roles-hierarchy";
import M01F06GranularPermissions from "./M01/F06-granular-permissions";
import M01F07MultiStationAccess from "./M01/F07-multi-station-access";
import M01F08AuditTrail from "./M01/F08-audit-trail";
import M01F09PhoneFirstAuth from "./M01/F09-phone-first-auth";

/**
 * Registry of designed screens, keyed by `MXX-FXX` feature id.
 *
 * The `/design/:module/:feature` route looks up the component here. Missing
 * entries fall back to the "Design pending" placeholder. Add an entry when
 * a feature has at least one designed preview frame.
 */
export const SCREEN_REGISTRY: Record<string, ComponentType> = {
  "M01-F01": M01F01Registration,
  "M01-F02": M01F02EmailVerification,
  "M01-F03": M01F03Login,
  "M01-F04": M01F04PasswordRecovery,
  "M01-F05": M01F05RolesHierarchy,
  "M01-F06": M01F06GranularPermissions,
  "M01-F07": M01F07MultiStationAccess,
  "M01-F08": M01F08AuditTrail,
  "M01-F09": M01F09PhoneFirstAuth,
};

export function findScreen(featureId: string): ComponentType | undefined {
  return SCREEN_REGISTRY[featureId.toUpperCase()];
}
