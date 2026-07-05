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
  title,
  description,
  actions,
  className,
}: {
  variant?: "default" | "destructive";
  icon: React.ComponentType<IconProps>;
  title: React.ReactNode;
  description: React.ReactNode;
  actions?: React.ReactNode;
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
      <Icon className="size-4" />
      <AlertTitle className="m-0">{title}</AlertTitle>
    </div>
    <AlertDescription className="mt-2">{description}</AlertDescription>
    {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
  </Alert>
);
