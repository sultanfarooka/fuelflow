import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  IconDeviceDesktop,
  IconExternalLink,
  IconLogin2,
  IconMenu2,
  IconMoon,
  IconShieldCheck,
  IconSun,
  type IconProps,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { FuelFlowMark } from "@/components/brand/fuel-flow-mark";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  EASE_OUT_BACK,
  EASE_OUT_QUART,
  SCENE_GRADIENT_DURATION,
  SCENE_ICON_POP_DURATION,
  SCENE_TRANSITION_DURATION,
  columnVariants,
  itemVariants,
} from "./animation";
import { BRAND_SCENES, SCENE_GRADIENTS, useBrandScene } from "./brand-scenes";

export const SceneDots = ({
  count,
  active,
  onSelect,
  tone = "light",
}: {
  count: number;
  active: number;
  onSelect: (i: number) => void;
  tone?: "light" | "dark";
}) => {
  const inactiveBg =
    tone === "light" ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)";
  return (
    <div
      className="flex items-center gap-1.5"
      role="tablist"
      aria-label="Feature highlights"
    >
      {Array.from({ length: count }, (_, i) => {
        const isActive = i === active;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={`Show feature ${i + 1}`}
            onClick={() => onSelect(i)}
            className="group cursor-pointer p-1"
          >
            <motion.span
              initial={false}
              animate={{
                width: isActive ? 24 : 6,
                backgroundColor: isActive ? "var(--primary)" : inactiveBg,
              }}
              transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
              className="block h-1.5 rounded-full"
            />
          </button>
        );
      })}
    </div>
  );
};

export const BrandPanel = ({ compact = false }: { compact?: boolean }) => {
  const [sceneIdx, setSceneIdx] = useBrandScene();
  const scene = BRAND_SCENES[sceneIdx];
  const SceneIcon = scene.icon;

  return (
    <motion.aside
      variants={columnVariants}
      className={cn(
        "relative flex flex-col justify-between overflow-hidden bg-foreground text-background dark:bg-background dark:text-foreground",
        compact ? "p-7" : "p-10",
      )}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={`scene-bg-${sceneIdx}`}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          exit={{ opacity: 0 }}
          transition={{ duration: SCENE_GRADIENT_DURATION, ease: "easeInOut" }}
          style={{ background: SCENE_GRADIENTS[sceneIdx] }}
        />
      </AnimatePresence>

      <motion.div variants={itemVariants} className="relative z-10 flex items-center gap-2.5">
        <FuelFlowMark className="size-9 text-primary" />
        <span className="text-base font-semibold tracking-tight">Fuel Flow</span>
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="relative z-10 flex flex-col gap-6"
        style={{ minHeight: compact ? 200 : 220 }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={sceneIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: SCENE_TRANSITION_DURATION, ease: EASE_OUT_QUART }}
            className="flex flex-col gap-5"
          >
            <motion.span
              className="flex size-10 items-center justify-center rounded-lg bg-background/10 ring-1 ring-inset ring-background/15 dark:bg-foreground/10 dark:ring-foreground/15"
              initial={{ scale: 0.55, rotate: -18 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: SCENE_ICON_POP_DURATION, ease: EASE_OUT_BACK }}
            >
              <SceneIcon className="size-5" />
            </motion.span>
            <h2
              className={cn(
                "font-semibold leading-[1.15]",
                compact ? "text-2xl" : "text-3xl",
              )}
            >
              {scene.title}
            </h2>
            <p
              className={cn(
                "text-sm text-background/75 dark:text-foreground/75",
                compact ? "max-w-[28ch]" : "max-w-[38ch]",
              )}
            >
              {scene.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <SceneDots
          count={BRAND_SCENES.length}
          active={sceneIdx}
          onSelect={setSceneIdx}
        />
      </motion.div>

      <motion.p
        variants={itemVariants}
        className="relative z-10 text-xs text-background/60 dark:text-foreground/60"
      >
        © 2026 Fuel Flow Pakistan
      </motion.p>
    </motion.aside>
  );
};

type ThemeChoice = "light" | "dark" | "system";
type LangChoice = "en" | "ur";
type IconComponent = React.ComponentType<IconProps>;

type SegmentedOption = {
  value: string;
  label: string;
  icon?: IconComponent;
};

const SegmentedSetting = ({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: SegmentedOption[];
}) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {label}
    </span>
    <div
      className="inline-flex items-center rounded-md bg-muted p-0.5 text-sm font-medium"
      role="group"
      aria-label={label}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 rounded-[5px] px-3 py-1.5 transition-colors",
              active
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-3.5" /> : null}
            {opt.label}
          </button>
        );
      })}
    </div>
  </div>
);

const MenuLink = ({
  icon: Icon,
  label,
}: {
  icon: IconComponent;
  label: string;
}) => (
  <button
    type="button"
    className="inline-flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
  >
    <Icon className="size-4 text-muted-foreground" />
    {label}
  </button>
);

export const BrandHeader = () => {
  const [sceneIdx] = useBrandScene();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>("system");
  const [lang, setLang] = useState<LangChoice>("en");

  return (
    <motion.aside
      variants={columnVariants}
      className="relative flex items-center justify-between overflow-hidden bg-foreground px-4 py-4 text-background dark:bg-background dark:text-foreground"
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={`mobile-bg-${sceneIdx}`}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.55 }}
          exit={{ opacity: 0 }}
          transition={{ duration: SCENE_GRADIENT_DURATION, ease: "easeInOut" }}
          style={{ background: SCENE_GRADIENTS[sceneIdx] }}
        />
      </AnimatePresence>

      <div className="relative z-10 flex items-center gap-2">
        <FuelFlowMark className="size-7 text-primary" />
        <span className="text-sm font-semibold tracking-tight">Fuel Flow</span>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open menu"
            className="relative z-10 inline-flex size-9 items-center justify-center rounded-md bg-background/10 text-background ring-1 ring-inset ring-background/15 transition-colors hover:bg-background/15 dark:bg-foreground/10 dark:text-foreground dark:ring-foreground/15 dark:hover:bg-foreground/15"
          >
            <IconMenu2 className="size-4" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[88%] max-w-sm flex flex-col gap-0 p-0">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="text-base">Menu</SheetTitle>
            <SheetDescription className="text-xs">
              Theme, language, and account
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
            <SegmentedSetting
              label="Theme"
              value={theme}
              onChange={(v) => setTheme(v as ThemeChoice)}
              options={[
                { value: "light", label: "Light", icon: IconSun },
                { value: "dark", label: "Dark", icon: IconMoon },
                { value: "system", label: "System", icon: IconDeviceDesktop },
              ]}
            />

            <SegmentedSetting
              label="Language"
              value={lang}
              onChange={(v) => setLang(v as LangChoice)}
              options={[
                { value: "en", label: "English" },
                { value: "ur", label: "اردو" },
              ]}
            />

            <Separator />

            <div className="flex flex-col gap-1">
              <MenuLink icon={IconLogin2} label="Sign in" />
              <MenuLink icon={IconShieldCheck} label="Privacy & security" />
              <MenuLink icon={IconExternalLink} label="Help & support" />
            </div>
          </div>

          <div className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
            Fuel Flow
          </div>
        </SheetContent>
      </Sheet>
    </motion.aside>
  );
};
