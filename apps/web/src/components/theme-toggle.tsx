"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

function getTheme() {
  if (typeof document === "undefined") return "light";
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function setTheme(theme: "light" | "dark") {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("pf-theme", theme);
  } catch {}
}

export function ThemeToggle() {
  const [theme, setThemeState] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    setThemeState(getTheme() as "light" | "dark");
  }, []);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        setThemeState(next);
      }}
      title="Toggle theme"
      className="gap-2"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{theme === "dark" ? "Light" : "Dark"}</span>
    </Button>
  );
}

