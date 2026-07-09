import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { StreamLanguage } from "@codemirror/language";
import { rust } from "@codemirror/legacy-modes/mode/rust";
import { go } from "@codemirror/legacy-modes/mode/go";
import type { Extension } from "@codemirror/state";

// Ключи должны совпадать с вашим массивом LANGUAGES / EXT_TO_LANG
export const LANGUAGE_EXTENSIONS: Record<string, () => Extension> = {
  typescript: () => javascript({ typescript: true }),
  javascript: () => javascript(),
  python: () => python(),
  java: () => java(),
  cpp: () => cpp(),
  css: () => css(),
  html: () => html(),
  // legacy-modes дают только токенизацию (без AST), но для подсветки этого достаточно
  rust: () => StreamLanguage.define(rust),
  go: () => StreamLanguage.define(go),
};

export function getLanguageExtension(language: string): Extension {
  const factory = LANGUAGE_EXTENSIONS[language];
  return factory ? factory() : [];
}