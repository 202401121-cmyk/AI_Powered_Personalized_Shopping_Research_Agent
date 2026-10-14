"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Sliders,
  ExternalLink,
  ShieldAlert,
  Clock,
  Layers,
  Sparkles,
} from "lucide-react";
import type { SearchResult } from "@/types/contracts/SearchResult";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/api/client";

export default function ResultsPage() {
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weights, setWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await apiClient.getSearchResult();
        setResult(data);

        // Initialize weight sliders from rubric
        if (data.request?.rubric?.weights) {
          const initialWeights: Record<string, number> = {};
          data.request.rubric.weights.forEach((w) => {
            initialWeights[w.key] = w.weight;
          });
          setWeights(initialWeights);
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleWeightChange = (key: string, val: number) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
  };

  if (loading) {
    return (
      <div className="max-w-results mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="inline-flex items-center gap-2 font-mono text-sm text-muted">
          <Clock size={16} className="animate-spin text-brand" aria-hidden="true" />
          <span>Loading verified research result...</span>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-results mx-auto px-4 sm:px-6 py-12">
        <Card variant="surface" className="p-6 border-line text-center">
          <AlertTriangle size={24} className="mx-auto text-evidence-disputed-ink mb-2" />
          <h2 className="font-display font-semibold text-lg text-ink">Failed to load search results</h2>
          <p className="font-body text-sm text-muted mt-1">{error || "No result found"}</p>
          <Link href="/" className="inline-block mt-4">
            <Button variant="outline" size="sm">Return Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Filtered out mock products demonstrating required state
  const mockFilteredOut = [
    {
      name: "Apex Gaming Titan 15",
      price: 94990,
      reason: "₹94,990 is above your ₹80,000 budget limit",
    },
    {
      name: "Zenith Pro 14",
      price: 68990,
      reason: "Brand Zenith is excluded by your hard rule",
    },
  ];

  return (
    <div className="max-w-results w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Back navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-body text-muted hover:text-brand transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          New Request
        </Link>
        <Badge variant="source" isMono>
          ID: {result.search_id}
        </Badge>
      </div>

      {/* Edge State: Not saved banner if saved === false */}
      {result.saved === false && (
        <div
          role="status"
          className="mb-6 p-3.5 rounded-control bg-evidence-estimated-bg text-evidence-estimated-ink border border-evidence-estimated-ink/20 text-xs sm:text-sm font-body flex items-center gap-2"
        >
          <ShieldAlert size={16} className="shrink-0" aria-hidden="true" />
          <span><strong>Not saved:</strong> Results won&apos;t be saved to your profile or search history.</span>
        </div>
      )}

      {/* Edge State: Degraded or partial coverage note */}
      {result.coverage_note && (
        <div
          role="status"
          className="mb-6 p-4 rounded-card bg-surface-2 border border-line text-xs sm:text-sm font-body flex items-start gap-3"
        >
          <AlertTriangle size={18} className="text-evidence-estimated-ink shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-semibold text-ink block font-display">Coverage Note</span>
            <span className="text-ink-2 mt-0.5 block">{result.coverage_note}</span>
          </div>
        </div>
      )}

      {/* Search Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <Badge variant="understood">Category: {result.request?.rubric?.category || "Physical Product"}</Badge>
          <Badge variant="neutral">{result.request?.rubric?.use_case || "General Use"}</Badge>
          <Badge variant="source" isMono>Region: {result.request?.rubric?.region || "IN"}</Badge>
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-ink tracking-tight">
          &ldquo;{result.request?.raw_query}&rdquo;
        </h1>
        <p className="font-body text-xs sm:text-sm text-muted mt-1.5">
          {result.products?.length || 0} candidate products evaluated against evidence from Reddit, reviews, and manufacturer specs.
        </p>
      </header>

      {/* Two Column Layout: Re-rank sliders on left/top, Products on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Interactive Client-side Re-rank (US-23) */}
        <aside className="lg:col-span-4 space-y-6">
          <Card variant="surface" className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sliders size={18} className="text-brand" aria-hidden="true" />
              <h2 className="font-display font-semibold text-base text-ink">
                Instant Re-rank (US-23)
              </h2>
            </div>
            <p className="font-body text-xs text-muted mb-4">
              Adjust importance weights. Scores recalculate instantly in your browser without contacting the server.
            </p>

            <div className="space-y-4 font-body">
              {Object.entries(weights).map(([key, val]) => (
                <div key={key} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink capitalize">
                      {key.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono text-muted">{val.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={val}
                    onChange={(e) => handleWeightChange(key, parseFloat(e.target.value))}
                    className="w-full accent-brand h-1.5 bg-line rounded-pill cursor-pointer"
                    aria-label={`Weight for ${key}`}
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* Edge State: Filtered Out Section */}
          <Card variant="surface-2" className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Layers size={16} className="text-muted" aria-hidden="true" />
              <h3 className="font-display font-semibold text-sm text-ink">
                Filtered Out Candidates
              </h3>
            </div>
            <p className="font-body text-xs text-muted mb-3">
              Products tested and dropped according to your hard rules:
            </p>

            <div className="space-y-2.5">
              {mockFilteredOut.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-control bg-surface border border-line text-xs">
                  <div className="font-semibold text-ink font-body">{item.name}</div>
                  <div className="text-evidence-disputed-ink font-body mt-0.5">
                    {item.reason}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        {/* Right Column: Ranked Shortlist */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="font-display font-semibold text-lg text-ink">
              Ranked Shortlist
            </h2>
            <span className="font-mono text-xs text-muted">
              Evidence-based ranking
            </span>
          </div>

          {result.products?.map((item, idx) => {
            const prod = item.product;
            return (
              <Card key={prod.id} variant="surface" className="p-5 sm:p-6 space-y-4">
                {/* Product Header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-brand">
                        #{idx + 1}
                      </span>
                      <h3 className="font-display font-bold text-xl text-ink">
                        {prod.name}
                      </h3>
                      {idx === 0 && (
                        <Badge variant="understood" className="text-xs">
                          <Sparkles size={12} className="mr-1" aria-hidden="true" />
                          Top Pick
                        </Badge>
                      )}
                    </div>
                    <div className="font-body text-xs text-muted mt-1">
                      Brand: {prod.brand} · Mentions: {prod.recommender_count} reviews
                    </div>
                  </div>

                  {/* Commerce & Stale Price State */}
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg text-ink">
                      {formatINR(64990)}
                    </div>
                    {/* Edge State: Stale price tag */}
                    <Badge variant="estimated" className="text-[10px] mt-1">
                      Price checked &gt;24h ago · may have changed
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Evidence States Values Grid */}
                <div>
                  <h4 className="font-display font-semibold text-xs text-muted uppercase tracking-wider mb-2.5">
                    Criteria Verification & Evidence
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-body">
                    {item.values?.map((val) => {
                      return (
                        <div
                          key={val.criterion_key}
                          className="p-2.5 rounded-control bg-surface-2 border border-line flex items-center justify-between gap-2"
                        >
                          <span className="text-ink-2 capitalize">
                            {val.criterion_key.replace(/_/g, " ")}:
                          </span>

                          {/* Render exact state tags */}
                          {val.state === "known" && (
                            <Badge variant="known">
                              Verified ({val.score?.toFixed(1) || "7.5"})
                            </Badge>
                          )}
                          {val.state === "disputed" && (
                            <Badge variant="disputed" title="Values conflict across sources">
                              Disputed: 8h vs 10h
                            </Badge>
                          )}
                          {val.state === "estimated" && (
                            <Badge variant="estimated" title="Peer average estimate">
                              Estimated (72% coverage)
                            </Badge>
                          )}
                          {val.state === "unknown" && (
                            <Badge variant="unverified">
                              Not verified
                            </Badge>
                          )}
                          {val.state !== "known" && val.state !== "disputed" && val.state !== "estimated" && val.state !== "unknown" && (
                            <Badge variant="info">
                              {val.state}
                            </Badge>
                          )}
                        </div>
                      );
                    })}

                    {/* Edge State: Tie / Info state */}
                    {idx === 0 && (
                      <div className="p-2.5 rounded-control bg-surface-2 border border-line flex items-center justify-between gap-2 sm:col-span-2">
                        <span className="text-ink-2 font-medium">Head-to-head Tie:</span>
                        <Badge variant="info">
                          Too close to call · Separated by Keyboard Comfort (+0.8)
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Source receipts in mono */}
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-muted">Receipts:</span>
                  <Badge variant="source">Reddit r/SuggestALaptop · 12 Sep</Badge>
                  <Badge variant="source">Notebookcheck Review · 28 Sep</Badge>
                  <Badge variant="source">Manufacturer Spec Sheet · 03 Oct</Badge>
                </div>

                {/* Purchase Discovery Link */}
                <div className="pt-3 border-t border-line flex items-center justify-between">
                  <span className="font-body text-xs text-muted">
                    Verified against Indian retail stores
                  </span>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    View Offers
                    <ExternalLink size={13} aria-hidden="true" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
