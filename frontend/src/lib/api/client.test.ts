import { describe, it, expect } from "vitest";
import { MockApiAdapter } from "./mockAdapter";
import type { ProgressEvent } from "@/types/contracts/ProgressEvent";

describe("ApiClient & MockAdapter", () => {
  it("loads mock search result contract conforming to SearchResult schema", async () => {
    const adapter = new MockApiAdapter();
    const result = await adapter.getSearchResult();

    expect(result).toBeDefined();
    expect(result.search_id).toBeDefined();
    expect(result.products).toBeInstanceOf(Array);
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.coverage_note).toBeDefined();
  });

  it("returns classified intent for product query and unclear query", async () => {
    const adapter = new MockApiAdapter();

    const laptopIntent = await adapter.getIntent("laptop for coding under 70k", "sess_test");
    expect(laptopIntent.category).toBe("laptop");
    expect(laptopIntent.needs_clarification).toBe(false);

    const unclearIntent = await adapter.getIntent("something for my mom", "sess_test");
    expect(unclearIntent.category).toBeNull();
    expect(unclearIntent.needs_clarification).toBe(true);
    expect(unclearIntent.clarification_options.length).toBeGreaterThan(0);
  });

  it("emits progress events across pipeline stages", async () => {
    const adapter = new MockApiAdapter();
    const events: ProgressEvent[] = [];

    const unsubscribe = adapter.subscribeProgress("sess_test", (ev) => {
      events.push(ev);
    });

    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
  });
});
