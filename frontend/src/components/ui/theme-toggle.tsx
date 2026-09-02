"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center p-2 text-text-secondary" />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Toggle theme"
          className="p-2 rounded-full hover:bg-surface-subtle text-text-secondary hover:text-brand transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-sky-400 -mt-5" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-xl border-border-base bg-surface">
        <DropdownMenuItem
          className={`cursor-pointer rounded-lg text-xs font-medium ${theme === "light" ? "text-brand font-bold bg-brand/5" : ""}`}
          onClick={() => setTheme("light")}
        >
          <Sun className="h-4 w-4 mr-2 text-amber-500" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`cursor-pointer rounded-lg text-xs font-medium ${theme === "dark" ? "text-brand font-bold bg-brand/5" : ""}`}
          onClick={() => setTheme("dark")}
        >
          <Moon className="h-4 w-4 mr-2 text-sky-400" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          className={`cursor-pointer rounded-lg text-xs font-medium ${theme === "system" ? "text-brand font-bold bg-brand/5" : ""}`}
          onClick={() => setTheme("system")}
        >
          <span className="h-4 w-4 mr-2 flex items-center justify-center text-xs">💻</span>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
