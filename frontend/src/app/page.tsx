"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/ui/wordmark";
import { Badge } from "@/components/ui/badge";
import { RequestBox } from "@/components/intake/RequestBox";
import { useSession } from "@/lib/session/SessionContext";
import { Moon, Sun, ShieldCheck } from "lucide-react";

export default function Home() {
  const { sessionId } = useSession();
  const [isDark, setIsDark] = useState(false);

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

  return (
    <div className="min-h-screen bg-canvas text-ink flex flex-col transition-colors">
      {/* Signature thin brand progress line at top */}
      <div
        className="h-1 bg-brand w-full select-none"
        role="presentation"
        aria-hidden="true"
      />

      {/* Main navigation header */}
      <header className="border-b border-line bg-surface/80 backdrop-none">
        <div className="max-w-column mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded">
            <Wordmark size="md" />
          </Link>

          {/* Nav links across foundation pages */}
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

          <div className="flex items-center gap-2 sm:gap-3">
            <Badge variant="source" className="hidden sm:inline-flex" title="Active session ID">
              {sessionId || "sess_init"}
            </Badge>

            <button
              type="button"
              onClick={toggleDarkMode}
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

      {/* Main Content: Focused 720px column */}
      <main className="flex-1 max-w-column w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Ownership banner per instructions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 p-3 rounded-card bg-surface-2 border border-line text-xs font-body text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-brand shrink-0" aria-hidden="true" />
            <span>
              <strong>US-01 Foundation:</strong> Open plain-text intake with strict category verification.
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="understood" className="text-[10px]">
              Teammate #9 Surface
            </Badge>
            <Badge variant="source" isMono className="text-[10px]">
              SPRINT 1
            </Badge>
          </div>
        </div>

        {/* Hero title */}
        <section className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight">
            Research your next purchase
          </h1>
          <p className="font-body text-ink-2 text-base sm:text-lg mt-2 max-w-xl">
            A calm, precise research instrument. Tell us what you need in plain words, and we&apos;ll establish what matters before researching.
          </p>
        </section>

        {/* US-01 Request Composer & Teammate #9 Surface */}
        <RequestBox />
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-6 text-center text-xs text-muted font-body">
        <div className="max-w-column mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>ShopSense Group 13 · IT314 · Strict contracts, verified claims</span>
          <div className="flex gap-3">
            <Link href="/results" className="hover:text-brand transition-colors">Results Spec</Link>
            <Link href="/design" className="hover:text-brand transition-colors">Theme Showroom</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
