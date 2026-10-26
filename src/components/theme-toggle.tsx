"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const themeCycle = ["light", "dark", "system"] as const;

const themeIcons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const themeLabels = {
  light: "Light",
  dark: "Dark",
  system: "System",
} as const;

const nextTheme = {
  light: "dark",
  dark: "system",
  system: "light",
} as const;

type ThemeName = (typeof themeCycle)[number];

function isThemeName(value: string | undefined): value is ThemeName {
  return value === "light" || value === "dark" || value === "system";
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const current: ThemeName = isThemeName(theme) ? theme : "system";
  const next = nextTheme[current];
  const Icon = mounted ? themeIcons[current] : Sun;

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={mounted ? `Switch to ${next} theme` : "Toggle theme"}
      title={mounted ? themeLabels[current] : undefined}
      className={className}
      disabled={!mounted}
      onClick={() => setTheme(next)}
    >
      <Icon className="size-4" />
    </Button>
  );
}
