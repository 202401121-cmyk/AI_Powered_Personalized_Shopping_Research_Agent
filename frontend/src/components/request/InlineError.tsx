"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InlineErrorProps {
  message: string;
  onRetry: () => void;
  disabled?: boolean;
}

export function InlineError({ message, onRetry, disabled = false }: InlineErrorProps) {
  return (
    <div
      role="alert"
      className="mt-4 p-4 sm:p-5 rounded-card border border-evidence-disputed-ink/20 bg-evidence-disputed-bg animate-fade-rise"
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle
          size={18}
          className="text-evidence-disputed-ink shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className="font-display font-semibold text-sm text-evidence-disputed-ink">
            Could not check this request
          </h3>
          <p className="font-body text-sm text-evidence-disputed-ink mt-0.5">{message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 bg-surface"
            onClick={onRetry}
            disabled={disabled}
          >
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
