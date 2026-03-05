"use client";

import { Zap, Radio, CalendarClock, FileText } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalSprints: number;
    activeSprints: number;
    upcomingSprints: number;
    templates: number;
  };
}

const STAT_ITEMS = [
  {
    key: "totalSprints" as const,
    label: "Total Sprints",
    icon: Zap,
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
  {
    key: "activeSprints" as const,
    label: "Active",
    icon: Radio,
    color: "text-success",
    bg: "bg-success-light",
  },
  {
    key: "upcomingSprints" as const,
    label: "Upcoming",
    icon: CalendarClock,
    color: "text-primary",
    bg: "bg-primary-light",
  },
  {
    key: "templates" as const,
    label: "Templates",
    icon: FileText,
    color: "text-gray-600",
    bg: "bg-gray-100",
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {STAT_ITEMS.map((item) => (
        <div
          key={item.key}
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div
              className={`w-9 h-9 ${item.bg} rounded-lg flex items-center justify-center`}
            >
              <item.icon size={18} className={item.color} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats[item.key]}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
