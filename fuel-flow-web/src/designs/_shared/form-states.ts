export type FormState =
  | "default"
  | "empty"
  | "loading"
  | "error"
  | "api-409"
  | "api-429";

export const FORM_STATES: FormState[] = [
  "default",
  "empty",
  "loading",
  "error",
  "api-409",
  "api-429",
];

// Generic state labels for the ViewportFrame badge.
// Features can override in their own STATE_BADGES map when the API errors
// have a more specific meaning (e.g. api-409 = "duplicate phone" in M01-F01
// vs api-409 = "email already taken" in M01-F10).
export const DEFAULT_STATE_BADGES: Record<FormState, string> = {
  default: "Default",
  empty: "Empty",
  loading: "Loading",
  error: "Field validation errors",
  "api-409": "API error · 409",
  "api-429": "API error · 429 rate limited",
};
