"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden bg-surface text-text-primary transition-bg",
        className
      )}
      {...props}
    >
      {/* Aurora layer sits behind content */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          aria-hidden="true"
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,var(--color-white)_0%,var(--color-white)_7%,var(--color-transparent)_10%,var(--color-transparent)_12%,var(--color-white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,var(--color-black)_0%,var(--color-black)_7%,var(--color-transparent)_10%,var(--color-transparent)_12%,var(--color-black)_16%)]
            [--aurora:repeating-linear-gradient(100deg,var(--color-brand-lighter)_10%,var(--color-brand-soft)_15%,var(--color-brand)_20%,var(--color-brand-lighter)_25%,var(--color-brand-hover)_30%)]
            [background-image:var(--white-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter:blur(12px)
            invert
            after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)]
            after:[background-size:200%,_100%]
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            absolute -inset-[10px] opacity-40 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--color-transparent)_70%)]`
          )}
        ></div>
      </div>
      {children}
    </div>
  );
};
