import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  isMono?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", isMono = false, disabled, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full rounded-control border border-line bg-surface px-3.5 py-2 text-base text-ink placeholder:text-muted transition-colors",
          "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isMono ? "font-mono" : "font-body",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
