"use client";

import { useState } from "react";
import { Download, Settings } from "lucide-react";
import { SyncButton } from "./sync-button";
import { DateRangePicker } from "./date-range-picker";
import { SettingsModal } from "./settings-modal";

interface DashboardActionsProps {
  accountId: string;
  days?: number;
}

export function DashboardActions({ accountId, days }: DashboardActionsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <DateRangePicker currentDays={days} />
        <SyncButton accountId={accountId} />
        <a
          href={`/api/accounts/${accountId}/export?format=csv`}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </a>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
