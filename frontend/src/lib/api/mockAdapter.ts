import type { IApiClient, SearchParams } from "./types";
import type { SearchResult } from "@/types/contracts/SearchResult";
import type { Intent } from "@/types/contracts/Intent";
import type { ProgressEvent } from "@/types/contracts/ProgressEvent";
import { mockSearchResult, mockIntent, mockIntentUnclear } from "./mockData";

export class MockApiAdapter implements IApiClient {
  async getSearchResult(_params?: SearchParams): Promise<SearchResult> {
    // Return typed mock search result from shared contracts
    return mockSearchResult as unknown as SearchResult;
  }

  async getIntent(query: string, _sessionId: string): Promise<Intent> {
    const isUnclear = !query.trim() || query.toLowerCase().includes("something for my mom");
    return (isUnclear ? mockIntentUnclear : mockIntent) as unknown as Intent;
  }

  subscribeProgress(
    _sessionId: string,
    onEvent: (event: ProgressEvent) => void
  ): () => void {
    const stages: Array<{ stage: ProgressEvent["stage"]; message: string }> = [
      { stage: "intake", message: "Parsing request and detecting category" },
      { stage: "criteria", message: "Generating category rubric" },
      { stage: "research", message: "Retrieving discussions and specifications" },
      { stage: "extract", message: "Extracting verified claims" },
      { stage: "match", message: "Matching candidate products" },
      { stage: "verify", message: "Verifying specs against evidence" },
      { stage: "decide", message: "Scoring and ranking shortlist" },
      { stage: "commerce", message: "Fetching latest prices" },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < stages.length) {
        const step = stages[index];
        onEvent({
          search_id: _sessionId,
          stage: step.stage,
          status: index === stages.length - 1 ? "finished" : "started",
          message: step.message,
          at: new Date().toISOString(),
        });
        index++;
      } else {
        clearInterval(interval);
      }
    }, 400);

    return () => clearInterval(interval);
  }
}
