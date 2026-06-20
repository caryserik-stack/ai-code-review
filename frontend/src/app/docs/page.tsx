"use client";

import { motion } from "framer-motion";

const STEPS = [
  {
    title: "Create an account",
    description:
      "Sign up with your email and password. No credit card required.",
  },
  {
    title: "Paste your code",
    description:
      "Choose your language, paste up to 10,000 characters, and hit Analyze.",
  },
  {
    title: "Review the results",
    description: "Get a score and a list of issues, each with a suggested fix.",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

export default function GettingStartedPage() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={item} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Getting started
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          AI Code Review analyzes your code and gives you instant, structured
          feedback — bugs, security issues, and style suggestions, scored out of
          100.
        </p>
      </motion.div>

      <div className="space-y-4">
        {STEPS.map((step, index) => (
          <motion.div
            key={step.title}
            variants={item}
            transition={{ duration: 0.3 }}
            className="flex gap-4 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-xl p-4"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {step.title}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
