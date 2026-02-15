"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({
  variant = "ghost",
  size = "icon",
  className = "",
}: {
  variant?: "ghost" | "outline";
  size?: "sm" | "icon" | "default" | "lg";
  className?: string;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "الوضع الليلي — اضغط للنهار" : "الوضع النهاري — اضغط للليل"}
    >
      {theme === "dark" ? (
        <Moon className="h-5 w-5" />
      ) : (
        <Sun className="h-5 w-5" />
      )}
    </Button>
  );
}
