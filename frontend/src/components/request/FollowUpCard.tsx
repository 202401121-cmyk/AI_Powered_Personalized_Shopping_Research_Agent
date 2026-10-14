"use client";

import React from "react";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FollowUpCardProps {
  question: string;
  options: string[];
  onSelectOption: (option: string) => void;
  disabled?: boolean;
}

export function FollowUpCard({
  question,
  options,
  onSelectOption,
  disabled = false,
}: FollowUpCardProps) {
  return (
    <div
      role="region"
      aria-label="Follow-up question"
      aria-live="polite"
      className="mt-4 p-4 sm:p-5 rounded-card bg-surface-2 border border-line animate-fade-rise"
    >
      <div className="flex items-start gap-2.5 mb-3">
        <HelpCircle size={18} className="text-brand shrink-0 mt-0.5" aria-hidden="true" />
        <div>
          <h3 className="font-display font-semibold text-ink text-sm sm:text-base">
            One more detail
          </h3>
          <p className="font-body text-ink-2 text-sm mt-0.5 leading-normal">{question}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Suggested options">
        {options.map((option, index) => (
          <Button
            key={option}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => onSelectOption(option)}
            className="hover:border-brand hover:text-brand text-xs sm:text-sm font-medium animate-fade-rise"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
}
