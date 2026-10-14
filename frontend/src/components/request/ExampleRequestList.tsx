"use client";

import React from "react";
import { Lightbulb, ArrowRight } from "lucide-react";

interface ExampleRequestListProps {
  examples: string[];
  onSelectExample: (example: string) => void;
  disabled?: boolean;
}

export function ExampleRequestList({
  examples,
  onSelectExample,
  disabled = false,
}: ExampleRequestListProps) {
  return (
    <div
      role="region"
      aria-label="Example requests"
      aria-live="polite"
      className="mt-4 p-4 sm:p-5 rounded-card bg-surface-2 border border-line animate-fade-rise"
    >
      <div className="flex items-center gap-2 mb-2 text-ink">
        <Lightbulb size={18} className="text-brand shrink-0" aria-hidden="true" />
        <h3 className="font-display font-semibold text-sm sm:text-base">Example requests</h3>
      </div>
      <p className="font-body text-ink-2 text-xs sm:text-sm mb-3">
        We still do not know the product type. Pick an example, or rewrite your request. ShopSense
        will not guess a category.
      </p>

      <ul className="flex flex-col gap-2">
        {examples.map((example, index) => (
          <li key={example} className="animate-fade-rise" style={{ animationDelay: `${index * 60}ms` }}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSelectExample(example)}
              className="group w-full flex items-center justify-between text-left p-3 rounded-control bg-surface border border-line hover:border-brand hover:bg-brand-soft/30 transition-colors focus-visible:outline-none disabled:opacity-50"
            >
              <span className="font-body text-xs sm:text-sm text-ink group-hover:text-brand transition-colors">
                &ldquo;{example}&rdquo;
              </span>
              <ArrowRight
                size={14}
                className="text-muted group-hover:text-brand transition-colors shrink-0 ml-2"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
