"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewApi } from "@/lib/apiClient";
import { useReviewsStore } from "@/store/reviewsStore";
import { createReviewSchema, MAX_CODE_LENGTH } from "@/lib/validation/review";

const LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "java",
  "go",
  "rust",
  "cpp",
  "css",
  "html",
];

export default function NewReviewPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const addReview = useReviewsStore((state) => state.addReview);

  const isTooLong = code.length > MAX_CODE_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = createReviewSchema.safeParse({ code, language });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    try {
      const data = await reviewApi.create(result.data);
      addReview({
        id: data.review.id,
        language: data.review.language,
        createdAt: data.review.createdAt,
      });
      router.push(`/review/${data.review.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          New Review
        </h2>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Выбор языка */}
          <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-gray-300 dark:border-border-dark dark:bg-surface-dark dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          {/* Код */}
          <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Code
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 font-mono text-sm border border-gray-300 dark:border-border-dark dark:bg-surface-dark dark:text-gray-100 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Paste your code here..."
              required
            />
            <p
              className={`text-xs mt-1 ${isTooLong ? "text-red-500 dark:text-red-400 font-medium" : "text-gray-400 dark:text-gray-500"}`}
            >
              {code.length} / {MAX_CODE_LENGTH} characters
              {isTooLong && "- Too Long 🚫"}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || code.length === 0 || isTooLong}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "🤖 Analyzing..." : "🚀 Analyze Code"}
          </button>
        </form>
      </main>
    </div>
  );
}
