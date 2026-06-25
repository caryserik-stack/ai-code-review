"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { useTheme } from "next-themes";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language: string;
}

const LANGUAGE_MAP: Record<string, string> = {
  typescript: "typescript",
  javascript: "javascript",
  python: "python",
  java: "java",
  go: "go",
  rust: "rust",
  cpp: "cpp",
  css: "css",
  html: "html",
};

export function CodeBlock({ code, language }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const lang = LANGUAGE_MAP[language] ?? "typescript";
    const theme = resolvedTheme === "dark" ? "github-dark" : "github-light";

    codeToHtml(code, { lang, theme })
      .then(setHtml)
      .catch(() => setHtml(""));
  }, [code, language, resolvedTheme, mounted]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      {/* Кнопка Copy — снаружи от dangerouslySetInnerHTML */}
      <div className="absolute top-3 right-3 z-10">
        <button
          onClick={handleCopy}
          className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1.5 shadow-sm transition-colors"
          aria-label="Copy code"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Блок с подсветкой — отдельный контейнер */}
      {html ? (
        <div
          className="rounded-lg overflow-x-auto text-xs [&>pre]:p-4 [&>pre]:m-0 [&>pre]:rounded-lg [&>pre]:pr-20"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="bg-gray-50 dark:bg-surface-dark p-4 rounded-lg text-xs font-mono overflow-x-auto text-gray-800 dark:text-gray-200 pr-20">
          {code}
        </pre>
      )}
    </div>
  );
}
