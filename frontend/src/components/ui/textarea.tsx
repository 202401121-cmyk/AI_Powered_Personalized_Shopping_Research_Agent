import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, disabled, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        disabled={disabled}
        className={cn(
          "w-full rounded-control border border-line bg-surface px-3.5 py-2.5 text-base text-ink placeholder:text-muted transition-colors resize-none",
          "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
