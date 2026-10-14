import type { IApiClient, SearchParams } from "./types";
import type { SearchResult } from "@/types/contracts/SearchResult";
import type { Intent } from "@/types/contracts/Intent";
import type { ProgressEvent } from "@/types/contracts/ProgressEvent";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class LiveApiAdapter implements IApiClient {
  async getSearchResult(params?: SearchParams): Promise<SearchResult> {
    const res = await fetch(`${BASE_URL}/api/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raw_text: params?.query || "",
        session_id: params?.sessionId || "",
        weights: params?.weights,
      }),
    });

    if (!res.ok) {
      throw new Error(`Live API search failed with status ${res.status}`);
    }

    return (await res.json()) as SearchResult;
  }

  async getIntent(query: string, sessionId: string): Promise<Intent> {
    const res = await fetch(`${BASE_URL}/api/intake`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        raw_text: query,
        session_id: sessionId,
      }),
    });

    if (!res.ok) {
      throw new Error(`Live API intake failed with status ${res.status}`);
    }

    return (await res.json()) as Intent;
  }

  subscribeProgress(
    sessionId: string,
    onEvent: (event: ProgressEvent) => void
  ): () => void {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return () => {};
    }

    const eventSource = new EventSource(`${BASE_URL}/api/search/stream?session_id=${sessionId}`);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as ProgressEvent;
        onEvent(parsed);
      } catch (err) {
        console.error("Failed to parse SSE ProgressEvent:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn("SSE connection error or closed:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }
}
