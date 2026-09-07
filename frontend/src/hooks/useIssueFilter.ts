import { useMemo, useState } from "react";

const SEVERITY_ORDER: Record<string, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export const SORT_OPTIONS = ["severity", "line", "type"] as const;
export type SortKey = (typeof SORT_OPTIONS)[number];

export function useIssueFilter<
  T extends {
    type: string;
    title: string;
    description: string;
    line: number | null;
    severity?: string | null;
  },
>(items: T[]) {
  const [filter, setFilter] = useState<"ALL" | T["type"]>("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("severity");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const matched = items.filter((item) => {
      const matchesFilter = filter === "ALL" || item.type === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        String(item.line ?? "").includes(q)
      );
    });

    const sorted = [...matched].sort((a, b) => {
      if (sortBy === "severity") {
        const av = a.severity ? (SEVERITY_ORDER[a.severity] ?? 9) : 9;
        const bv = b.severity ? (SEVERITY_ORDER[b.severity] ?? 9) : 9;
        return av - bv;
      }
      if (sortBy === "line") {
        return (a.line ?? Infinity) - (b.line ?? Infinity);
      }
      // sortBy === "type"
      return a.type.localeCompare(b.type);
    });

    return sorted;
  }, [items, filter, search, sortBy]);

  return { filter, setFilter, search, setSearch, sortBy, setSortBy, filtered };
}
