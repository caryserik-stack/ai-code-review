"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { reviewApi } from "@/lib/apiClient";
import { ThemeToggle } from "@/components/ThemeToggle";

// Тип для Review
interface Review {
  id: string;
  language: string;
  status: string;
  score: number | null;
  summary: string | null;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState("");

  const { user, fetchMe, logout, loading } = useAuthStore();

  // Загружаем список ревью при открытии страницы
  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!loading && user) {
      fetchReviews();
    }

    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading]);

  const fetchReviews = async () => {
    try {
      const data = await reviewApi.getAll();
      setReviews(data.reviews ?? []);
    } catch (err) {
      setError("Failed to load reviews");
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Цвет статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400";
      case "PROCESSING":
        return "bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400";
      case "FAILED":
        return "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300";
    }
  };

  // Цвет score
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading || reviewsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-dark">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
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
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/review/new")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              New Review
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-500 dark:text-gray-400 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-surface-dark transition-colors"
            >
              Logout
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Your Reviews</h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Пустое состояние */}
        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-border-dark">
            <p className="text-gray-400 dark:text-gray-500 text-lg">
              No reviews yet
            </p>
            <button
              onClick={() => router.push("/review/new")}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Create your first review
            </button>
          </div>
        ) : (
          // Список ревью
          <div className="space-y-3">
            {reviews.map((review) => (
              <Link
                key={review.id}
                href={`/review/${review.id}`}
                className="block bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {review.language}
                    </span>
                    {review.summary && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                        {review.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {review.score !== null && (
                      <span
                        className={`font-bold ${getScoreColor(review.score)}`}
                      >
                        {review.score}/100
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(review.status)}`}
                    >
                      {review.status}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
