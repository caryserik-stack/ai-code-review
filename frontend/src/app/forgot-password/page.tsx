"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/apiClient";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "code" | "password" | "success">(
    "email",
  );
  const [email, setEmail] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setStep("code");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  useEffect(() => {
    const code = digits.join("");
    if (code.length === 6) {
      verifyCode(code);
    }
  }, [digits]);

  const verifyCode = async (code: string) => {
    setVerifying(true);
    setError("");
    try {
      await authApi.verifyResetCode({ email, code });
      setStep("password");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Try again.");
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token: digits.join(""), newPassword });
      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const slideVariants = {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark flex items-center justify-center relative px-4">
      <Link
        href="/login"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to login
      </Link>

      <div className="bg-white dark:bg-card-dark rounded-xl shadow-md w-full max-w-md overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Шаг 1 — Email */}
          {step === "email" && (
            <motion.div
              key="email"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="p-8"
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                <Mail size={22} className="text-blue-600 dark:text-blue-300" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Forgot password?
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                Enter your email and we'll send you a 6-digit verification code.
              </p>

              {error && (
                <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 dark:border-border-dark dark:bg-surface-dark dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Sending..." : "Send code"}
                </button>
              </form>

              <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>
          )}

          {/* Шаг 2 — Код */}
          {step === "code" && (
            <motion.div
              key="code"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="p-8"
            >
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Enter the code
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {email}
                </span>
              </p>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-lg mb-6 text-sm text-center"
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-3 justify-center mb-8">
                {digits.map((digit, index) => (
                  <motion.input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(index, e)}
                    onFocus={(e) => e.target.select()}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none dark:bg-surface-dark dark:text-gray-100 ${
                      digit
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                        : "border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-surface-dark text-gray-900"
                    } ${verifying ? "opacity-50" : ""}`}
                    disabled={verifying}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {verifying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                >
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Verifying...
                </motion.div>
              )}

              <button
                onClick={() => {
                  setStep("email");
                  setError("");
                  setDigits(["", "", "", "", "", ""]);
                }}
                className="w-full text-center text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-4 transition-colors"
              >
                Didn't receive the code? Try again
              </button>
            </motion.div>
          )}

          {/* Шаг 3 — Новый пароль */}
          {step === "password" && (
            <motion.div
              key="password"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="p-8"
            >
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                New password
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                Code verified ✓ Now set your new password.
              </p>

              {error && (
                <div className="bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full border border-gray-300 dark:border-border-dark dark:bg-surface-dark dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full border border-gray-300 dark:border-border-dark dark:bg-surface-dark dark:text-gray-100 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? "Saving..." : "Set new password"}
                </button>
              </form>
            </motion.div>
          )}

          {/* Шаг 4 — Успех */}
          {step === "success" && (
            <motion.div
              key="success"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="p-8 text-center space-y-3"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto text-3xl"
              >
                ✅
              </motion.div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Password changed!
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Your password has been successfully reset.
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Sign in
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
