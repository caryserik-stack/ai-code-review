"use client";

import { motion } from "framer-motion";

const ISSUE_TYPES = [
  {
    label: "Error",
    color: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
    description:
      "A bug or logic issue that is likely to cause incorrect behavior.",
  },
  {
    label: "Warning",
    color:
      "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
    description: "Something that works, but could lead to problems later.",
  },
  {
    label: "Security",
    color:
      "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    description:
      "A potential vulnerability, such as injection or unsafe input handling.",
  },
  {
    label: "Suggestion",
    color: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    description: "A style or best-practice improvement.",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function ResultsContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Understanding results
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Each review gets a score from 0 to 100, plus a list of issues found in
          your code. Every issue has one of the following types:
        </p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {ISSUE_TYPES.map((type) => (
          <motion.div
            key={type.label}
            variants={item}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-3 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg p-3"
          >
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${type.color}`}
            >
              {type.label}
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {type.description}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
