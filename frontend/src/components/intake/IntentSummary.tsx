import React from "react";
import { CheckCircle2, Lock, Tag, Sparkles } from "lucide-react";
import type { Intent } from "@/types/contracts/Intent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface IntentSummaryProps {
  intent: Intent;
  sessionId: string;
  isReadyForResearch: boolean;
  onReset: () => void;
}

export function IntentSummary({
  intent,
  sessionId,
  isReadyForResearch,
  onReset,
}: IntentSummaryProps) {
  // Format currency Indian style: Intl "en-IN": ₹70,000
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      role="region"
      aria-label="Understood request summary"
      className="mt-5 p-5 rounded-card bg-surface border border-line animate-fade-rise"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3 mb-4">
        <div className="flex items-center gap-2">
          {isReadyForResearch ? (
            <CheckCircle2 size={18} className="text-brand shrink-0" aria-hidden="true" />
          ) : (
            <Lock size={18} className="text-muted shrink-0" aria-hidden="true" />
          )}
          <h3 className="font-display font-semibold text-ink text-base">
            {isReadyForResearch ? "Category Identified" : "Awaiting Category"}
          </h3>
        </div>

        <Badge variant="neutral" isMono className="text-[11px]">
          {sessionId}
        </Badge>
      </div>

      <div className="space-y-3 font-body text-sm">
        {/* Category state */}
        <div className="flex items-baseline gap-2">
          <span className="text-muted text-xs uppercase tracking-wider font-medium w-24 shrink-0">
            Category
          </span>
          {intent.category_label ? (
            <Badge variant="understood">
              Understood: {intent.category_label}
            </Badge>
          ) : (
            <Badge variant="unverified">
              Not verified
            </Badge>
          )}
        </div>

        {/* Use case */}
        {intent.use_case && (
          <div className="flex items-baseline gap-2">
            <span className="text-muted text-xs uppercase tracking-wider font-medium w-24 shrink-0">
              Use Case
            </span>
            <Badge variant="neutral">
              {intent.use_case}
            </Badge>
          </div>
        )}

        {/* Budget */}
        {intent.budget?.max?.amount && (
          <div className="flex items-baseline gap-2">
            <span className="text-muted text-xs uppercase tracking-wider font-medium w-24 shrink-0">
              Budget
            </span>
            <span className="font-mono text-sm text-ink font-medium">
              Up to {formatINR(intent.budget.max.amount)}
            </span>
          </div>
        )}

        {/* Hard rules */}
        {intent.hard_rules && intent.hard_rules.length > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="text-muted text-xs uppercase tracking-wider font-medium w-24 shrink-0">
              Rules
            </span>
            <div className="flex flex-wrap gap-1.5">
              {intent.hard_rules.map((rule, idx) => (
                <Badge key={idx} variant="info" className="text-xs">
                  {rule.source_text || `${rule.attribute} ${rule.operator} ${rule.value}`}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Exclusions */}
        {intent.exclusions && intent.exclusions.length > 0 && (
          <div className="flex items-baseline gap-2">
            <span className="text-muted text-xs uppercase tracking-wider font-medium w-24 shrink-0">
              Exclusions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {intent.exclusions.map((ex, idx) => (
                <Badge key={idx} variant="disputed" className="text-xs">
                  No {ex.value}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Readiness & Action */}
      <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-xs text-muted">
          {isReadyForResearch
            ? "Category is known. Ready to build criteria and research."
            : "Research never starts until the product category is known (US-01)."}
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
          >
            New Request
          </Button>

          <Button
            type="button"
            variant="brand"
            size="sm"
            disabled={!isReadyForResearch}
            title={!isReadyForResearch ? "Category must be known before research starts" : undefined}
            onClick={() => {
              alert("Category confirmed: " + intent.category_label + ". Research pipeline unlocked (US-01 criteria met).");
            }}
          >
            <Sparkles size={14} className="mr-1.5" aria-hidden="true" />
            Start Research
          </Button>
        </div>
      </div>
    </div>
  );
}
