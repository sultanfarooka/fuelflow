import { motion } from "motion/react";

import { cn } from "@/lib/utils";

import { screenVariants } from "./animation";
import { BrandHeader, BrandPanel } from "./brand-surfaces";
import type { Viewport } from "./viewport";

// The shared auth-flow shell. Every auth-family feature (registration, login,
// phone OTP, password recovery, PIN login, lockout, onboarding) uses this exact
// layout. If you're building an auth screen, wrap your form column in this.
//
//   <AuthShell viewport={v} fullscreen={fs}>
//     <FormColumn viewport={v} state={state} fullscreen={fs} />
//   </AuthShell>
//
// - Desktop: 460px vertical brand panel + form column
// - Tablet:  320px vertical brand panel (compact) + form column
// - Mobile:  horizontal brand header (with menu sheet) + form column
export const AuthShell = ({
  viewport,
  fullscreen = false,
  children,
}: {
  viewport: Viewport;
  fullscreen?: boolean;
  children: React.ReactNode;
}) => {
  if (viewport === "mobile") {
    return (
      <motion.div
        className={cn("flex w-full flex-col bg-background", fullscreen && "min-h-screen")}
        style={{ minHeight: fullscreen ? undefined : 760 }}
        initial="hidden"
        animate="visible"
        variants={screenVariants}
      >
        <BrandHeader />
        {children}
      </motion.div>
    );
  }

  if (viewport === "tablet") {
    return (
      <motion.div
        className={cn("grid w-full bg-background", fullscreen && "min-h-screen")}
        style={{
          gridTemplateColumns: "minmax(0, 320px) minmax(0, 1fr)",
          minHeight: fullscreen ? undefined : 760,
        }}
        initial="hidden"
        animate="visible"
        variants={screenVariants}
      >
        <BrandPanel compact />
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn("grid w-full bg-background", fullscreen && "min-h-screen")}
      style={{
        gridTemplateColumns: "minmax(0, 460px) minmax(0, 1fr)",
        minHeight: fullscreen ? undefined : 760,
      }}
      initial="hidden"
      animate="visible"
      variants={screenVariants}
    >
      <BrandPanel />
      {children}
    </motion.div>
  );
};
