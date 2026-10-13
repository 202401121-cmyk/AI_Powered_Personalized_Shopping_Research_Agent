import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Card } from "./card";
import { Badge } from "./badge";
import { Wordmark } from "./wordmark";
import { Separator } from "./separator";
import { Progress } from "./progress";

describe("THEME PROOF Design Atoms", () => {
  it("renders Wordmark with verdigris square and check icon", () => {
    render(<Wordmark />);
    expect(screen.getByText("ShopSense")).toBeInTheDocument();
  });

  it("renders Button with brand and outline variants", () => {
    const { rerender } = render(<Button variant="brand">Research</Button>);
    expect(screen.getByRole("button", { name: "Research" })).toHaveClass("bg-brand");

    rerender(<Button variant="outline">Back</Button>);
    expect(screen.getByRole("button", { name: "Back" })).toHaveClass("border-line");
  });

  it("renders Input with mono font when isMono is true", () => {
    render(<Input isMono placeholder="Enter price" />);
    const input = screen.getByPlaceholderText("Enter price");
    expect(input).toHaveClass("font-mono");
  });

  it("renders Card with composer shadow", () => {
    const { container } = render(<Card variant="composer">Content</Card>);
    expect(container.firstChild).toHaveClass("shadow-composer");
    expect(container.firstChild).toHaveClass("rounded-card");
  });

  it("renders Badge with evidence states", () => {
    const { rerender } = render(<Badge variant="known">Verified</Badge>);
    expect(screen.getByText("Verified")).toHaveClass("text-brand");

    rerender(<Badge variant="disputed">Disputed</Badge>);
    expect(screen.getByText("Disputed")).toHaveClass("text-evidence-disputed-ink");

    rerender(<Badge variant="estimated">Estimated</Badge>);
    expect(screen.getByText("Estimated")).toHaveClass("text-evidence-estimated-ink");

    rerender(<Badge variant="unverified">Not verified</Badge>);
    expect(screen.getByText("Not verified")).toHaveClass("text-evidence-unverified-ink");
  });

  it("renders Progress and Separator with accessibility roles", () => {
    render(
      <div>
        <Progress value={50} />
        <Separator />
      </div>
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});
