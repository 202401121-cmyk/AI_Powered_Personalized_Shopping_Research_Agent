import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "known"
    | "disputed"
    | "estimated"
    | "unverified"
    | "info"
    | "neutral"
    | "understood"
    | "source";
  isMono?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  isMono = false,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    known: "bg-brand-soft text-brand border border-brand/20",
    disputed: "bg-evidence-disputed-bg text-evidence-disputed-ink border border-evidence-disputed-ink/20",
    estimated: "bg-evidence-estimated-bg text-evidence-estimated-ink border border-evidence-estimated-ink/20",
    unverified: "bg-evidence-unverified-bg text-evidence-unverified-ink border border-line",
    info: "bg-evidence-info-bg text-evidence-info-ink border border-evidence-info-ink/20",
    neutral: "bg-surface-2 text-ink-2 border border-line",
    understood: "bg-brand-soft text-brand border border-brand/20 font-medium",
    source: "bg-surface-2 text-muted border border-line font-mono text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs select-none rounded-pill transition-colors leading-none",
        isMono || variant === "source" ? "font-mono" : "font-body",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
