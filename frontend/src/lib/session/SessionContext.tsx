"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getOrCreateSessionId } from "@/lib/session";

interface SessionContextType {
  sessionId: string;
  query: string;
  setQuery: (q: string) => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const resetSession = () => {
    setQuery("");
  };

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        query,
        setQuery,
        resetSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    // Return fallback for testing or components rendered outside provider
    return {
      sessionId: getOrCreateSessionId(),
      query: "",
      setQuery: () => {},
      resetSession: () => {},
    };
  }
  return context;
}
