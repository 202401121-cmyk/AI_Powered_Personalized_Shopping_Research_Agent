import type { SearchResult } from "@/types/contracts/SearchResult";
import type { Intent } from "@/types/contracts/Intent";
import type { ProgressEvent } from "@/types/contracts/ProgressEvent";

export interface SearchParams {
  query: string;
  sessionId: string;
  weights?: Record<string, number>;
}

export interface IApiClient {
  getSearchResult(params?: SearchParams): Promise<SearchResult>;
  getIntent(query: string, sessionId: string): Promise<Intent>;
  subscribeProgress(sessionId: string, onEvent: (event: ProgressEvent) => void): () => void;
}
