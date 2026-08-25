"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { reviewApi } from "@/lib/apiClient";
import { ReviewSkeleton } from "@/components/skeletons/ReviewSkeleton";
import { CodeBlock } from "@/components/CodeBlock";
import { IssueAccordion } from "@/components/review/IssueAccordion";
import { QualityGateBanner } from "@/components/review/QualityGateBanner";
import { Download, FileText, ChevronDown, MessageSquare } from "lucide-react";
import { useReviewsStore } from "@/store/reviewsStore";
import { ReviewChatPanel } from "@/components/review/ReviewChatPanel";
import { ScoreGauge } from "@/components/review/ScoreGauge";
import { toast } from "sonner";
import { useIssueFilter } from "@/hooks/useIssueFilter";
import { IssueFilterBar } from "@/components/review/IssueFilterBar";
import { AnimatedProgressBar } from "@/components/review/AnimatedProgressBar";
import { ReviewStatsGrid } from "@/components/review/ReviewStatsGrid";

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
  items: ReviewItem[];
}

export default function ReviewPage() {
  const params = useParams();
  const reviewId = params.id as string;
  const cachedReview = useReviewsStore((state) => state.reviewCache[reviewId]);
  const cacheReview = useReviewsStore((state) => state.cacheReview);

  const [review, setReview] = useState<Review | null>(cachedReview ?? null);
  const [loading, setLoading] = useState(!cacheReview);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const [chatOpen, setChatOpen] = useState(false);

  const { filter, setFilter, search, setSearch, filtered } = useIssueFilter(
    review?.items ?? [],
  );

  const issuesRef = useRef<HTMLDivElement>(null);

  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!exportOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExportOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [exportOpen]);

  const handleDownloadMarkdown = async () => {
    setExportOpen(false);
    setDownloading(true);
    try {
      await reviewApi.downloadReport(review!.id);
    } catch {
      toast.error("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  const handleLineClick = (line: number) => {
    setHighlightLine(null);
    requestAnimationFrame(() => {
      setHighlightLine(line);
    });
  };

  useEffect(() => {
    const cached = useReviewsStore.getState().reviewCache[reviewId];
    setReview(cached ?? null);
    setLoading(!cached);
    fetchReview(!cached);
  }, [reviewId]);

  const fetchReview = async (showSkeleton: boolean) => {
    if (showSkeleton) setLoading(true);
    try {
      const data = await reviewApi.getById(reviewId);
      setReview(data.review);
      cacheReview(data.review);
    } catch (err) {
      if (showSkeleton) setReview(null);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  };

  useEffect(() => {
    if (!review) return;
    if (review.status !== "PROCESSING" && review.status !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const data = await reviewApi.getById(reviewId);
        setReview(data.review);
        cacheReview(data.review);
        if (
          data.review.status === "COMPLETED" ||
          data.review.status === "FAILED"
        ) {
          clearInterval(interval);
        }
      } catch {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [review?.status, reviewId]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
        <ReviewSkeleton />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-dark">
        <p className="text-gray-500 dark:text-gray-400">Review not found</p>
      </div>
    );
  }

  if (review.status === "PROCESSING" || review.status === "PENDING") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-surface-dark">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            AI is analyzing your code...
          </p>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This usually takes 10–30 seconds
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex justify-end gap-2 relative" ref={exportRef}>
          <button
            onClick={() => setChatOpen(true)}
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
          >
            <MessageSquare size={14} />
            Ask AI
          </button>

          <button
            onClick={() => setExportOpen((v) => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-surface-dark transition-colors"
          >
            <Download size={14} />
            Export
            <ChevronDown size={14} />
          </button>

          {exportOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg shadow-lg py-1 z-10 min-w-[160px]">
              <button
                onClick={handleDownloadMarkdown}
                disabled={downloading}
                className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark disabled:opacity-50"
              >
                <FileText size={14} />
                Markdown (.md)
              </button>
              <Link
                href={`/review/${review!.id}/report`}
                onClick={() => setExportOpen(false)}
                className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark"
              >
                <Download size={14} />
                PDF (Print)
              </Link>
            </div>
          )}
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
            {review.score !== null && <ScoreGauge score={review.score} />}
          </div>

          {review.summary && (
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-100 dark:border-border-dark pt-4">
              {review.summary}
            </p>
          )}

          {/* 👇 ДОБАВИТЬ: прогресс-бар прямо тут, внутри score-карточки */}
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

        {/* 👇 ДОБАВИТЬ: статистика — отдельным блоком между score-карточкой и Quality Gate баннером */}
        <ReviewStatsGrid
          linesAnalyzed={review.code.split("\n").length}
          durationSeconds={12.4}
          qualityScore={review.score ?? 0}
          criticalCount={
            review.items.filter(
              (i) =>
                i.type === "SECURITY" &&
                (i.severity === "CRITICAL" || i.severity === "HIGH"),
            ).length
          }
          maintainabilityIndex={Math.max(
            0,
            100 -
              review.items.filter((i) => i.type !== "SUGGESTION").length * 5,
          )}
        />

        {/* Quality Gate баннер */}
        <QualityGateBanner items={review.items} />

        <IssueFilterBar
          items={review.items}
          activeFilter={filter}
          onFilterChange={(f) => {
            setFilter(f);

            if (scrollTimeoutRef.current)
              clearTimeout(scrollTimeoutRef.current);
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
          }}
          search={search}
          onSearchChange={setSearch}
        />

        {/* Замечания */}
        <div ref={issuesRef}>
          <IssueAccordion
            items={filtered}
            onLineClick={handleLineClick}
            onItemsChange={(updatedItems) => {
              setReview((prev) => {
                if (!prev) return prev;
                const updatedMap = new Map(updatedItems.map((i) => [i.id, i]));
                const next = {
                  ...prev,
                  items: prev.items.map(
                    (item) => updatedMap.get(item.id) ?? item,
                  ),
                };
                cacheReview(next);
                return next;
              });
            }}
          />
        </div>

        <ReviewChatPanel
          reviewId={review.id}
          open={chatOpen}
          onClose={() => setChatOpen(false)}
        />
        {/* Исходный код */}
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
