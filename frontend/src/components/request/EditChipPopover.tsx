"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseBudgetInr } from "@/lib/budget";

interface EditChipPopoverProps {
  open: boolean;
  title: string;
  description: string;
  initialValue: string;
  onClose: () => void;
  onApply: (amount: number | null) => void;
}

export function EditChipPopover({
  open,
  title,
  description,
  initialValue,
  onClose,
  onApply,
}: EditChipPopoverProps) {
  const headingId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError(null);
      const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open, initialValue]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleApply = (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = parseBudgetInr(value);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    onApply(parsed.amount);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      className="absolute left-0 top-full z-20 mt-2 w-[min(100vw-2rem,18rem)] rounded-card border border-line bg-surface p-4 shadow-popover"
    >
      <h4 id={headingId} className="font-display font-semibold text-sm text-ink">
        {title}
      </h4>
      <p className="font-body text-xs text-muted mt-1">{description}</p>

      <form onSubmit={handleApply} className="mt-3 space-y-3">
        <Input
          ref={inputRef}
          isMono
          inputMode="decimal"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "budget-edit-error" : undefined}
          placeholder="80000, 80k, or 1.5 lakh"
        />
        {error ? (
          <p id="budget-edit-error" role="alert" className="font-body text-xs text-evidence-disputed-ink">
            {error}
          </p>
        ) : (
          <p className="font-body text-xs text-muted">Leave blank to remove the budget.</p>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="brand" size="sm">
            Apply
          </Button>
        </div>
      </form>
    </div>
  );
}
