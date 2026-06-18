"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { reviewApi } from "@/lib/apiClient";

interface ReviewItem {
  id: string;
  type: "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";
  title: string;
  description: string;
  line: number | null;
  suggestion: string | null;
}

interface Review {
  id: string;
  code: string;
  language: string;
  status: string;
  score: number | null;
  summary: string | null;
  createdAt: string;
  items: ReviewItem[];
}

export default function ReviewPage() {
  const router = useRouter();
  const params = useParams();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Цвет и иконка для типа замечания
  const getItemStyle = (type: string) => {
    switch (type) {
      case "ERROR":
        return {
          bg: "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-900",
          badge: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
          icon: "🔴",
        };
      case "WARNING":
        return {
          bg: "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-900",
          badge:
            "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
          icon: "🟡",
        };
      case "SECURITY":
        return {
          bg: "bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-900",
          badge:
            "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
          icon: "🔒",
        };
      default:
        return {
          bg: "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900",
          badge:
            "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
          icon: "💡",
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-dark">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      {/* Header */}
      <header className="bg-white dark:bg-card-dark border-b border-gray-200 dark:border-border-dark">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            AI Code Review
          </h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Score карточка */}
        <div className="bg-white dark:bg-card-dark p-6 rounded-xl border border-gray-200 dark:border-border-dark">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Language
              </p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {review.language}
              </p>
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

        {/* Замечания */}
        {review.items.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
              Issues ({review.items.length})
            </h2>
            <div className="space-y-3">
              {review.items.map((item) => {
                const style = getItemStyle(item.type);
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border ${style.bg}`}
                  >
                    <div className="flex items-start gap-3">
                      <span>{style.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}
                          >
                            {item.type}
                          </span>
                          {item.line && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Line {item.line}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {item.title}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                          {item.description}
                        </p>
                        {item.suggestion && (
                          <div className="mt-2 bg-white dark:bg-card-dark rounded-lg p-2 border border-gray-200 dark:border-border-dark">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Suggestion:
                            </p>
                            <code className="text-xs text-gray-800 dark:text-gray-200 font-mono">
                              {item.suggestion}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Исходный код */}
        <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Source Code
          </h2>
          <pre className="bg-gray-50 dark:bg-surface-dark p-3 rounded-lg text-xs font-mono overflow-x-auto text-gray-800 dark:text-gray-200">
            {review.code}
          </pre>
        </div>
      </main>
    </div>
  );
}
