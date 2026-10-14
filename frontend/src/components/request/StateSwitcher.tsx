"use client";

import React, { useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { SCREEN_STATES, type ScreenLetter } from "@/lib/request-states";
import { cn } from "@/lib/utils";

interface StateSwitcherProps {
  current: ScreenLetter;
  onSelect: (state: ScreenLetter) => void;
}

export function StateSwitcher({ current, onSelect }: StateSwitcherProps) {
  const [open, setOpen] = useState(false);
  const currentMeta = SCREEN_STATES.find((state) => state.id === current);

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[min(calc(100vw-2rem),16.5rem)]">
      <div className="rounded-card border border-line bg-surface shadow-popover">
        <button
          type="button"
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
          aria-expanded={open}
          aria-controls="state-switcher-panel"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="inline-flex items-center gap-2 font-body text-xs text-ink">
            <Layers size={16} className="text-brand" aria-hidden="true" />
            <span>
              State {current}
              <span className="text-muted"> · {currentMeta?.label}</span>
            </span>
          </span>
          <ChevronDown
            size={16}
            className={cn("text-muted transition-transform", open && "rotate-180")}
            aria-hidden="true"
          />
        </button>

        {open ? (
          <div id="state-switcher-panel" className="border-t border-line p-2">
            <p className="px-1 pb-2 font-body text-[11px] text-muted">
              Demo switcher. Jump to any request-screen state.
            </p>
            <ol className="grid grid-cols-1 gap-1">
              {SCREEN_STATES.map((state) => (
                <li key={state.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(state.id)}
                    aria-current={current === state.id ? "true" : undefined}
                    aria-label={`Show state ${state.id}: ${state.label}`}
                    className={cn(
                      "w-full text-left px-2 py-1.5 rounded-control font-body text-xs transition-colors",
                      current === state.id
                        ? "bg-brand-soft text-brand font-semibold"
                        : "text-ink-2 hover:bg-surface-2",
                    )}
                  >
                    <span className="font-mono mr-2">{state.id}</span>
                    {state.label}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </div>
  );
}
