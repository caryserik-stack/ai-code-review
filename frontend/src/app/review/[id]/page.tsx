"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

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
  }, []);

  const fetchReview = async () => {
    try {
      const response = await fetch(
        `http://localhost:4000/api/reviews/${params.id}`,
        { credentials: "include" },
      );

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();
      setReview(data.review);
    } finally {
      setLoading(false);
    }
  };

  // Цвет и иконка для типа замечания
  const getItemStyle = (type: string) => {
    switch (type) {
      case "ERROR":
        return {
          bg: "bg-red-50 border-red-200",
          badge: "bg-red-100 text-red-700",
          icon: "🔴",
        };
      case "WARNING":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          badge: "bg-yellow-100 text-yellow-700",
          icon: "🟡",
        };
      case "SECURITY":
        return {
          bg: "bg-purple-50 border-purple-200",
          badge: "bg-purple-100 text-purple-700",
          icon: "🔒",
        };
      default:
        return {
          bg: "bg-blue-50 border-blue-200",
          badge: "bg-blue-100 text-blue-700",
          icon: "💡",
        };
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Review not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">AI Code Review</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-gray-500 text-sm hover:text-gray-700"
          >
            ← Back to Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Score карточка */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Language</p>
              <p className="font-medium text-gray-900">{review.language}</p>
            </div>
            {review.score !== null && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Score</p>
                <p
                  className={`text-3xl font-bold ${getScoreColor(review.score)}`}
                >
                  {review.score}/100
                </p>
              </div>
            )}
          </div>

          {review.summary && (
            <p className="mt-4 text-gray-600 text-sm border-t border-gray-100 pt-4">
              {review.summary}
            </p>
          )}
        </div>

        {/* Замечания */}
        {review.items.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-3">
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
                            <span className="text-xs text-gray-400">
                              Line {item.line}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 text-sm">
                          {item.title}
                        </p>
                        <p className="text-gray-600 text-sm mt-1">
                          {item.description}
                        </p>
                        {item.suggestion && (
                          <div className="mt-2 bg-white rounded-lg p-2 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">
                              Suggestion:
                            </p>
                            <code className="text-xs text-gray-800 font-mono">
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
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Source Code
          </h2>
          <pre className="bg-gray-50 p-3 rounded-lg text-xs font-mono overflow-x-auto text-gray-800">
            {review.code}
          </pre>
        </div>
      </main>
    </div>
  );
}
