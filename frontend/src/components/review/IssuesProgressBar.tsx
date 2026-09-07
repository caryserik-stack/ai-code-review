"use client";

import { useMemo } from "react";
import { AnimatedProgressBar } from "./AnimatedProgressBar";

type ReviewItem = {
  resolved: boolean;
};

type Props = {
  items: ReviewItem[];
};

export function IssuesProgressBar({ items }: Props) {
  const { resolved, total, pct } = useMemo(() => {
    const total = items.length;
    const resolved = items.filter((i) => i.resolved).length;
    const pct = total === 0 ? 100 : Math.round((resolved / total) * 100);
    return { resolved, total, pct };
  }, [items]);

  if (total === 0) return null;

  return (
    <AnimatedProgressBar
      value={pct}
      label={
        resolved === total
          ? "All issues resolved"
          : `Fixed ${resolved} of ${total} issues`
      }
      colorFrom="from-emerald-500"
      colorTo="to-teal-400"
      height={8}
    />
  );
}
