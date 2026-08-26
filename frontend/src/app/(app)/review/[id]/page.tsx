"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { reviewApi } from "@/lib/apiClient";
import { ReviewSkeleton } from "@/components/skeletons/ReviewSkeleton";
import { CodeBlock } from "@/components/CodeBlock";
import { IssueAccordion } from "@/components/review/IssueAccordion";
import { QualityGateBanner } from "@/components/review/QualityGateBanner";
import {
  Download,
  FileText,
  ChevronDown,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { useReviewsStore } from "@/store/reviewsStore";
import { ReviewChatPanel } from "@/components/review/ReviewChatPanel";
// import { ScoreGauge } from "@/components/review/ScoreGauge";
import { toast } from "sonner";
import { useIssueFilter } from "@/hooks/useIssueFilter";
import { IssueFilterBar } from "@/components/review/IssueFilterBar";
import { AnimatedProgressBar } from "@/components/review/AnimatedProgressBar";
import { ReviewStatsGrid } from "@/components/review/ReviewStatsGrid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();

  const reviewId = params.id as string;
  const cachedReview = useReviewsStore((state) => state.reviewCache[reviewId]);
  const cacheReview = useReviewsStore((state) => state.cacheReview);

  const [review, setReview] = useState<Review | null>(cachedReview ?? null);
  const [loading, setLoading] = useState(!cachedReview);
  const [notFound, setNotFound] = useState(false);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const [pollingLost, setPollingLost] = useState(false);

  const { filter, setFilter, search, setSearch, filtered } = useIssueFilter(
    review?.items ?? [],
  );

  const issuesRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // ──────────────────────
  // Загрузка ревью
  // ──────────────────────
  const fetchReview = useCallback(
    async (showSkeleton: boolean) => {
      if (showSkeleton) setLoading(true);
      try {
        const data = await reviewApi.getById(reviewId);
        if (!isMountedRef.current) return;
        setReview(data.review);
        setNotFound(false);
        cacheReview(data.review);
      } catch (err) {
        if (!isMountedRef.current) return;
        if (showSkeleton) {
          setReview(null);
          setNotFound(true);
        } else {
          // фоновый рефетч не должен молчать
          toast.error("Failed to refresh review data");
        }
      } finally {
        if (isMountedRef.current && showSkeleton) setLoading(false);
      }
    },
    [reviewId, cacheReview],
  );

  useEffect(() => {
    const cached = useReviewsStore.getState().reviewCache[reviewId];
    setReview(cached ?? null);
    setNotFound(false);
    setLoading(!cached);
    fetchReview(!cached);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  // ──────────────────────
  // Поллинг статуса (с лимитом ошибок, а не бесконечным "молчанием")
  // ──────────────────────
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

  // ──────────────────────
  // Клик вне export-dropdown больше не нужен — заменён на Radix DropdownMenu
  // ──────────────────────

  const handleDownloadMarkdown = useCallback(async () => {
    if (!review) return;
    setExportOpen(false);
    setDownloading(true);
    try {
      await reviewApi.downloadReport(review.id);
    } catch {
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  }, [review]);

  const handleLineClick = useCallback((line: number) => {
    setHighlightLine(null);
    requestAnimationFrame(() => setHighlightLine(line));
  }, []);

  const handleFilterChange = useCallback(
    (f: typeof filter) => {
      setFilter(f);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        const el = issuesRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const isFullyVisible =
          rect.top >= 0 && rect.bottom <= window.innerHeight;
        if (!isFullyVisible) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    },
    [setFilter],
  );

  const getLevelStyle = (level: string) => {
    switch (level.toUpperCase()) {
      case "MIDDLE":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
      case "SENIOR":
        return "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300";
      default:
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
    }
  };

  const stats = useMemo(() => {
    if (!review) return null;
    const items = review.items ?? [];
    const linesAnalyzed = review.code.split("\n").length;
    const criticalCount = review.items.filter(
      (i) =>
        i.type === "SECURITY" &&
        (i.severity === "CRITICAL" || i.severity === "HIGH"),
    ).length;
    const maintainabilityIndex = Math.max(
      0,
      100 - review.items.filter((i) => i.type !== "SUGGESTION").length * 5,
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
  }, [review]);

  const handleCancelReview = useCallback(async () => {
    try {
      await reviewApi.delete(review!.id);
      useReviewsStore.getState().removeReview(review!.id);
      router.push("/review/new");
    } catch {
      toast.error("Failed to cancel review");
    }
  }, [review, router]);

  // ──────────────────────
  // Рендер
  // ──────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
        <ReviewSkeleton />
      </div>
    );
  }

  if (notFound || !review) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-surface-dark px-4 text-center">
        <p className="text-gray-500 dark:text-gray-400">Review not found</p>
        <Link
          href="/review/new"
          className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeft size={14} />
          Start a new review
        </Link>
      </div>
    );
  }

  if (review.status === "PROCESSING" || review.status === "PENDING") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-surface-dark px-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            AI is analyzing your code...
          </p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This usually takes 10–30 seconds
        </p>

        <div className="flex gap-3 mt-2">
          <Link
            href="/review/new"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2"
          >
            Start a new review instead
          </Link>
          <button
            onClick={handleCancelReview}
            className="text-sm text-red-500 hover:text-red-600 underline underline-offset-2"
          >
            Cancel this review
          </button>
        </div>
      </div>
    );
  }

  if (review.status === "FAILED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-surface-dark px-4 text-center">
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <p className="text-gray-900 dark:text-gray-100 font-medium">
          This review failed to complete
        </p>
        {review.failureReason && (
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
            {review.failureReason}
          </p>
        )}
        <Link
          href="/review/new"
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
          >
            <MessageSquare size={14} />
            Ask AI
          </button>

          <DropdownMenu open={exportOpen} onOpenChange={setExportOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
              >
                <Download size={14} />
                Export
                <ChevronDown size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="min-w-[180px] bg-white dark:bg-card-dark border-gray-200 dark:border-border-dark"
            >
              <DropdownMenuItem
                onClick={handleDownloadMarkdown}
                disabled={downloading}
                className="gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                <FileText size={14} />
                {downloading ? "Downloading..." : "Markdown (.md)"}
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link
                  href={`/review/${review.id}/report`}
                  onClick={() => setExportOpen(false)}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <Download size={14} />
                  PDF (Print)
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Score карточка */}
        <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark">
          <div className="flex justify-between items-start gap-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Language
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {review.language}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Reviewed as
              </p>
              <span
                className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getLevelStyle(review.reviewerLevel)}`}
              >
                {review.reviewerLevel.toLowerCase()}
              </span>
            </div>
          </div>

          {review.summary && (
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-100 dark:border-border-dark pt-4">
              {review.summary}
            </p>
          )}

          {review.score !== null && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-border-dark">
              <AnimatedProgressBar
                value={review.score}
                label="Code Quality Score"
                colorFrom={
                  review.score >= 80
                    ? "from-green-500"
                    : review.score >= 60
                      ? "from-yellow-500"
                      : "from-red-500"
                }
                colorTo={
                  review.score >= 80
                    ? "to-emerald-400"
                    : review.score >= 60
                      ? "to-orange-400"
                      : "to-rose-400"
                }
              />
            </div>
          )}
        </div>

        {stats && (
          <ReviewStatsGrid
            linesAnalyzed={stats.linesAnalyzed}
            durationSeconds={stats.durationSeconds ?? 0}
            qualityScore={review.score ?? 0}
            criticalCount={stats.criticalCount}
            maintainabilityIndex={stats.maintainabilityIndex}
          />
        )}

        <QualityGateBanner items={review.items ?? []} />

        <IssueFilterBar
          items={review.items}
          activeFilter={filter}
          onFilterChange={handleFilterChange}
          search={search}
          onSearchChange={setSearch}
        />

        <div ref={issuesRef}>
          <IssueAccordion
            items={filtered}
            onLineClick={handleLineClick}
            onItemsChange={(updatedItems) => {
              if (!review) return;
              const updatedMap = new Map(updatedItems.map((i) => [i.id, i]));
              const next = {
                ...review,
                items: review.items.map(
                  (item) => updatedMap.get(item.id) ?? item,
                ),
              };
              setReview(next);
              cacheReview(next);
            }}
          />
        </div>

        <ReviewChatPanel
          reviewId={review.id}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />

        <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Source Code
          </h2>
          <CodeBlock
            code={review.code}
            language={review.language}
            highlightLine={highlightLine}
          />
        </div>
      </main>
    </div>
  );
}
