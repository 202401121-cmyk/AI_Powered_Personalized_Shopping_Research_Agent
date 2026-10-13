import React, { useState, useEffect, useRef } from "react";
import { ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClarificationPrompt } from "@/components/intake/ClarificationPrompt";
import { ExampleRequests } from "@/components/intake/ExampleRequests";
import { IntentSummary } from "@/components/intake/IntentSummary";
import { getOrCreateSessionId } from "@/lib/session";
import {
  processIntakeRequest,
  EXAMPLE_REQUESTS,
  type IntakeResult,
} from "@/lib/mock-intake";

const MAX_CHARACTERS = 1000;

export function RequestBox() {
  const [query, setQuery] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [unclearTurnCount, setUnclearTurnCount] = useState(0);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const charCount = query.length;
  const isOverLimit = charCount > MAX_CHARACTERS;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || isOverLimit) return;

    setLoading(true);
    try {
      const intakeRes = await processIntakeRequest({
        rawQuery: query,
        sessionId,
        unclearTurnCount,
      });

      setResult(intakeRes);
      setUnclearTurnCount(intakeRes.turnCount);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategoryOption = async (option: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const intakeRes = await processIntakeRequest({
        rawQuery: query,
        sessionId,
        selectedCategoryOption: option,
        unclearTurnCount,
      });

      setResult(intakeRes);
      setUnclearTurnCount(intakeRes.turnCount);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExample = (exampleText: string) => {
    setQuery(exampleText);
    setResult(null);
    setUnclearTurnCount(0);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleReset = () => {
    setQuery("");
    setResult(null);
    setUnclearTurnCount(0);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full">
      <Card variant="composer" className="p-4 sm:p-6 transition-all">
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
              rows={3}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={MAX_CHARACTERS}
              placeholder="e.g. laptop for coding under 70k, or pram for a newborn suitable for city pavements"
              disabled={loading}
              className="text-sm sm:text-base pr-3 pb-8"
              aria-describedby="char-counter"
            />

            <div
              id="char-counter"
              className="absolute bottom-2.5 right-3 font-mono text-[11px] text-muted select-none pointer-events-none"
              aria-live="polite"
            >
              <span className={charCount > 950 ? "text-evidence-disputed-ink font-semibold" : ""}>
                {charCount.toLocaleString("en-IN")}
              </span>
              <span> / {MAX_CHARACTERS.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-2">
            <div className="text-xs text-muted font-body">
              <span>Press </span>
              <kbd className="px-1.5 py-0.5 rounded border border-line bg-surface-2 font-mono text-[11px] text-ink-2">
                Ctrl + Enter
              </kbd>
              <span> to search</span>
            </div>

            <div className="flex items-center gap-2">
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={loading}
                  aria-label="Clear request"
                >
                  <RotateCcw size={14} className="mr-1" aria-hidden="true" />
                  Clear
                </Button>
              )}

              <Button
                type="submit"
                variant="brand"
                size="md"
                disabled={loading || isOverLimit}
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

        {/* Follow-up clarification prompt */}
        {result?.intent?.needs_clarification &&
          !result.intent.show_example_requests &&
          result.intent.clarification_question &&
          result.intent.clarification_options && (
            <ClarificationPrompt
              question={result.intent.clarification_question}
              options={result.intent.clarification_options}
              onSelectOption={handleSelectCategoryOption}
              disabled={loading}
            />
          )}

        {/* Fallback example requests when unclear twice */}
        {result?.intent?.show_example_requests && (
          <ExampleRequests
            examples={EXAMPLE_REQUESTS}
            onSelectExample={handleSelectExample}
            disabled={loading}
          />
        )}
      </Card>

      {/* Validated intent result summary */}
      {result && result.intent.category && (
        <IntentSummary
          intent={result.intent}
          sessionId={sessionId}
          isReadyForResearch={result.isReadyForResearch}
          onReset={handleReset}
        />
      )}
    </div>
  );
}
