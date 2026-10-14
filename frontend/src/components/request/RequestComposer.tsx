"use client";

import React, { useRef } from "react";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MAX_REQUEST_CHARS } from "@/lib/request-states";

interface RequestComposerProps {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onReset: () => void;
  loading: boolean;
  isOverLimit: boolean;
}

export function RequestComposer({
  query,
  onQueryChange,
  onSubmit,
  onReset,
  loading,
  isOverLimit,
}: RequestComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const charCount = query.length;
  const nearLimit = charCount > 950;

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault();
    if (loading || isOverLimit) {
      return;
    }
    onSubmit();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card variant="composer" className="p-4 sm:p-6">
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="shopping-request-input" className="block mb-2">
          <span className="font-display font-semibold text-base sm:text-lg text-ink">
            What are you shopping for?
          </span>
          <span className="block font-body text-xs sm:text-sm text-muted mt-0.5">
            Describe what you need in plain words. Include budget, usage, or must-haves.
          </span>
        </label>

        <div className="relative mt-2">
          <Textarea
            id="shopping-request-input"
            ref={textareaRef}
            rows={4}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. laptop for coding under 70k, or pram for a newborn suitable for city pavements"
            disabled={loading}
            className="text-sm sm:text-base pr-3 pb-8 min-h-[120px]"
            aria-describedby="char-counter over-limit-hint"
            aria-invalid={isOverLimit}
          />

          <div
            id="char-counter"
            className="absolute bottom-2.5 right-3 font-mono text-[11px] select-none pointer-events-none"
            aria-live="polite"
          >
            <span
              className={
                isOverLimit || nearLimit
                  ? "text-evidence-disputed-ink font-semibold"
                  : "text-muted"
              }
            >
              {charCount.toLocaleString("en-IN")}
            </span>
            <span className="text-muted"> / {MAX_REQUEST_CHARS.toLocaleString("en-IN")}</span>
          </div>
        </div>

        {isOverLimit && (
          <p
            id="over-limit-hint"
            className="mt-2 font-body text-xs text-evidence-disputed-ink"
            role="status"
          >
            Shorten this to 1,000 characters or fewer before searching.
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-2">
          <p className="text-xs text-muted font-body">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface-2 font-mono text-[11px] text-ink-2">
              Ctrl + Enter
            </kbd>{" "}
            to search
          </p>

          <div className="flex items-center gap-2">
            {query ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onReset();
                  textareaRef.current?.focus();
                }}
                disabled={loading}
                aria-label="Clear request"
              >
                <RotateCcw size={14} className="mr-1" aria-hidden="true" />
                Clear
              </Button>
            ) : null}

            <Button
              type="submit"
              variant="brand"
              size="md"
              disabled={loading || isOverLimit}
              aria-disabled={loading || isOverLimit}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" aria-hidden="true" />
                  Checking
                </>
              ) : (
                <>
                  Search
                  <ArrowRight size={16} className="ml-2" aria-hidden="true" />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
