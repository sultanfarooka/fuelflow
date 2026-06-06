import * as React from "react"

// [M07-F07-R04] Sidebar collapses to a drawer below 640px (Tailwind `sm`).
// Kept in lock-step with the `sm:` show/hide gate in components/ui/sidebar.tsx —
// if these diverge the desktop sidebar disappears in the gap between the two
// breakpoints. AC3 requires the drawer at any viewport < 640px.
const MOBILE_BREAKPOINT = 640

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
