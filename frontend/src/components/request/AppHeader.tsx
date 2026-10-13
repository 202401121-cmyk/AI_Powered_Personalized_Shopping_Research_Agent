"use client";

import React from "react";
import Link from "next/link";
import { Moon, Sun } from "lucide-react";
import { Wordmark } from "./Wordmark";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AppHeaderProps {
  sessionId: string;
  isDark: boolean;
  onToggleDark: () => void;
  isSubmitting?: boolean;
}

export function AppHeader({
  sessionId,
  isDark,
  onToggleDark,
  isSubmitting = false,
}: AppHeaderProps) {
  return (
    <>
      {/* Signature thin brand progress line at top during work */}
      <div className="w-full h-1 select-none" role="presentation" aria-hidden="true">
        {isSubmitting ? (
          <Progress isIndeterminate className="h-1" />
        ) : (
          <div className="h-1 bg-brand w-full" />
        )}
      </div>

      <header className="border-b border-line bg-surface/90 backdrop-none transition-colors">
        <div className="max-w-column mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-control"
            aria-label="ShopSense Home"
          >
            <Wordmark size="md" />
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2 text-xs font-body" aria-label="Main Navigation">
            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-control font-semibold text-brand bg-brand-soft"
              aria-current="page"
            >
              Request
            </Link>
            <Link
              href="/results"
              className="px-2.5 py-1.5 rounded-control text-ink-2 hover:bg-surface-2 transition-colors"
            >
              Results
            </Link>
            <Link
              href="/interview"
              className="px-2.5 py-1.5 rounded-control text-ink-2 hover:bg-surface-2 transition-colors hidden sm:inline-flex"
            >
              Interview
            </Link>
            <Link
              href="/design"
              className="px-2.5 py-1.5 rounded-control text-ink-2 hover:bg-surface-2 transition-colors"
            >
              Theme
            </Link>
          </nav>

          {/* Session Chip & Theme Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Badge
              variant="source"
              isMono
              className="hidden sm:inline-flex text-[11px]"
              title="Current Session ID"
              aria-label={`Session ID: ${sessionId}`}
            >
              {sessionId || "sess_init"}
            </Badge>

            <button
              type="button"
              onClick={onToggleDark}
              className="w-9 h-9 rounded-control border border-line bg-surface flex items-center justify-center text-ink-2 hover:bg-surface-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDark ? (
                <Sun size={16} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Moon size={16} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
