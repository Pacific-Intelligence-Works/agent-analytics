"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { AI_AGENTS } from "@/lib/cloudflare/bots";

const STORAGE_KEY = "agent-analytics-disabled-agents";

interface AgentFilterContextType {
  disabledAgents: Set<string>;
  toggleAgent: (ua: string) => void;
  enableAll: () => void;
  disableAll: () => void;
}

const AgentFilterContext = createContext<AgentFilterContextType>({
  disabledAgents: new Set(),
  toggleAgent: () => {},
  enableAll: () => {},
  disableAll: () => {},
});

export function AgentFilterProvider({ children }: { children: ReactNode }) {
  const [disabledAgents, setDisabledAgents] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setDisabledAgents(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const save = useCallback((next: Set<string>) => {
    setDisabledAgents(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  }, []);

  const toggleAgent = useCallback(
    (ua: string) => {
      const next = new Set(disabledAgents);
      if (next.has(ua)) next.delete(ua);
      else next.add(ua);
      save(next);
    },
    [disabledAgents, save]
  );

  const enableAll = useCallback(() => save(new Set()), [save]);

  const disableAll = useCallback(
    () => save(new Set(AI_AGENTS.map((a) => a.ua))),
    [save]
  );

  return (
    <AgentFilterContext.Provider
      value={{ disabledAgents, toggleAgent, enableAll, disableAll }}
    >
      {children}
    </AgentFilterContext.Provider>
  );
}

export function useAgentFilter() {
  return useContext(AgentFilterContext);
}
