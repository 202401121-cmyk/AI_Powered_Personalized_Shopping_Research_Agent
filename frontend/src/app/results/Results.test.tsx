import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import ResultsPage from "./page";

describe("ResultsPage (/results)", () => {
  it("renders search results, evidence states, and re-rank sliders", async () => {
    render(<ResultsPage />);

    // Should load mock results from search_result.json
    await waitFor(() => {
      expect(screen.getByText(/Ranked Shortlist/i)).toBeInTheDocument();
      expect(screen.getByText(/Nova Book 14/i)).toBeInTheDocument();
      expect(screen.getByText(/Coverage Note/i)).toBeInTheDocument();
      expect(screen.getByText(/Instant Re-rank/i)).toBeInTheDocument();
      expect(screen.getByText(/Filtered Out Candidates/i)).toBeInTheDocument();
    });
  });
});
