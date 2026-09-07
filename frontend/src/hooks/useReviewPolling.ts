import { useCallback, useEffect, useRef, useState } from "react";
import { reviewApi } from "@/lib/apiClient";
import { useReviewsStore } from "@/store/reviewsStore";
import { toast } from "sonner";

interface ReviewItem {
  id: string;
  type: "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";
  title: string;
  description: string;
  line: number | null;
  originalCode: string | null;
  suggestedCode: string | null;
  resolved: boolean;
  owaspCategory: string | null;
  severity: string | null;
}

interface Review {
  id: string;
  code: string;
  language: string;
  reviewerLevel: string;
  status: string;
  score: number | null;
  summary: string | null;
  createdAt: string;
  updatedAt?: string;
  failureReason?: string | null;
  items?: ReviewItem[];
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLL_FAILURES = 3;

export function useReviewPolling(reviewId: string) {
  const cachedReview = useReviewsStore((state) => state.reviewCache[reviewId]);
  const cacheReview = useReviewsStore((state) => state.cacheReview);

  const [review, setReview] = useState<Review | null>(cachedReview ?? null);
  const [loading, setLoading] = useState(!cachedReview);
  const [notFound, setNotFound] = useState(false);
  const [pollingLost, setPollingLost] = useState(false);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchReview = useCallback(
    async (showSkeleton: boolean) => {
      if (showSkeleton) setLoading(true);
      try {
        const data = await reviewApi.getById(reviewId);
        if (!isMountedRef.current) return;
        setReview(data.review);
        setNotFound(false);
        cacheReview(data.review);
      } catch {
        if (!isMountedRef.current) return;
        if (showSkeleton) {
          setReview(null);
          setNotFound(true);
        } else {
          toast.error("Failed to refresh review data");
        }
      } finally {
        if (isMountedRef.current && showSkeleton) setLoading(false);
      }
    },
    [reviewId, cacheReview],
  );

  // Первичная загрузка / смена reviewId
  useEffect(() => {
    const cached = useReviewsStore.getState().reviewCache[reviewId];
    setReview(cached ?? null);
    setNotFound(false);
    setPollingLost(false);
    setLoading(!cached);
    fetchReview(!cached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  // Поллинг статуса, пока ревью в процессе
  useEffect(() => {
    if (!review) return;
    if (review.status !== "PROCESSING" && review.status !== "PENDING") return;

    let failures = 0;
    let cancelled = false;

    const interval = setInterval(async () => {
      try {
        const data = await reviewApi.getById(reviewId);
        if (cancelled || !isMountedRef.current) return;
        failures = 0;
        setReview(data.review);
        cacheReview(data.review);
        if (
          data.review.status === "COMPLETED" ||
          data.review.status === "FAILED"
        ) {
          clearInterval(interval);
        }
      } catch {
        failures += 1;
        if (failures >= MAX_POLL_FAILURES) {
          clearInterval(interval);
          if (isMountedRef.current) {
            setPollingLost(true);
            toast.error(
              "Lost connection while checking review status. Refresh the page to try again.",
            );
          }
        }
      }
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [review?.status, reviewId, cacheReview]);

  return { review, setReview, loading, notFound, pollingLost, cacheReview };
}
