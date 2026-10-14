import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React from "react";
import { SessionProvider, useSession } from "./SessionContext";

function TestConsumer() {
  const { sessionId, query, setQuery } = useSession();
  return (
    <div>
      <span data-testid="session-id">{sessionId}</span>
      <span data-testid="query-val">{query}</span>
      <button onClick={() => setQuery("new query")}>Set Query</button>
    </div>
  );
}

describe("SessionContext & SessionProvider", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("provides persistent sessionId and query state across components", () => {
    render(
      <SessionProvider>
        <TestConsumer />
      </SessionProvider>
    );

    const sessionIdEl = screen.getByTestId("session-id");
    expect(sessionIdEl.textContent).toMatch(/sess_/);

    const btn = screen.getByRole("button", { name: "Set Query" });
    act(() => {
      btn.click();
    });

    expect(screen.getByTestId("query-val").textContent).toBe("new query");
  });
});
