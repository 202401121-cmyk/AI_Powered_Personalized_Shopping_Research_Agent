import React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 100
  isIndeterminate?: boolean;
}

export function Progress({
  className,
  value = 0,
  isIndeterminate = false,
  ...props
}: ProgressProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={isIndeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative h-1 w-full overflow-hidden bg-line", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full bg-brand transition-all duration-200 ease-out",
          isIndeterminate && "w-1/3 animate-pulse"
        )}
        style={isIndeterminate ? undefined : { width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
