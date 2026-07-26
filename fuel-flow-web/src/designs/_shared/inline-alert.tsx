import type { IconProps } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Inline recovery alert used inside auth forms to surface 4xx API errors.
//
// Wraps the icon in a flex row with the title to defeat shadcn's
// `has-[>svg]:grid-cols-[auto_1fr]` grid override — otherwise the icon column
// eats horizontal width and the body text collapses to one word per line at
// narrow viewport frames.
//
//   <InlineAlert
//     icon={IconAlertHexagon}
//     title="This phone number is already registered"
//     description={`An account already exists for ${phone}. …`}
//     actions={
//       <>
//         <Button size="sm" variant="outline" className="bg-background">Sign in</Button>
//         <Button size="sm" variant="ghost">Recover password</Button>
//       </>
//     }
//   />
export const InlineAlert = ({
  variant = "destructive",
  icon: Icon,
  iconClassName,
  title,
  description,
  actions,
  stackActions = false,
  className,
}: {
  variant?: "default" | "destructive";
  icon: React.ComponentType<IconProps>;
  iconClassName?: string;
  title: React.ReactNode;
  description: React.ReactNode;
  actions?: React.ReactNode;
  // Narrow frames cannot fit two recovery buttons side by side, and a wrapped
  // auto-width button is both ugly and below the 44px touch target. Stacking
  // makes each action full-width and finger-sized.
  stackActions?: boolean;
  className?: string;
}) => (
  <Alert
    variant={variant}
    className={cn(
      variant === "destructive" && "border-destructive/40 bg-destructive/5",
      className,
    )}
  >
    <div className="flex items-center gap-2">
      <Icon className={cn("size-4", iconClassName)} />
      <AlertTitle className="m-0">{title}</AlertTitle>
    </div>
    <AlertDescription className="mt-2">{description}</AlertDescription>
    {actions ? (
      <div
        className={cn(
          "mt-3 flex gap-2",
          stackActions
            ? "flex-col [&>button]:h-11 [&>button]:w-full"
            : "flex-wrap",
        )}
      >
        {actions}
      </div>
    ) : null}
  </Alert>
);
