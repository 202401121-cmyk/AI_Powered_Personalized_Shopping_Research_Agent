"use client";

import React, { useState } from "react";
import { CheckCircle2, Pencil } from "lucide-react";
import type { Intent } from "@/types/contracts/Intent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditChipPopover } from "@/components/request/EditChipPopover";
import { formatInr } from "@/lib/budget";

interface UnderstoodPanelProps {
  intent: Intent;
  sessionId: string;
  isReadyForResearch: boolean;
  budgetPopoverOpen?: boolean;
  onBudgetPopoverChange?: (open: boolean) => void;
  onBudgetChange: (amount: number | null) => void;
  onReset: () => void;
}

export function UnderstoodPanel({
  intent,
  sessionId,
  isReadyForResearch,
  budgetPopoverOpen,
  onBudgetPopoverChange,
  onBudgetChange,
  onReset,
}: UnderstoodPanelProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [researchNote, setResearchNote] = useState("");
  const popoverOpen = budgetPopoverOpen ?? internalOpen;

  const setOpen = (open: boolean) => {
    setInternalOpen(open);
    onBudgetPopoverChange?.(open);
  };

  const budgetAmount = intent.budget?.max?.amount ?? null;
  const budgetLabel = budgetAmount != null ? `Up to ${formatInr(budgetAmount)}` : "No budget set";

  const chips: { key: string; label: string; value: string }[] = [];
  if (intent.category_label) {
    chips.push({ key: "category", label: "Category", value: intent.category_label });
  }
  if (intent.use_case) {
    chips.push({ key: "use", label: "Use", value: intent.use_case });
  }
  chips.push({ key: "budget", label: "Budget", value: budgetLabel });
  intent.hard_rules.forEach((rule, index) => {
    chips.push({
      key: `rule-${index}`,
      label: "Must have",
      value: rule.source_text || `${rule.attribute} ${rule.operator} ${String(rule.value)}`,
    });
  });
  intent.exclusions.forEach((exclusion, index) => {
    chips.push({ key: `ex-${index}`, label: "Avoid", value: exclusion.value });
  });

  return (
    <div
      role="region"
      aria-label="Understood request summary"
      aria-live="polite"
      className="mt-5 p-4 sm:p-5 rounded-card bg-surface border border-line animate-fade-rise"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3 mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-brand shrink-0" aria-hidden="true" />
          <h3 className="font-display font-semibold text-ink text-base">
            {isReadyForResearch ? "Understood" : "Awaiting category"}
          </h3>
        </div>
        <Badge variant="source" isMono className="text-[11px]">
          {sessionId}
        </Badge>
      </div>

      <ul className="flex flex-wrap gap-2">
        {chips.map((chip, index) => {
          const isBudget = chip.key === "budget";
          return (
            <li
              key={chip.key}
              className="relative animate-fade-rise"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              {isBudget ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-pill bg-brand-soft text-brand border border-brand/20 px-2.5 py-1 text-xs font-medium hover:bg-brand hover:text-brand-on-brand transition-colors"
                  aria-haspopup="dialog"
                  aria-expanded={popoverOpen}
                  onClick={() => setOpen(!popoverOpen)}
                >
                  <span className="text-[10px] uppercase tracking-wide opacity-80">{chip.label}</span>
                  <span className="font-mono">{chip.value}</span>
                  <Pencil size={12} strokeWidth={1.75} aria-hidden="true" />
                  <span className="sr-only">Edit budget</span>
                </button>
              ) : (
                <Badge variant="understood">
                  <span className="text-[10px] uppercase tracking-wide opacity-80">{chip.label}</span>
                  {chip.value}
                </Badge>
              )}

              {isBudget ? (
                <EditChipPopover
                  open={popoverOpen}
                  title="Edit budget"
                  description="Use rupees, k, or lakh. ShopSense will not assume a budget if you leave this blank."
                  initialValue={budgetAmount != null ? String(budgetAmount) : ""}
                  onClose={() => setOpen(false)}
                  onApply={(amount) => {
                    onBudgetChange(amount);
                    setOpen(false);
                  }}
                />
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-xs text-muted">
          {isReadyForResearch
            ? "Category is known. Research would start next. It is not started on this screen."
            : "Research never starts until the product category is known."}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            New request
          </Button>
          <Button
            type="button"
            variant="brand"
            size="sm"
            disabled={!isReadyForResearch}
            onClick={() =>
              setResearchNote("Category is known. Research is not started on this screen.")
            }
          >
            Start research
          </Button>
        </div>
      </div>
      {researchNote ? (
        <p className="mt-2 font-body text-xs text-brand" role="status">
          {researchNote}
        </p>
      ) : null}
    </div>
  );
}
