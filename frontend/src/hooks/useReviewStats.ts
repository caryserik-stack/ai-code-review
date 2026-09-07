import { useMemo } from "react";

interface ReviewItem {
  type: "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";
  severity: string | null;
}

interface ReviewLike {
  code: string;
  createdAt: string;
  updatedAt?: string;
}

export function useReviewStats(review: ReviewLike | null, items: ReviewItem[]) {
  return useMemo(() => {
    if (!review) return null;

    const linesAnalyzed = review.code.split("\n").length;

    const criticalCount = items.filter(
      (i) =>
        i.type === "SECURITY" &&
        (i.severity === "CRITICAL" || i.severity === "HIGH"),
    ).length;

    const maintainabilityIndex = Math.max(
      0,
      100 - items.filter((i) => i.type !== "SUGGESTION").length * 5,
    );

    const durationSeconds =
      review.updatedAt && review.createdAt
        ? Math.max(
            0,
            (new Date(review.updatedAt).getTime() -
              new Date(review.createdAt).getTime()) /
              1000,
          )
        : null;

    return {
      linesAnalyzed,
      criticalCount,
      maintainabilityIndex,
      durationSeconds,
    };
  }, [review, items]);
}
