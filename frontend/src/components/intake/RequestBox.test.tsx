import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { RequestBox } from "./RequestBox";

describe("RequestBox (US-01 Acceptance Criteria)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("criterion 1: accepts text up to 1,000 characters and displays character counter", () => {
    render(<RequestBox />);
    const textarea = screen.getByLabelText(/What are you shopping for/i) as HTMLTextAreaElement;
    expect(textarea).toBeInTheDocument();
    expect(textarea.maxLength).toBe(1000);

    // Initial counter
    const counter = document.getElementById("char-counter");
    expect(counter).toHaveTextContent("0 / 1,000");

    // Type 26 characters
    fireEvent.change(textarea, { target: { value: "best laptop for coding 70k" } });
    expect(textarea.value).toBe("best laptop for coding 70k");
    expect(counter).toHaveTextContent("26 / 1,000");
  });

  it("criterion 2: works for physical products like 'laptop for coding'", async () => {
    render(<RequestBox />);
    const textarea = screen.getByLabelText(/What are you shopping for/i);
    const submitBtn = screen.getByRole("button", { name: /search/i });

    fireEvent.change(textarea, { target: { value: "laptop for coding under 70k" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Category Identified/i)).toBeInTheDocument();
      expect(screen.getByText(/Understood: Laptop/i)).toBeInTheDocument();
    });
  });

  it("criterion 2: works for other physical products like 'pram for a newborn'", async () => {
    render(<RequestBox />);
    const textarea = screen.getByLabelText(/What are you shopping for/i);
    const submitBtn = screen.getByRole("button", { name: /search/i });

    fireEvent.change(textarea, { target: { value: "pram for a newborn" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Category Identified/i)).toBeInTheDocument();
      expect(screen.getByText(/Understood: Pram & Stroller/i)).toBeInTheDocument();
    });
  });

  it("criterion 3: empty text gets one clear follow-up question, not an error", async () => {
    render(<RequestBox />);
    const submitBtn = screen.getByRole("button", { name: /search/i });

    // Submit empty text
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Clarification prompt appears instead of an error alert
      expect(screen.getByText(/What kind of product are you looking for\?/i)).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("criterion 4: request with no product type gets follow-up with 3 or 4 suggested category buttons", async () => {
    render(<RequestBox />);
    const textarea = screen.getByLabelText(/What are you shopping for/i);
    const submitBtn = screen.getByRole("button", { name: /search/i });

    fireEvent.change(textarea, { target: { value: "something for my mom" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/What kind of product are you looking for\?/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Kitchen appliance/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Phone/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Smartwatch/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Something else/i })).toBeInTheDocument();
    });

    // Selecting a suggested category confirms the category
    const phoneBtn = screen.getByRole("button", { name: /Phone/i });
    fireEvent.click(phoneBtn);

    await waitFor(() => {
      expect(screen.getByText(/Category Identified/i)).toBeInTheDocument();
      expect(screen.getByText(/Understood: Phone/i)).toBeInTheDocument();
    });
  });

  it("criterion 5: second unclear reply shows example requests and never guesses a category", async () => {
    render(<RequestBox />);
    const textarea = screen.getByLabelText(/What are you shopping for/i);
    const submitBtn = screen.getByRole("button", { name: /search/i });

    // First unclear request
    fireEvent.change(textarea, { target: { value: "something for my mom" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Something else/i })).toBeInTheDocument();
    });

    // User chooses 'Something else' (second unclear turn)
    fireEvent.click(screen.getByRole("button", { name: /Something else/i }));

    await waitFor(() => {
      expect(screen.getByText(/Example requests/i)).toBeInTheDocument();
      expect(screen.getByText(/We could not determine a product category/i)).toBeInTheDocument();
      // Never guesses category
      expect(screen.queryByText(/Category Identified/i)).not.toBeInTheDocument();
    });
  });

  it("criterion 6: research action is locked until category is known", async () => {
    render(<RequestBox />);
    const textarea = screen.getByLabelText(/What are you shopping for/i);
    const submitBtn = screen.getByRole("button", { name: /search/i });

    // Initially no result or category
    expect(screen.queryByRole("button", { name: /Start Research/i })).not.toBeInTheDocument();

    // After valid product is typed
    fireEvent.change(textarea, { target: { value: "laptop for coding" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const researchBtn = screen.getByRole("button", { name: /Start Research/i });
      expect(researchBtn).toBeInTheDocument();
      expect(researchBtn).not.toBeDisabled();
    });
  });

  it("criterion 7: request is saved and tagged with a persistent session ID", async () => {
    render(<RequestBox />);
    const textarea = screen.getByLabelText(/What are you shopping for/i);
    const submitBtn = screen.getByRole("button", { name: /search/i });

    fireEvent.change(textarea, { target: { value: "laptop for coding under 70k" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      const sessionBadge = screen.getByText(/sess_/i);
      expect(sessionBadge).toBeInTheDocument();
    });
  });

  it("allows clearing input and resetting state cleanly", async () => {
    render(<RequestBox />);
    const textarea = screen.getByLabelText(/What are you shopping for/i) as HTMLTextAreaElement;

    fireEvent.change(textarea, { target: { value: "laptop" } });
    expect(textarea.value).toBe("laptop");

    const clearBtn = screen.getByRole("button", { name: /clear request/i });
    fireEvent.click(clearBtn);

    expect(textarea.value).toBe("");
  });
});
