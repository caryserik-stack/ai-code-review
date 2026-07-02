"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reviewApi } from "@/lib/apiClient";
import { useReviewsStore } from "@/store/reviewsStore";
import { createReviewSchema, MAX_CODE_LENGTH } from "@/lib/validation/review";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useSubmitShortcut } from "@/hooks/useSubmitShortcut";

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

export default function NewReviewForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [loading, setLoading] = useState(false);
  const addReview = useReviewsStore((state) => state.addReview);
  const setRateLimit = useReviewsStore((state) => state.setRateLimit);
  const remaining = useReviewsStore((state) => state.remaining);
  const limit = useReviewsStore((state) => state.limit);

  const { user } = useAuthStore();
  const emailNotVerified = user && !user.emailVerified;

  const isTooLong = code.length > MAX_CODE_LENGTH;

  const submitReview = useCallback(async () => {
    const result = createReviewSchema.safeParse({ code, language });
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      const data = await reviewApi.create(result.data);
      addReview({
        id: data.review.id,
        language: data.review.language,
        createdAt: data.review.createdAt,
      });

      if (data.remaining !== -1) {
        setRateLimit(data.remaining, data.limit);
      }

      toast.success("Review created");
      router.push(`/review/${data.review.id}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Network error. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [code, language, loading, addReview, router]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submitReview();
    },
    [submitReview],
  );

  useEffect(() => {
    reviewApi
      .getLimits()
      .then((data) => {
        setRateLimit(data.remaining, data.limit);
      })
      .catch(() => {});
  }, []);

  useSubmitShortcut({
    onSubmit: submitReview,
    enabled: code.length > 0 && !loading && !isTooLong,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          New Review
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Выбор языка */}
          <fieldset className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Language
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    language === lang
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-surface-dark text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-border-dark"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Код */}
          <div className="bg-white dark:bg-card-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark">
            <label
              htmlFor="code-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Your Code
            </label>
            <textarea
              id="code-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
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

          {limit > 0 && (
            <div
              className={`flex items-center justify-between text-xs px-1 ${
                remaining <= 2
                  ? "text-red-500 dark:text-red-400"
                  : remaining <= 5
                    ? "text-yellow-500 dark:text-yellow-400"
                    : "text-gray-400 dark:text-gray-500"
              }`}
            >
              <span>
                {remaining <= 0
                  ? "⛔ Review limit reached for this hour"
                  : `${remaining} of ${limit} reviews remaining this hour`}
              </span>
              {remaining <= 2 && remaining > 0 && <span>⚠️</span>}
            </div>
          )}

          {emailNotVerified && (
            <div className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 p-3 rounded-lg text-sm flex items-center justify-between">
              <span>Please verify your email to create reviews</span>
              <Link
                href="/verify-email?from=review"
                className="underline font-medium"
              >
                Verify now
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading || code.length === 0 || isTooLong || emailNotVerified
            }
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <span>{loading ? "🤖 Analyzing..." : "🚀 Analyze Code"}</span>
            {!loading && (
              <span className="text-xs opacity-60 hidden sm:inline">
                Ctrl+Enter
              </span>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
