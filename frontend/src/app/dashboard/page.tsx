"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Загружаем список ревью при открытии страницы
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/reviews", {
        credentials: "include",
      });

      // Не авторизован → на логин
      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const data = await response.json();
      setReviews(data.reviews);
    } catch (err) {
      setError("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("http://localhost:4000/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  };

  // Цвет статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-700";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-700";
      case "FAILED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Цвет score
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">AI Code Review</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/review/new")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              New Review
            </button>
            <button
              onClick={handleLogout}
              className="text-gray-500 px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Reviews</h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Пустое состояние */}
        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-400 text-lg">No reviews yet</p>
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
              <div
                key={review.id}
                onClick={() => router.push(`/review/${review.id}`)}
                className="bg-white p-4 rounded-xl border border-gray-200 hover:border-blue-300 cursor-pointer transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {review.language}
                    </span>
                    {review.summary && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
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
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
