import { Bot, Globe, HardDrive, Clock } from "lucide-react";

interface StatCardsProps {
  totalRequests: number;
  uniqueBots: number;
  totalBytes: number;
  lastSyncedAt: Date | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[i]}`;
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return "Never";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const stats = [
  {
    key: "requests",
    label: "Total AI Agent Requests",
    icon: Globe,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: "bots",
    label: "Unique Agents Detected",
    icon: Bot,
    format: (v: number) => v.toString(),
  },
  {
    key: "bytes",
    label: "Data Transferred",
    icon: HardDrive,
    format: (v: number) => formatBytes(v),
  },
  {
    key: "synced",
    label: "Last Synced",
    icon: Clock,
    format: (_v: number, date: Date | null) => formatTimeAgo(date),
  },
] as const;

export function StatCards({
  totalRequests,
  uniqueBots,
  totalBytes,
  lastSyncedAt,
}: StatCardsProps) {
  const values: Record<string, number> = {
    requests: totalRequests,
    bots: uniqueBots,
    bytes: totalBytes,
    synced: 0,
  };

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.key}
            className="rounded-xl border border-gray-800 bg-gray-900/50 p-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Icon className="h-4 w-4 text-gray-500" />
              <span className="text-xs font-medium text-gray-500">
                {stat.label}
              </span>
            </div>
            <div className="text-2xl font-semibold text-white">
              {stat.key === "synced"
                ? stat.format(0, lastSyncedAt)
                : stat.format(values[stat.key])}
            </div>
          </div>
        );
      })}
    </div>
  );
}
