"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { reviewApi } from "@/lib/apiClient";
import { ReviewSkeleton } from "@/components/skeletons/ReviewSkeleton";
import { CodeBlock } from "@/components/CodeBlock";
import { IssueAccordion } from "@/components/review/IssueAccordion";
import { QualityGateBanner } from "@/components/review/QualityGateBanner";
import { IssuesProgressBar } from "@/components/review/IssuesProgressBar";
import { ReviewPageHeader } from "@/components/review/ReviewPageHeader";
import { ArrowLeft, MessageSquare, AlertTriangle } from "lucide-react";
import { useReviewsStore } from "@/store/reviewsStore";
import { ReviewChatPanel } from "@/components/review/ReviewChatPanel";
import { ConfirmModal } from "@/components/ConfirmModal";
import { toast } from "sonner";
import { useIssueFilter } from "@/hooks/useIssueFilter";
import { useReviewPolling } from "@/hooks/useReviewPolling";
import { useReviewStats } from "@/hooks/useReviewStats";
import { IssueFilterBar } from "@/components/review/IssueFilterBar";
import { AnimatedProgressBar } from "@/components/review/AnimatedProgressBar";
import { ReviewStatsGrid } from "@/components/review/ReviewStatsGrid";
import { SeverityDonut } from "@/components/review/SeverityDonut";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;

  const { review, setReview, loading, notFound, pollingLost, cacheReview } =
    useReviewPolling(reviewId);

  const items = useMemo(() => review?.items ?? [], [review]);
  const stats = useReviewStats(review, items);

  const [highlightLine, setHighlightLine] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const { filter, setFilter, search, setSearch, sortBy, setSortBy, filtered } =
    useIssueFilter(items);

  const issuesRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (e.key === "/" && !isTyping) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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

  const handleCancelReview = useCallback(async () => {
    if (!review) return;
    setCancelling(true);
    try {
      await reviewApi.delete(review.id);
      useReviewsStore.getState().removeReview(review.id);
      router.push("/review/new");
    } catch {
      toast.error("Failed to cancel review");
    } finally {
      setCancelling(false);
      setConfirmCancel(false);
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
      <>
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

          {pollingLost && (
            <div className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 text-sm px-4 py-2.5 rounded-lg max-w-sm text-center">
              Lost connection while checking the review status.
              <button
                onClick={() => window.location.reload()}
                className="block mx-auto mt-1 underline font-medium"
              >
                Refresh the page
              </button>
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <Link
              href="/review/new"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline underline-offset-2"
            >
              Start a new review instead
            </Link>
            <button
              onClick={() => setConfirmCancel(true)}
              className="text-sm text-red-500 hover:text-red-600 underline underline-offset-2"
            >
              Cancel this review
            </button>
          </div>
        </div>

        <ConfirmModal
          isOpen={confirmCancel}
          title="Cancel this review?"
          description="The review in progress will be deleted permanently. This action cannot be undone."
          confirmText="Cancel review"
          onConfirm={handleCancelReview}
          onCancel={() => setConfirmCancel(false)}
          loading={cancelling}
        />
      </>
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
        <ReviewPageHeader
          language={review.language}
          reviewerLevel={review.reviewerLevel}
          createdAt={review.createdAt}
          reviewId={review.id}
          exportOpen={exportOpen}
          onExportOpenChange={setExportOpen}
          onDownloadMarkdown={handleDownloadMarkdown}
          downloading={downloading}
          onAskAI={() => setChatOpen(true)}
        />

        <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark">
          {review.summary && (
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              {review.summary}
            </p>
          )}

          {review.score !== null && (
            <div
              className={
                review.summary
                  ? "mt-4 pt-4 border-t border-gray-100 dark:border-border-dark"
                  : ""
              }
            >
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

        {/* {stats && (
          <ReviewStatsGrid
            linesAnalyzed={stats.linesAnalyzed}
            durationSeconds={stats.durationSeconds ?? 0}
            qualityScore={review.score ?? 0}
            criticalCount={stats.criticalCount}
            maintainabilityIndex={stats.maintainabilityIndex}
          />
        )} */}

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-start">
          <QualityGateBanner items={items} />
        </div>

        <div className="md:w-72">
          <SeverityDonut items={items} />
        </div>

        <IssuesProgressBar items={items} />

        <IssueFilterBar
          ref={searchInputRef}
          items={items}
          activeFilter={filter}
          onFilterChange={handleFilterChange}
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
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
                items: items.map((item) => updatedMap.get(item.id) ?? item),
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
