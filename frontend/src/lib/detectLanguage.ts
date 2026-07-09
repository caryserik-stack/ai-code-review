type LanguagePattern = {
  regex: RegExp;
  weight: number;
};

// Паттерны только под ваши 9 языков — при расширении списка добавляйте сюда же
const LANGUAGE_PATTERNS: Record<string, LanguagePattern[]> = {
  python: [
    { regex: /^\s*def\s+\w+\s*\(.*\)\s*:/m, weight: 3 },
    { regex: /^\s*from\s+\w+\s+import/m, weight: 2 },
    { regex: /^\s*import\s+\w+$/m, weight: 1 },
    { regex: /self\./g, weight: 1 },
  ],
  rust: [
    { regex: /^\s*fn\s+\w+\s*\(/m, weight: 3 },
    { regex: /let\s+mut\s+/, weight: 2 },
    { regex: /^\s*impl\s+/m, weight: 2 },
    { regex: /->\s*\w+\s*\{/, weight: 1 },
  ],
  go: [
    { regex: /^\s*package\s+\w+/m, weight: 3 },
    { regex: /^\s*func\s+\w+\s*\(/m, weight: 2 },
    { regex: /:=\s/, weight: 2 },
  ],
  java: [
    { regex: /public\s+(static\s+)?class\s+\w+/, weight: 3 },
    { regex: /public\s+static\s+void\s+main/, weight: 3 },
    { regex: /System\.out\.println/, weight: 2 },
  ],
  typescript: [
    { regex: /^\s*interface\s+\w+/m, weight: 3 },
    { regex: /^\s*export\s+(type|interface)\s+/m, weight: 2 },
    { regex: /:\s*(string|number|boolean|void)\b/, weight: 2 },
  ],
  javascript: [
    { regex: /^\s*(const|let)\s+\w+\s*=\s*require\(/m, weight: 2 },
    { regex: /=>\s*\{/, weight: 1 },
    { regex: /^\s*function\s+\w+\s*\(/m, weight: 1 },
  ],
  cpp: [
    { regex: /#include\s*<\w+>/, weight: 3 },
    { regex: /std::/, weight: 2 },
    { regex: /int\s+main\s*\(/, weight: 2 },
  ],
  css: [
    { regex: /[.#][\w-]+\s*\{[^}]*:/m, weight: 3 },
    { regex: /@media\s*\(/, weight: 2 },
  ],
  html: [
    { regex: /<!DOCTYPE/i, weight: 3 },
    { regex: /<\/?[a-z]+[^>]*>/i, weight: 2 },
  ],
};

/**
 * Определяет язык по содержимому текста.
 * Возвращает null, если уверенность слишком низкая — лучше не угадывать,
 * чем ошибочно переключить язык на короткий/неоднозначный фрагмент.
 */
export function detectLanguageFromContent(code: string): string | null {
  if (code.trim().length < 10) return null;

  const scores: Record<string, number> = {};

  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    let score = 0;
    for (const { regex, weight } of patterns) {
      if (code.match(regex)) score += weight;
    }
    scores[lang] = score;
  }

  // TS и JS паттерны пересекаются — если есть сигнал по TS, не даём JS его перебить
  if (scores.typescript > 0) {
    scores.javascript = 0;
  }

  const [topLang, topScore] = Object.entries(scores).sort(
    (a, b) => b[1] - a[1],
  )[0];

  return topScore >= 2 ? topLang : null;
}
