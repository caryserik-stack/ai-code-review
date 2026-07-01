"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/apiClient";
import { useAuthStore } from "@/store/authStore";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, setUser, logout } = useAuthStore();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyedRef = useRef(false);
  const searchParams = useSearchParams();

  const fromReview = searchParams.get("from") === "review";

  const handleBack = async () => {
    if (fromReview) {
      router.push("/review/new");
      return;
    } else {
      await logout();
      router.push("/login");
    }
  };

  useEffect(() => {
    if (user?.emailVerified) {
      router.push("/review/new");
    }
  }, [user, router]);

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];

    if (value.length > 1) {
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      const split = pasted.split("");
      const filled = [...digits];
      split.forEach((d, i) => {
        if (i < 6) filled[i] = d;
      });
      setDigits(filled);
      const nextEmpty = filled.findIndex((d) => d === "");
      inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
      return;
    }

    newDigits[index] = value;
    setDigits(newDigits);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyCode = useCallback(
    async (code: string) => {
      if (verifyedRef.current) return;
      setVerifying(true);
      try {
        await authApi.verifyEmail({ code });
        verifyedRef.current = true;
        if (user) setUser({ ...user, emailVerified: true });
        toast.success("Email verified!");
        router.push("/review/new");
      } catch (err) {
        const raw = err instanceof Error ? err.message : "INVALID_CODE";
        const messages: Record<string, string> = {
          INVALID_CODE: "Invalid code. Please try again.",
          CODE_EXPIRED: "Code expired. Please request a new one.",
        };
        toast.error(messages[raw] ?? "Something went wrong");
        setDigits(["", "", "", "", "", ""]);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } finally {
        setVerifying(false);
      }
    },
    [user, setUser, router],
  );

  useEffect(() => {
    const code = digits.join("");
    if (code.length === 6) verifyCode(code);
  }, [digits, verifyCode]);

  const handleResend = async () => {
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success("Code resent");
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-surface-dark px-4">
      <button
        onClick={handleBack}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft size={16} />
        {fromReview ? "Back" : "Back to login"}
      </button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-card-dark rounded-xl shadow-md w-full max-w-md p-8"
      >
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
          <Mail size={22} className="text-blue-600 dark:text-blue-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Verify your email
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
          We sent a 6-digit code to{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {user?.email}
          </span>
        </p>

        <div className="flex gap-3 justify-center mb-8">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onFocus={(e) => e.target.select()}
              disabled={verifying}
              autoFocus={index === 0}
              className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none dark:bg-surface-dark dark:text-gray-100 ${
                digit
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark"
              } ${verifying ? "opacity-50" : ""}`}
            />
          ))}
        </div>

        {verifying && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Verifying...
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={resending}
          className="w-full text-center text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
        >
          {resending ? "Sending..." : "Didn't receive the code? Resend"}
        </button>
      </motion.div>
    </div>
  );
}
