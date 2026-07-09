"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { reviewApi } from "@/lib/apiClient";
import { useReviewsStore } from "@/store/reviewsStore";
import { createReviewSchema, MAX_CODE_LENGTH } from "@/lib/validation/review";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { useSubmitShortcut } from "@/hooks/useSubmitShortcut";
import { useFileImport } from "@/hooks/useFileImport";
import { detectLanguageFromContent } from "@/lib/detectLanguage";
import { LANGUAGE_EXTENSIONS } from "@/lib/languageExtensions";
import { CodeEditor } from "@/components/CodeEditor";
import { CodeToolbar } from "@/components/review/CodeToolbar";
import {
  RateLimitBanner,
  EmailVerificationBanner,
} from "@/components/review/StatusBanners";
import { Loader2, Sparkles, UploadCloud } from "lucide-react";

const REVIEWER_LEVELS = ["junior", "middle", "senior"] as const;
type ReviewerLevel = (typeof REVIEWER_LEVELS)[number];
const LANGUAGE_OPTIONS = Object.keys(LANGUAGE_EXTENSIONS);

export default function NewReviewForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("typescript");
  const [reviewerLevel, setReviewerLevel] = useState<ReviewerLevel>("junior");
  const [loading, setLoading] = useState(false);

  const addReview = useReviewsStore((state) => state.addReview);
  const setRateLimit = useReviewsStore((state) => state.setRateLimit);
  const remaining = useReviewsStore((state) => state.remaining);
  const limit = useReviewsStore((state) => state.limit);

  const { user } = useAuthStore();
  const emailNotVerified = Boolean(user && !user.emailVerified);

  const isTooLong = code.length > MAX_CODE_LENGTH;
  const limitReached = limit > 0 && remaining <= 0;

  const { isDragging, openFilePicker, dropZoneProps, fileInputProps } =
    useFileImport({
      maxCodeLength: MAX_CODE_LENGTH,
      disabled: loading,
      onFileLoaded: (text, detectedLang) => {
        setCode(text);
        if (detectedLang) setLanguage(detectedLang);
      },
    });

  const handleEditorPaste = useCallback(
    (pastedText: string) => {
      const detected = detectLanguageFromContent(pastedText);
      if (detected && detected !== language) {
        setLanguage(detected);
        toast.info(`Detected ${detected}`);
      }
    },
    [language],
  );

  const submitReview = useCallback(async () => {
    const result = createReviewSchema.safeParse({
      code,
      language,
      reviewerLevel,
    });
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
  }, [code, language, reviewerLevel, loading, addReview, router, setRateLimit]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      submitReview();
    },
    [submitReview],
  );

  useEffect(() => {
    let cancelled = false;
    reviewApi
      .getLimits()
      .then((data) => {
        if (!cancelled) setRateLimit(data.remaining, data.limit);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [setRateLimit]);

  useSubmitShortcut({
    onSubmit: submitReview,
    enabled: code.length > 0 && !loading && !isTooLong && !limitReached,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          New Review
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            {...dropZoneProps}
            className={`relative bg-white dark:bg-card-dark p-4 rounded-xl border-2 transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-gray-200 dark:border-border-dark"
            }`}
          >
            <CodeToolbar
              language={language}
              onLanguageChange={setLanguage}
              languageOptions={LANGUAGE_OPTIONS}
              reviewerLevel={reviewerLevel}
              onReviewerLevelChange={(level) =>
                setReviewerLevel(level as ReviewerLevel)
              }
              reviewerLevelOptions={REVIEWER_LEVELS}
              onChooseFile={openFilePicker}
            />

            <input
              {...fileInputProps}
              accept=".ts,.tsx,.js,.jsx,.mjs,.cjs,.py,.java,.go,.rs,.cpp,.cc,.cxx,.h,.hpp,.css,.html,.htm,.txt"
            />

            <CodeEditor
              value={code}
              onChange={setCode}
              onPaste={handleEditorPaste}
              language={language}
              disabled={loading}
              maxHeight={600}
            />

            <p
              className={`text-xs mt-1 ${isTooLong ? "text-red-500 dark:text-red-400 font-medium" : "text-gray-400 dark:text-gray-500"}`}
            >
              {code.length} / {MAX_CODE_LENGTH} characters
              {isTooLong && " - Too Long 🚫"}
            </p>

            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-blue-600/10 dark:bg-blue-500/10 rounded-xl pointer-events-none backdrop-blur-[1px]">
                <div className="flex flex-col items-center gap-2 text-blue-600 dark:text-blue-400">
                  <UploadCloud className="w-10 h-10" />
                  <span className="font-medium">Drop file to load code</span>
                </div>
              </div>
            )}
          </div>

          <RateLimitBanner remaining={remaining} limit={limit} />
          <EmailVerificationBanner show={emailNotVerified} />

          <button
            type="submit"
            disabled={
              loading ||
              code.length === 0 ||
              isTooLong ||
              emailNotVerified ||
              limitReached
            }
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>{loading ? "Analyzing..." : "Analyze Code"}</span>
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
