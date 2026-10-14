"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/request/AppHeader";
import { ExampleChips } from "@/components/request/ExampleChips";
import { ExampleRequestList } from "@/components/request/ExampleRequestList";
import { FollowUpCard } from "@/components/request/FollowUpCard";
import { HowItWorks } from "@/components/request/HowItWorks";
import { InlineError } from "@/components/request/InlineError";
import { RequestComposer } from "@/components/request/RequestComposer";
import { StateSwitcher } from "@/components/request/StateSwitcher";
import { UnderstoodPanel } from "@/components/request/UnderstoodPanel";
import {
  EXAMPLE_REQUESTS,
  INTAKE_ERROR_MESSAGE,
  processIntakeRequest,
  type IntakeResult,
} from "@/lib/mock-intake";
import {
  MAX_REQUEST_CHARS,
  MOM_SAMPLE,
  OVER_LIMIT_SAMPLE,
  PRODUCT_TYPE_INTENT,
  SUBMIT_DELAY_MS,
  TYPING_SAMPLE,
  UNCLEAR_INTENT,
  UNDERSTOOD_LAPTOP_INTENT,
  WATCH_INTENT,
  WATCH_SAMPLE,
  type ScreenLetter,
} from "@/lib/request-states";
import { useSession } from "@/lib/session/SessionContext";
import type { Intent } from "@/types/contracts/Intent";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function inferScreenLetter({
  query,
  loading,
  error,
  result,
  budgetOpen,
  isOverLimit,
}: {
  query: string;
  loading: boolean;
  error: string | null;
  result: IntakeResult | null;
  budgetOpen: boolean;
  isOverLimit: boolean;
}): ScreenLetter {
  if (error) {
    return "I";
  }
  if (isOverLimit) {
    return "J";
  }
  if (budgetOpen && result?.intent.category) {
    return "H";
  }
  if (loading) {
    return "C";
  }
  if (result?.intent.show_example_requests) {
    return "F";
  }
  if (result?.intent.clarification_options.includes("Wristwatch")) {
    return "E";
  }
  if (result?.intent.needs_clarification) {
    return "D";
  }
  if (result?.intent.category) {
    return "G";
  }
  if (query.trim()) {
    return "B";
  }
  return "A";
}

export function RequestScreen() {
  const { sessionId } = useSession();
  const requestId = useRef(0);
  const [isDark, setIsDark] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [unclearTurnCount, setUnclearTurnCount] = useState(0);
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [forceError, setForceError] = useState(false);

  const isOverLimit = query.length > MAX_REQUEST_CHARS;
  const currentLetter = inferScreenLetter({
    query,
    loading,
    error,
    result,
    budgetOpen,
    isOverLimit,
  });

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      setIsDark(true);
    }
  };

  const clearOutcome = () => {
    setResult(null);
    setError(null);
    setUnclearTurnCount(0);
    setBudgetOpen(false);
    setForceError(false);
    setLoading(false);
  };

  const handleReset = () => {
    requestId.current += 1;
    setQuery("");
    clearOutcome();
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (loading || result || error || budgetOpen) {
      requestId.current += 1;
      clearOutcome();
    }
  };

  const runIntake = useCallback(
    async (options?: { selected?: string; nextQuery?: string; forceError?: boolean }) => {
      const raw = options?.nextQuery ?? query;
      if (raw.length > MAX_REQUEST_CHARS) {
        return;
      }

      const current = requestId.current + 1;
      requestId.current = current;
      setLoading(true);
      setError(null);
      setBudgetOpen(false);

      try {
        await delay(SUBMIT_DELAY_MS);
        if (current !== requestId.current) {
          return;
        }
        const intakeRes = await processIntakeRequest({
          rawQuery: raw,
          sessionId,
          selectedCategoryOption: options?.selected,
          unclearTurnCount,
          forceError: options?.forceError ?? forceError,
        });
        if (current !== requestId.current) {
          return;
        }
        setResult(intakeRes);
        setUnclearTurnCount(intakeRes.turnCount);
        setForceError(false);
      } catch {
        if (current !== requestId.current) {
          return;
        }
        setResult(null);
        setError(INTAKE_ERROR_MESSAGE);
      } finally {
        if (current === requestId.current) {
          setLoading(false);
        }
      }
    },
    [forceError, query, sessionId, unclearTurnCount],
  );

  const applyDemoState = (letter: ScreenLetter) => {
    requestId.current += 1;
    setForceError(false);
    setBudgetOpen(false);
    setError(null);
    setResult(null);
    setLoading(false);
    setUnclearTurnCount(0);

    const snapshot = (intent: Intent, raw: string, turns: number): void => {
      setQuery(raw);
      setResult({
        intent,
        sessionId,
        turnCount: turns,
        isReadyForResearch: Boolean(intent.category),
      });
    };

    switch (letter) {
      case "A":
        setQuery("");
        break;
      case "B":
        setQuery(TYPING_SAMPLE);
        break;
      case "C":
        setQuery(TYPING_SAMPLE);
        setLoading(true);
        break;
      case "D":
        snapshot(PRODUCT_TYPE_INTENT, MOM_SAMPLE, 1);
        setUnclearTurnCount(1);
        break;
      case "E":
        snapshot(WATCH_INTENT, WATCH_SAMPLE, 1);
        setUnclearTurnCount(1);
        break;
      case "F":
        snapshot(UNCLEAR_INTENT, MOM_SAMPLE, 2);
        setUnclearTurnCount(2);
        break;
      case "G":
        snapshot(UNDERSTOOD_LAPTOP_INTENT, TYPING_SAMPLE, 0);
        break;
      case "H":
        snapshot(UNDERSTOOD_LAPTOP_INTENT, TYPING_SAMPLE, 0);
        setBudgetOpen(true);
        break;
      case "I":
        setQuery(TYPING_SAMPLE);
        setError(INTAKE_ERROR_MESSAGE);
        setForceError(true);
        break;
      case "J":
        setQuery(OVER_LIMIT_SAMPLE);
        break;
      default:
        break;
    }
  };

  const handleBudgetChange = (amount: number | null) => {
    setResult((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        intent: {
          ...current.intent,
          budget:
            amount == null
              ? null
              : { min: null, max: { amount, currency: "INR" } },
        },
      };
    });
  };

  const showFollowUp =
    Boolean(result?.intent.needs_clarification) &&
    !result?.intent.show_example_requests &&
    Boolean(result?.intent.clarification_question) &&
    (result?.intent.clarification_options.length ?? 0) > 0;

  const understoodVisible = Boolean(result && result.intent.category);
  const examples = useMemo(() => EXAMPLE_REQUESTS, []);

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col transition-colors">
      <AppHeader
        sessionId={sessionId}
        isDark={isDark}
        onToggleDark={toggleDarkMode}
        isSubmitting={loading}
      />

      <main className="flex-1 max-w-column w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <section className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight">
            Research your next purchase
          </h1>
          <p className="font-body text-ink-2 text-base sm:text-lg mt-2 max-w-xl">
            Tell us what you need in plain words. ShopSense checks the product type before any
            research starts.
          </p>
        </section>

        <RequestComposer
          query={query}
          onQueryChange={handleQueryChange}
          onSubmit={() => {
            void runIntake();
          }}
          onReset={handleReset}
          loading={loading}
          isOverLimit={isOverLimit}
        />

        <ExampleChips
          onSelectExample={(example) => {
            setQuery(example);
            requestId.current += 1;
            clearOutcome();
          }}
          disabled={loading}
        />

        {error ? (
          <InlineError
            message={error}
            disabled={loading}
            onRetry={() => {
              setForceError(false);
              void runIntake({ forceError: false });
            }}
          />
        ) : null}

        {showFollowUp && result?.intent.clarification_question ? (
          <FollowUpCard
            question={result.intent.clarification_question}
            options={result.intent.clarification_options}
            disabled={loading}
            onSelectOption={(option) => {
              void runIntake({ selected: option });
            }}
          />
        ) : null}

        {result?.intent.show_example_requests ? (
          <ExampleRequestList
            examples={examples}
            disabled={loading}
            onSelectExample={(example) => {
              setQuery(example);
              requestId.current += 1;
              clearOutcome();
            }}
          />
        ) : null}

        {understoodVisible && result ? (
          <UnderstoodPanel
            intent={result.intent}
            sessionId={sessionId}
            isReadyForResearch={result.isReadyForResearch}
            budgetPopoverOpen={budgetOpen}
            onBudgetPopoverChange={setBudgetOpen}
            onBudgetChange={handleBudgetChange}
            onReset={handleReset}
          />
        ) : null}

        <HowItWorks />
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted font-body">
        <div className="max-w-column mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>ShopSense Group 13 · IT314 · Strict contracts, verified claims</span>
          <div className="flex gap-3">
            <Link href="/results" className="hover:text-brand transition-colors">
              Results Spec
            </Link>
            <Link href="/design" className="hover:text-brand transition-colors">
              Theme Showroom
            </Link>
          </div>
        </div>
      </footer>

      <StateSwitcher current={currentLetter} onSelect={applyDemoState} />
    </div>
  );
}
