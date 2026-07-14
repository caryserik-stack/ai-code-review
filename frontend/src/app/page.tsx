"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ReviewSkeleton } from "@/components/skeletons/ReviewSkeleton";

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const FEATURES = [
  {
    title: "Bug detection",
    description:
      "Catches logic errors and edge cases before they reach production.",
  },
  {
    title: "Security checks",
    description: "Flags SQL injection, XSS and other common vulnerabilities.",
  },
  {
    title: "Instant results",
    description: "Get a scored, detailed review in seconds, not days.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, loading, fetchMe } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!loading) {
      setChecked(true);
      if (user) {
        router.push("/review/new");
      }
    }
  }, [user, loading, router]);

  if (!checked || user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
        <ReviewSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <nav className="border-b border-gray-200 dark:border-border-dark">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <span className="font-bold text-gray-900 dark:text-gray-100">
            AI Code Review
          </span>
          <div className="flex items-center gap-4 text-sm">
            <a
              href="#features"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors hidden sm:inline"
            >
              Features
            </a>
            <Link
              href="/docs"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors hidden sm:inline"
            >
              Docs
            </Link>
            <ThemeToggle />
            <Link
              href="/login"
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="max-w-2xl mx-auto px-4 pt-20 pb-16 text-center"
      >
        <motion.span
          variants={item}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-block text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-full mb-4"
        >
          AI-powered analysis
        </motion.span>

        <motion.h1
          variants={item}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-gray-100 leading-tight"
        >
          Ship cleaner code,
          <br />
          faster reviews
        </motion.h1>

        <motion.p
          variants={item}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-4 text-gray-600 dark:text-gray-400"
        >
          Paste your code, get instant AI feedback on bugs, security issues and
          style — before your team sees it.
        </motion.p>

        <motion.div
          variants={item}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-8 flex gap-3 justify-center"
        >
          <Link
            href="/register"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Get started free
          </Link>
          <Link
            href="/login"
            className="border border-gray-300 dark:border-border-dark text-gray-900 dark:text-gray-100 px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-card-dark transition-colors"
          >
            Sign in
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        id="features"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        className="max-w-4xl mx-auto px-4 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        {FEATURES.map((feature) => (
          <motion.div
            key={feature.title}
            variants={item}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-5"
          >
            <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              {feature.title}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
