"use client";

import { motion } from "framer-motion";
import { Code2 } from "lucide-react";

const LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Java",
  "Go",
  "Rust",
  "C++",
  "CSS",
  "HTML",
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function LanguagesContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Supported languages
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          AI Code Review currently supports the following languages:
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      >
        {LANGUAGES.map((lang) => (
          <motion.div
            key={lang}
            variants={item}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300"
          >
            <Code2
              size={16}
              className="text-blue-600 dark:text-blue-400 flex-shrink-0"
            />
            {lang}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
