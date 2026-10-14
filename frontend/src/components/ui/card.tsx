import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "surface-2" | "composer";
}

export function Card({
  className,
  variant = "surface",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    surface: "bg-surface border border-line",
    "surface-2": "bg-surface-2 border border-line",
    composer: "bg-surface border border-line shadow-composer",
  };

  return (
    <div
      className={cn("rounded-card p-5 transition-colors", variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
