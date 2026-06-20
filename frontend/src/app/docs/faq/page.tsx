"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const FAQ = [
  {
    question: "Is my code stored or shared?",
    answer:
      "Your code is stored privately under your account and is never shared with other users.",
  },
  {
    question: "What's the maximum code length?",
    answer: "You can submit up to 10,000 characters per review.",
  },
  {
    question: "Can I delete a review?",
    answer: "Review deletion is not yet available, but it's on our roadmap.",
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        FAQ
      </h1>

      <div className="space-y-2">
        {FAQ.map((faqItem, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faqItem.question}
              className="bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex justify-between items-center px-4 py-3 text-left"
              >
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {faqItem.question}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-400 dark:text-gray-500 flex-shrink-0 ml-2"
                >
                  <ChevronDown size={16} />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 pb-3 text-sm text-gray-500 dark:text-gray-400">
                      {faqItem.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
