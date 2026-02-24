"use client";

import { usePathname } from "next/navigation";

const PRESETS = [
  { label: "7d", value: 7 },
  { label: "14d", value: 14 },
  { label: "30d", value: 30 },
];

export function DateRangePicker({ currentDays = 7 }: { currentDays?: number }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 rounded-lg border border-gray-200 p-0.5">
      {PRESETS.map((p) => (
        <a
          key={p.value}
          href={p.value === 7 ? pathname : `${pathname}?days=${p.value}`}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            currentDays === p.value
              ? "bg-gray-900 text-white"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          {p.label}
        </a>
      ))}
    </div>
  );
}
