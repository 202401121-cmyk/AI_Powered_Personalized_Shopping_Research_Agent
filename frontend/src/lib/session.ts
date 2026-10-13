/**
 * Session management for ShopSense (US-01 criterion: Each request is saved with a session ID).
 * Persists session ID in sessionStorage across page interactions.
 */

const SESSION_STORAGE_KEY = "shopsense_session_id";

function generateSessionId(): string {
  // Use crypto.randomUUID if available, else a secure fallback
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `sess_${crypto.randomUUID().slice(0, 8)}`;
  }
  const rand = Math.random().toString(36).substring(2, 10);
  return `sess_${rand}`;
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "sess_ssr_init";
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const newId = generateSessionId();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
    return newId;
  } catch {
    // If sessionStorage is restricted or disabled
    return generateSessionId();
  }
}
