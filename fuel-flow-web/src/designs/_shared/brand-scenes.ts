import { useEffect, useState } from "react";
import {
  IconDeviceMobile,
  IconLock,
  IconUsers,
} from "@tabler/icons-react";

export type BrandScene = {
  icon: typeof IconDeviceMobile;
  title: string;
  description: string;
};

export const BRAND_SCENES: BrandScene[] = [
  {
    icon: IconDeviceMobile,
    title: "Run your station from any device.",
    description:
      "Manage shifts, fuel, credit, and pricing in one place. Phone-first sign-up keeps the friction low.",
  },
  {
    icon: IconUsers,
    title: "One login, every role.",
    description:
      "Owners, managers, accountants, and nozzlemen — each with the right access, across every station.",
  },
  {
    icon: IconLock,
    title: "Every action audited, by design.",
    description:
      "Bank-grade audit log records the who, when, and why for shift opens, price changes, and credit posts.",
  },
];

export const SCENE_INTERVAL_MS = 5000;

export const SCENE_GRADIENTS = [
  "radial-gradient(60% 50% at 20% 10%, color-mix(in oklch, var(--primary) 55%, transparent), transparent 70%), radial-gradient(45% 35% at 85% 90%, color-mix(in oklch, var(--primary) 30%, transparent), transparent 70%)",
  "radial-gradient(55% 45% at 80% 20%, color-mix(in oklch, oklch(0.7 0.18 55) 60%, transparent), transparent 70%), radial-gradient(45% 35% at 10% 85%, color-mix(in oklch, var(--primary) 25%, transparent), transparent 70%)",
  "radial-gradient(60% 50% at 50% 95%, color-mix(in oklch, oklch(0.55 0.22 25) 55%, transparent), transparent 70%), radial-gradient(40% 35% at 50% 0%, color-mix(in oklch, var(--primary) 35%, transparent), transparent 70%)",
];

export const useBrandScene = () => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setIdx((i) => (i + 1) % BRAND_SCENES.length);
    }, SCENE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);
  return [idx, setIdx] as const;
};
