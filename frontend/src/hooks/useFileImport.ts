"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

// Расширение файла -> язык (ключи должны совпадать с вашим массивом LANGUAGES)
export const EXT_TO_LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  java: "java",
  go: "go",
  rs: "rust",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  h: "cpp",
  hpp: "cpp",
  css: "css",
  html: "html",
  htm: "html",
};

// Расширения, которые точно не текстовый код
const BLOCKED_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "ico",
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
  "pdf",
  "doc",
  "docx",
  "exe",
  "dll",
]);

const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1 MB

type UseFileImportOptions = {
  maxCodeLength: number;
  disabled?: boolean; // например, когда loading === true
  onFileLoaded: (code: string, detectedLanguage: string | null) => void;
};

/**
 * Инкапсулирует всю логику drag&drop + "выбрать файл" для загрузки кода.
 * Возвращает готовые пропсы для навешивания на контейнер и на скрытый input.
 */
export function useFileImport({
  maxCodeLength,
  disabled = false,
  onFileLoaded,
}: UseFileImportOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

      if (BLOCKED_EXTENSIONS.has(ext)) {
        toast.error(`The .${ext} file does not look like source code.`);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(
          `File is too large (${(file.size / 1024).toFixed(0)} KB). Maximum ${MAX_FILE_SIZE_BYTES / 1024} KB allowed.`,
        );
        return;
      }

      file
        .text()
        .then((text) => {
          if (text.length > maxCodeLength) {
            toast.error(
              `The code exceeds the limit of ${maxCodeLength} characters — shorten it manually.`,
            );
          }

          const detectedLang = EXT_TO_LANG[ext] ?? null;
          if (!detectedLang) {
            toast.info(
              `Language not determined by extension .${ext}; please select manually.`,
            );
          }

          onFileLoaded(text, detectedLang);
        })
        .catch(() => {
          toast.error(
            "Could not read the file — it might be a binary file.",
          );
        });
    },
    [maxCodeLength, onFileLoaded],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      dragCounter.current += 1;
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      if (files.length > 1) {
        toast.info("Можно загрузить только один файл — берём первый");
      }

      processFile(files[0]);
    },
    [disabled, processFile],
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      e.target.value = "";
    },
    [processFile],
  );

  return {
    isDragging,
    fileInputRef,
    openFilePicker,
    // навешивается на контейнер вокруг textarea/редактора
    dropZoneProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    // навешивается на сам <input type="file" />
    fileInputProps: {
      ref: fileInputRef,
      type: "file" as const,
      onChange: handleFileInputChange,
      className: "hidden",
    },
  };
}
