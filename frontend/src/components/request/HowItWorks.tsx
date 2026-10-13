import React from "react";
import { MessageSquare, CheckCircle, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

export function HowItWorks() {
  const steps = [
    {
      step: "1",
      icon: MessageSquare,
      title: "Describe what you need",
      description: "Use your own words. Mention your budget, intended use, or specific brands to avoid.",
    },
    {
      step: "2",
      icon: CheckCircle,
      title: "Confirm what matters",
      description: "ShopSense checks the product category and rules first. Research never starts until the category is clear.",
    },
    {
      step: "3",
      icon: FileText,
      title: "Receive verified receipts",
      description: "Get a ranked shortlist backed by claims from discussions, expert reviews, and manufacturer specs.",
    },
  ];

  return (
    <section className="mt-10" aria-labelledby="how-it-works-heading">
      <h2
        id="how-it-works-heading"
        className="font-display font-semibold text-lg text-ink mb-4 tracking-tight"
      >
        How ShopSense works
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {steps.map((item) => {
          const IconComponent = item.icon;
          return (
            <Card
              key={item.step}
              variant="surface-2"
              className="p-4 sm:p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-control bg-brand-soft text-brand flex items-center justify-center font-mono text-xs font-bold">
                    {item.step}
                  </div>
                  <IconComponent size={16} className="text-muted" aria-hidden="true" />
                </div>
                <h3 className="font-display font-semibold text-sm text-ink">
                  {item.title}
                </h3>
                <p className="font-body text-xs text-muted mt-1.5 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
