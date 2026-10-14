import type { IApiClient } from "./types";
import { MockApiAdapter } from "./mockAdapter";
import { LiveApiAdapter } from "./liveAdapter";

const isLive = process.env.NEXT_PUBLIC_API_MODE === "live";

export const apiClient: IApiClient = isLive
  ? new LiveApiAdapter()
  : new MockApiAdapter();

export { MockApiAdapter, LiveApiAdapter };
export * from "./types";
