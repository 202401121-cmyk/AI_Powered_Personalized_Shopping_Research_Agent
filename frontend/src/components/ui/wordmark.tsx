import React from "react";
import { Check } from "lucide-react";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Wordmark({ className = "", size = "md" }: WordmarkProps) {
  const iconSize = size === "sm" ? 14 : size === "lg" ? 20 : 16;
  const squareSize = size === "sm" ? "w-6 h-6" : size === "lg" ? "w-9 h-9" : "w-7 h-7";
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className={`inline-flex items-center gap-2.5 font-display font-bold tracking-tight select-none ${className}`}>
      <div
        className={`${squareSize} rounded-control bg-brand flex items-center justify-center text-white shrink-0`}
        aria-hidden="true"
      >
        <Check size={iconSize} strokeWidth={2.5} />
      </div>
      <span className={`${textSize} text-ink tracking-tight`}>ShopSense</span>
    </div>
  );
}
