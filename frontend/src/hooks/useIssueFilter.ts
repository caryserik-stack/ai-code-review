// frontend/src/hooks/useIssueFilter.ts
import { useMemo, useState } from "react";

export function useIssueFilter<
  T extends {
    type: string;
    title: string;
    description: string;
    line: number | null;
  },
>(items: T[]) {
  const [filter, setFilter] = useState<"ALL" | T["type"]>("ALL");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter = filter === "ALL" || item.type === filter;
      if (!matchesFilter) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        String(item.line ?? "").includes(q)
      );
    });
  }, [items, filter, search]);

  return { filter, setFilter, search, setSearch, filtered };
}
