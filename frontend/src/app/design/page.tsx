"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles, Sliders } from "lucide-react";
import { Wordmark } from "@/components/ui/wordmark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

export default function DesignPage() {
  return (
    <div className="max-w-results mx-auto px-4 sm:px-6 py-10 space-y-12">
      {/* Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-body text-muted hover:text-brand transition-colors mb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to Request
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-3xl sm:text-4xl text-ink tracking-tight">
              THEME &ldquo;PROOF&rdquo; — Design System Showroom
            </h1>
            <p className="font-body text-ink-2 text-base mt-1">
              Calm, precise research instrument. Quiet confidence, receipts for every claim. Never flashy.
            </p>
          </div>
          <Badge variant="source" isMono>
            docs/design/THEME.md
          </Badge>
        </div>
      </div>

      <Separator />

      {/* 1. Signature Details */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-2xl text-ink">
          Signature Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="surface" className="p-5 flex flex-col justify-between">
            <span className="font-body text-xs text-muted mb-3">Wordmark (Rounded Verdigris Square)</span>
            <Wordmark size="lg" />
          </Card>

          <Card variant="surface" className="p-5 flex flex-col justify-between">
            <span className="font-body text-xs text-muted mb-3">&ldquo;Understood&rdquo; Chips</span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="understood">Understood: Laptop</Badge>
              <Badge variant="understood">Coding</Badge>
            </div>
          </Card>

          <Card variant="surface" className="p-5 flex flex-col justify-between">
            <span className="font-body text-xs text-muted mb-3">Source Chips in Mono</span>
            <div className="flex flex-wrap gap-2">
              <Badge variant="source">Reddit · 12 Sep</Badge>
              <Badge variant="source">Manufacturer · 03 Oct</Badge>
            </div>
          </Card>
        </div>
      </section>

      {/* 2. Typography Scale */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-2xl text-ink">
          Typography Scale & Fonts
        </h2>
        <Card variant="surface" className="p-6 space-y-5">
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted">44px / Schibsted Grotesk 700 (tracking -0.02em)</span>
            <div className="font-display font-bold text-[44px] text-ink leading-tight tracking-display">
              Calm, Verified Research
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted">32px / Schibsted Grotesk 600 (tracking -0.02em)</span>
            <div className="font-display font-semibold text-[32px] text-ink leading-tight tracking-display">
              Receipts For Every Claim
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted">24px / Schibsted Grotesk 600</span>
            <div className="font-display font-semibold text-[24px] text-ink">
              Ranked and Sourced Product Shortlist
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted">16px / Public Sans 400 (line-height 1.6)</span>
            <div className="font-body text-base text-ink leading-relaxed max-w-2xl">
              ShopSense turns a plain-English shopping request into a ranked, explained shortlist for one person.
              It uses evidence from discussions, expert reviews, and specifications. No AI magic, no sales jargon.
            </div>
          </div>
          <Separator />
          <div className="space-y-1">
            <span className="font-mono text-xs text-muted">JetBrains Mono 400–500 (Prices & Numbers, Indian format)</span>
            <div className="font-mono text-lg text-ink font-medium">
              ₹70,000 · ₹1,50,000 · RAM &gt;= 16.0 GB · sess_8f2a910c
            </div>
          </div>
        </Card>
      </section>

      {/* 3. Evidence States */}
      <section className="space-y-4">
        <h2 className="font-display font-bold text-2xl text-ink">
          Evidence States (Tokens & Soft Fills)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-4 rounded-control bg-surface border border-line space-y-2">
            <span className="font-body text-xs text-muted block">Known (Brand)</span>
            <Badge variant="known">Verified (8.5)</Badge>
          </div>

          <div className="p-4 rounded-control bg-surface border border-line space-y-2">
            <span className="font-body text-xs text-muted block">Disputed</span>
            <Badge variant="disputed">Disputed: 8h vs 10h</Badge>
          </div>

          <div className="p-4 rounded-control bg-surface border border-line space-y-2">
            <span className="font-body text-xs text-muted block">Estimated</span>
            <Badge variant="estimated">Estimated (72% coverage)</Badge>
          </div>

          <div className="p-4 rounded-control bg-surface border border-line space-y-2">
            <span className="font-body text-xs text-muted block">Not Verified</span>
            <Badge variant="unverified">Not verified</Badge>
          </div>

          <div className="p-4 rounded-control bg-surface border border-line space-y-2">
            <span className="font-body text-xs text-muted block">Tie / Info</span>
            <Badge variant="info">Too close to call</Badge>
          </div>
        </div>
      </section>

      {/* 4. Interactive Atoms & Primitives */}
      <section className="space-y-6">
        <h2 className="font-display font-bold text-2xl text-ink">
          Design Atoms
        </h2>

        {/* Buttons */}
        <Card variant="surface" className="p-6 space-y-4">
          <h3 className="font-display font-semibold text-base text-ink">Button Variants (Radius 10)</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="brand">Brand Verdigris</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="soft">Brand Soft</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="brand" disabled>Disabled</Button>
          </div>
        </Card>

        {/* Form Inputs & Textarea */}
        <Card variant="surface" className="p-6 space-y-4">
          <h3 className="font-display font-semibold text-base text-ink">Inputs & Textarea (Radius 10, 1px Border)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-body text-xs text-muted mb-1 block">Text Input</label>
              <Input placeholder="Enter a product keyword..." />
            </div>
            <div>
              <label className="font-body text-xs text-muted mb-1 block">Monospace Number Input</label>
              <Input isMono defaultValue="70,000" />
            </div>
            <div className="sm:col-span-2">
              <label className="font-body text-xs text-muted mb-1 block">Composer Textarea</label>
              <Textarea rows={3} placeholder="Describe what you need in plain words..." />
            </div>
          </div>
        </Card>

        {/* Card Depth & Composer Shadow */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="surface" className="p-5">
            <span className="font-display font-semibold text-sm text-ink block">Surface Card</span>
            <span className="font-body text-xs text-muted mt-1 block">1px line border, radius 14.</span>
          </Card>
          <Card variant="surface-2" className="p-5">
            <span className="font-display font-semibold text-sm text-ink block">Surface-2 Card</span>
            <span className="font-body text-xs text-muted mt-1 block">F1F4F7 fill, 1px border.</span>
          </Card>
          <Card variant="composer" className="p-5">
            <span className="font-display font-semibold text-sm text-ink block">Composer Card (With Depth)</span>
            <span className="font-body text-xs text-muted mt-1 block">Shadow: 0 12px 32px -18px rgba(14,23,38,.35).</span>
          </Card>
        </div>

        {/* Progress Atom */}
        <Card variant="surface" className="p-5 space-y-3">
          <span className="font-display font-semibold text-sm text-ink block">Signature Progress Line</span>
          <Progress value={65} />
          <span className="font-mono text-xs text-muted">65% Progress (Research stage)</span>
        </Card>
      </section>
    </div>
  );
}
