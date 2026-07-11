"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { reviewApi } from "@/lib/apiClient";
import { ReviewSkeleton } from "@/components/skeletons/ReviewSkeleton";
import { CodeBlock } from "@/components/CodeBlock";
import { IssueAccordion } from "@/components/review/IssueAccordion";
import { QualityGateBanner } from "@/components/review/QualityGateBanner";

interface ReviewItem {
  id: string;
  type: "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";
  title: string;
  description: string;
  line: number | null;
  originalCode: string | null;
  suggestedCode: string | null;
  resolved: boolean;
}

interface Review {
  id: string;
  code: string;
  language: string;
  revewerLevel: string;
  status: string;
  score: number | null;
  summary: string | null;
  createdAt: string;
  items: ReviewItem[];
}

export default function ReviewPage() {
  const params = useParams();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightLine, setHighlightLine] = useState<number | null>(null);

  const handleLineClick = (line: number) => {
    setHighlightLine(null);
    requestAnimationFrame(() => {
      setHighlightLine(line);
    });
  };

  useEffect(() => {
    fetchReview();
  }, [params.id]);

  const fetchReview = async () => {
    setLoading(true);
    try {
      const data = await reviewApi.getById(params.id as string);
      setReview(data.review);
    } catch (err) {
      setReview(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!review) return;
    if (review.status !== "PROCESSING" && review.status !== "PENDING") return;

    const interval = setInterval(async () => {
      try {
        const data = await reviewApi.getById(params.id as string);
        setReview(data.review);
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
  }, [review?.status, params.id]);

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

            {review.score !== null && (
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Score
                </p>
                <p
                  className={`text-3xl font-bold ${getScoreColor(review.score)}`}
                >
                  {review.score}/100
                </p>
              </div>
            )}
          </div>
          {review.summary && (
            <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm border-t border-gray-100 dark:border-border-dark pt-4">
              {review.summary}
            </p>
          )}
        </div>

        {/* Quality Gate баннер */}
        <QualityGateBanner items={review.items} />

        {/* Замечания */}
        <IssueAccordion
          items={review.items}
          onLineClick={handleLineClick}
          onItemsChange={(updatedItems) => {
            setReview((prev) =>
              prev ? { ...prev, items: updatedItems } : prev,
            );
          }}
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
            onHighlightDone={() => setHighlightLine(null)}
          />
        </div>
      </main>
    </div>
  );
}
