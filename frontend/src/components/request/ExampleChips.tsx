"use client";

import React from "react";
import { Sparkles } from "lucide-react";

export interface ExampleChipItem {
  id: string;
  label: string;
  query: string;
}

export const DEFAULT_EXAMPLE_CHIPS: ExampleChipItem[] = [
  {
    id: "laptop",
    label: "Gaming laptop under 80k",
    query: "gaming laptop under 80k, at least 16 GB RAM, not too heavy",
  },
  {
    id: "pram",
    label: "Pram for a newborn",
    query: "lightweight pram for a newborn suitable for city pavements",
  },
  {
    id: "headphones",
    label: "Headphones under 15k",
    query: "wireless noise cancelling headphones for daily office commute under 15k",
  },
];

interface ExampleChipsProps {
  onSelectExample: (query: string) => void;
  disabled?: boolean;
}

export function ExampleChips({
  onSelectExample,
  disabled = false,
}: ExampleChipsProps) {
  return (
    <div className="mt-3" role="region" aria-label="Example shopping requests">
      <div className="flex items-center gap-1.5 text-xs text-muted font-body mb-2">
        <Sparkles size={13} className="text-brand shrink-0" aria-hidden="true" />
        <span>Try an example request:</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {DEFAULT_EXAMPLE_CHIPS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelectExample(chip.query)}
            className="px-3 py-1.5 rounded-pill bg-surface border border-line hover:border-brand hover:text-brand text-xs font-body text-ink-2 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:opacity-50 disabled:pointer-events-none"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}
