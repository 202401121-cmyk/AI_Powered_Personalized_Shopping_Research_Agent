import React from "react";
import Link from "next/link";
import { MessageSquare, ArrowLeft, UserCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function InterviewPage() {
  return (
    <div className="max-w-column mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-body text-muted hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Request
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="neutral" isMono className="text-[11px]">
            US-05 · SPRINT 1
          </Badge>
          <Badge variant="understood" className="text-[11px]">
            Teammate #11 Surface
          </Badge>
        </div>

        <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight">
          Adaptive Interview
        </h1>
        <p className="font-body text-ink-2 text-base mt-2">
          One question at a time in a focused chat window, adapted to earlier answers (US-05).
        </p>
      </div>

      <Card variant="surface" className="p-6 border-dashed border-2 border-line">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-control bg-brand-soft text-brand flex items-center justify-center shrink-0">
            <MessageSquare size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-lg text-ink">
                Interview Chat Window Placeholder
              </h2>
              <Badge variant="info" className="text-xs">
                Reserved for Teammate #11
              </Badge>
            </div>
            <p className="font-body text-sm text-ink-2 mt-2 leading-relaxed">
              This route and screen are reserved for <strong>Teammate #11</strong> under user story <strong>US-05</strong> (One question at a time, adapted to earlier answers).
            </p>
            <p className="font-body text-xs text-muted mt-2">
              Acceptance criteria: 1 question per turn in a chat window, quick-reply buttons and free text, sub-5-second turns, back/edit capability.
            </p>

            <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-muted">
                <UserCheck size={14} className="text-brand" aria-hidden="true" />
                <span>Foundation ready with Proof tokens, typed contracts, and session store.</span>
              </div>
              <Link href="/results" className="ml-auto">
                <Button variant="outline" size="sm">
                  View Results Screen &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
