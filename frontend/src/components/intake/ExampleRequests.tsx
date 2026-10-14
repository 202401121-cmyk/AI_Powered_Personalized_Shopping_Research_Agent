import React from "react";
import { Lightbulb, ArrowRight } from "lucide-react";

interface ExampleRequestsProps {
  examples: string[];
  onSelectExample: (example: string) => void;
  disabled?: boolean;
}

export function ExampleRequests({
  examples,
  onSelectExample,
  disabled = false,
}: ExampleRequestsProps) {
  return (
    <div
      role="region"
      aria-label="Example requests"
      className="mt-4 p-4 rounded-card bg-surface-2 border border-line animate-fade-rise"
    >
      <div className="flex items-center gap-2 mb-2 text-ink">
        <Lightbulb size={18} className="text-brand shrink-0" aria-hidden="true" />
        <h3 className="font-display font-semibold text-sm sm:text-base">
          Example requests
        </h3>
      </div>
      <p className="font-body text-ink-2 text-xs sm:text-sm mb-3">
        We could not determine a product category from your response. Try one of these requests to see how ShopSense works:
      </p>

      <div className="flex flex-col gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            disabled={disabled}
            onClick={() => onSelectExample(example)}
            className="group flex items-center justify-between text-left p-3 rounded-control bg-surface border border-line hover:border-brand hover:bg-brand-soft/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1 disabled:opacity-50"
          >
            <span className="font-body text-xs sm:text-sm text-ink group-hover:text-brand transition-colors line-clamp-2">
              &ldquo;{example}&rdquo;
            </span>
            <ArrowRight
              size={14}
              className="text-muted group-hover:text-brand transition-colors shrink-0 ml-2"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
