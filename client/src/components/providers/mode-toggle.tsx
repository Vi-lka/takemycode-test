"use client";

import { Button, type buttonVariants } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { type VariantProps } from "class-variance-authority";
import { useTheme } from "./theme-provider";

export function ModeToggle({
  variant = "outline",
  className
}: {
  variant?: VariantProps<typeof buttonVariants>["variant"]
  className?: string
}) {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      className={cn("relative rounded-full w-8 h-8", className)}
      variant={variant}
      size="icon"
      onClick={() => setTheme((theme === "dark" || theme === "system") ? "light" : "dark")}
    >
      <Sun className="w-[1.2rem] h-[1.2rem] rotate-90 scale-0 transition-transform ease-in-out duration-500 dark:rotate-0 dark:scale-100" />
      <Moon className="absolute w-[1.2rem] h-[1.2rem] rotate-0 scale-100 transition-transform ease-in-out duration-500 dark:-rotate-90 dark:scale-0" />
      {/* <span className="sr-only">Toggle theme</span> */}
    </Button>
  );
}
