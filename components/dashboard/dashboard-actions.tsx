"use client";

import { useState } from "react";
import { Download, Settings, Users } from "lucide-react";
import { SyncButton } from "./sync-button";
import { DateRangePicker } from "./date-range-picker";
import { SettingsModal } from "./settings-modal";
import { MembersModal } from "./members-modal";

interface DashboardActionsProps {
  accountId: string;
  days?: number;
  isOwner?: boolean;
}

export function DashboardActions({ accountId, days, isOwner }: DashboardActionsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

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
          onClick={() => setMembersOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
          title="Team access"
        >
          <Users className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>
      <MembersModal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        accountId={accountId}
      />
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}
