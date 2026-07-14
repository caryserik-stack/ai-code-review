"use client";

import { useEffect, useRef, useState } from "react";
import { codeToHtml } from "shiki";
import { useTheme } from "next-themes";
import { Copy, Check } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language: string;
  highlightLine?: number | null;
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

// Shiki оборачивает каждую строку в <span class="line">...</span>.
// Добавляем id="code-line-N" на каждую, чтобы потом находить строку
// через document.getElementById и скроллить/подсвечивать её.
// Регулярка использует replace с функцией-счётчиком — Shiki не проставляет
// номера строк сам, приходится считать по порядку вхождений.
function addLineIds(html: string): string {
  let lineNumber = 0;
  return html.replace(/<span class="line">/g, () => {
    lineNumber += 1;
    return `<span class="line" id="code-line-${lineNumber}">`;
  });
}

export function CodeBlock({ code, language, highlightLine }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const lang = LANGUAGE_MAP[language] ?? "typescript";
    const theme = resolvedTheme === "dark" ? "github-dark" : "github-light";

    codeToHtml(code, { lang, theme })
      .then((result) => setHtml(addLineIds(result)))
      .catch(() => setHtml(""));
  }, [code, language, resolvedTheme, mounted]);

  // Реагируем на изменение highlightLine — скроллим к строке и подсвечиваем её
  // временным фоном. Не используем CSS-класс через Tailwind, потому что
  // подсвечиваемый span находится внутри dangerouslySetInnerHTML — Tailwind
  // не может применить conditional-класс к динамически вставленному узлу,
  // поэтому стиль ставим напрямую через DOM API.
  useEffect(() => {
    if (!highlightLine || !containerRef.current) return;

    const lineEl = containerRef.current.querySelector<HTMLElement>(
      `#code-line-${highlightLine}`,
    );
    if (!lineEl) return;

    lineEl.scrollIntoView({ behavior: "smooth", block: "center" });

    lineEl.style.transition = "background-color 0.3s ease";
    lineEl.style.backgroundColor = resolvedTheme === "dark"
      ? "rgba(250, 204, 21, 0.15)"
      : "rgba(250, 204, 21, 0.25)";

    const timeout = setTimeout(() => {
      lineEl.style.backgroundColor = "transparent";
    }, 2000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightLine]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
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

      {html ? (
        <div
          ref={containerRef}
          className="rounded-lg overflow-x-auto text-xs [&>pre]:p-4 [&>pre]:m-0 [&>pre]:rounded-lg [&>pre]:pr-20 [&_.line]:block [&_.line]:px-2 [&_.line]:-mx-2 [&_.line]:rounded"
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