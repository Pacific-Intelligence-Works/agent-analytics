"use client";

import { X } from "lucide-react";
import { AI_AGENTS, ORG_COLORS } from "@/lib/cloudflare/bots";
import { useAgentFilter } from "./agent-filter-provider";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { disabledAgents, toggleAgent, enableAll, disableAll } =
    useAgentFilter();

  if (!open) return null;

  // Group agents by org
  const byOrg = new Map<string, typeof AI_AGENTS>();
  for (const agent of AI_AGENTS) {
    const list = byOrg.get(agent.org) || [];
    list.push(agent);
    byOrg.set(agent.org, list);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-auto rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-700 bg-gray-900 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-300">AI Agents</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                Toggle which agents appear in your dashboard charts and tables.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={enableAll}
                className="rounded px-2 py-1 text-xs text-indigo-400 transition-colors hover:bg-gray-800"
              >
                Enable all
              </button>
              <button
                onClick={disableAll}
                className="rounded px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-800"
              >
                Disable all
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {[...byOrg.entries()].map(([org, agents]) => (
              <div key={org}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: ORG_COLORS[org] || "#a855f7",
                    }}
                  />
                  <span className="text-sm font-medium text-gray-300">
                    {org}
                  </span>
                </div>
                <div className="space-y-1 pl-5">
                  {agents.map((agent) => (
                    <label
                      key={agent.ua}
                      className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-gray-800/50"
                    >
                      <input
                        type="checkbox"
                        checked={!disabledAgents.has(agent.ua)}
                        onChange={() => toggleAgent(agent.ua)}
                        className="mt-0.5 h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                      <div className="min-w-0 flex-1">
                        <span className="font-mono text-xs text-gray-200">
                          {agent.ua}
                        </span>
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                          {agent.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
