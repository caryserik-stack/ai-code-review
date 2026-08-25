// frontend/src/components/review/IssueFilterBar.tsx
"use client";

import { useMemo } from "react";
import { Search, X } from "lucide-react";

type IssueType = "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";
type FilterKey = "ALL" | IssueType;

type ReviewItem = {
  type: IssueType;
  title: string;
  description: string;
  line: number | null;
};

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "ERROR", label: "Errors" },
  { key: "SECURITY", label: "Security" },
  { key: "WARNING", label: "Warnings" },
  { key: "SUGGESTION", label: "Suggestions" },
];

const FILTER_STYLES: Record<FilterKey, string> = {
  ALL: "data-active:bg-gray-900 dark:data-active:bg-gray-100 data-active:text-white dark:data-active:text-gray-900",
  ERROR: "data-active:bg-red-500 data-active:text-white",
  SECURITY: "data-active:bg-purple-500 data-active:text-white",
  WARNING: "data-active:bg-yellow-500 data-active:text-white",
  SUGGESTION: "data-active:bg-blue-500 data-active:text-white",
};

type Props = {
  items: ReviewItem[];
  activeFilter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
  search: string;
  onSearchChange: (s: string) => void;
};

export function IssueFilterBar({
  items,
  activeFilter,
  onFilterChange,
  search,
  onSearchChange,
}: Props) {
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      ALL: items.length,
      ERROR: 0,
      WARNING: 0,
      SUGGESTION: 0,
      SECURITY: 0,
    };
    for (const item of items) c[item.type]++;
    return c;
  }, [items]);

  return (
    <div className="sticky top-0 z-10 -mx-4 px-4 py-3 backdrop-blur-md bg-white/80 dark:bg-card-dark/80 border-b border-gray-200 dark:border-border-dark space-y-3">
      {/* Табы */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {FILTERS.map(({ key, label }) => {
          const isActive = activeFilter === key;
          return (
            <button
              key={key}
              type="button"
              data-active={isActive || undefined}
              onClick={() => onFilterChange(key)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                ${
                  isActive
                    ? "border-transparent shadow-sm"
                    : "border-gray-200 dark:border-border-dark text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-surface-dark"
                }
                ${FILTER_STYLES[key]}`}
            >
              {label}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? "bg-white/20"
                    : "bg-gray-100 dark:bg-surface-dark text-gray-400 dark:text-gray-500"
                }`}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Поиск */}
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by message or line number..."
          className="w-full text-sm pl-9 pr-9 py-2 rounded-lg border border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
