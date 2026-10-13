import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "brand" | "secondary" | "outline" | "ghost" | "soft";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "brand", size = "md", children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-body font-medium transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand disabled:opacity-50 disabled:pointer-events-none rounded-control";

    const variantStyles = {
      brand:
        "bg-brand text-brand-on-brand hover:bg-brand-hover active:bg-brand-hover shadow-sm",
      secondary:
        "bg-surface-2 text-ink hover:bg-line active:bg-line border border-line",
      outline:
        "bg-surface text-ink hover:bg-surface-2 active:bg-surface-2 border border-line",
      soft:
        "bg-brand-soft text-brand hover:bg-brand hover:text-brand-on-brand",
      ghost:
        "text-ink-2 hover:bg-surface-2 hover:text-ink",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-sm gap-1.5 min-h-[32px]",
      md: "h-10 px-4 text-sm gap-2 min-h-[40px]",
      lg: "h-12 px-5 text-base gap-2.5 min-h-[44px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
