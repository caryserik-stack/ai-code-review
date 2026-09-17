import { GoogleGenAI, Type } from "@google/genai";
import { OwaspCategory } from "@prisma/client";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Типы — без изменений, worker.ts на них завязан
export interface ReviewResult {
  summary: string;
  score: number;
  items: {
    type: "ERROR" | "WARNING" | "SUGGESTION" | "SECURITY";
    title: string;
    description: string;
    line?: number;
    originalCode?: string;
    suggestedCode?: string;
    owaspCategory?: OwaspCategory;
    severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }[];
}

export type ReviewerLevel = "junior" | "middle" | "senior";

export const REVIEWER_LEVEL_TO_PRISMA = {
  junior: "JUNIOR",
  middle: "MIDDLE",
  senior: "SENIOR",
} as const;

export const REVIEWER_LEVEL_FROM_PRISMA: Record<
  "JUNIOR" | "MIDDLE" | "SENIOR",
  ReviewerLevel
> = {
  JUNIOR: "junior",
  MIDDLE: "middle",
  SENIOR: "senior",
};

const OWASP_VALUES = [
  "A01_BROKEN_ACCESS_CONTROL",
  "A02_CRYPTOGRAPHIC_FAILURES",
  "A03_INJECTION",
  "A04_INSECURE_DESIGN",
  "A05_SECURITY_MISCONFIGURATION",
  "A06_VULNERABLE_COMPONENTS",
  "A07_AUTH_FAILURES",
  "A08_SOFTWARE_DATA_INTEGRITY_FAILURES",
  "A09_LOGGING_MONITORING_FAILURES",
  "A10_SSRF",
];
const SEVERITY_VALUES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TYPE_VALUES = ["ERROR", "WARNING", "SUGGESTION", "SECURITY"];

// Gemini-схема — Type.* вместо строк "string"/"object"
const REVIEW_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    score: { type: Type.INTEGER },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: TYPE_VALUES },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          line: { type: Type.INTEGER },
          originalCode: { type: Type.STRING },
          suggestedCode: { type: Type.STRING },
          owaspCategory: { type: Type.STRING, enum: OWASP_VALUES },
          severity: { type: Type.STRING, enum: SEVERITY_VALUES },
        },
        required: ["type", "title", "description"],
      },
    },
  },
  required: ["summary", "score", "items"],
};

const REVIEWER_LEVEL_PROMPT: Record<ReviewerLevel, string> = {
  junior:
    "Review as if mentoring a junior developer: explain the *why* behind each issue in plain language, favor educational SUGGESTION items, and be encouraging.",
  middle:
    "Review at a standard professional level: flag real bugs, missing validation, and style issues without excessive hand-holding.",
  senior:
    "Review with a strict senior/staff-engineer bar: focus on architecture, security boundaries, edge cases, maintainability. Be terse.",
};

export const analyzeCode = async (
  code: string,
  language: string,
  reviewerLevel: ReviewerLevel = "junior",
  customRules: string[] = [],
): Promise<ReviewResult> => {
  const rulesBlock = customRules.length
    ? `\n\nAlso enforce these team-specific rules:\n${customRules.map((r) => `- ${r}`).join("\n")}`
    : "";

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash", // проверь актуальное имя в aistudio.google.com — модели у Google обновляются часто
    contents: `You are an expert ${language} code reviewer. ${REVIEWER_LEVEL_PROMPT[reviewerLevel]}${rulesBlock}

IMPORTANT — be exhaustive, not selective:
- Go through the code line by line. Do NOT stop after finding 2-3 obvious issues.
- Explicitly check each of these categories, even if some yield nothing: logic bugs, null/undefined handling, error handling, input validation, security (injection, XSS, auth, secrets), performance, resource leaks, naming/readability, dead code, missing types, edge cases (empty input, boundary values, concurrency).
- Report EVERY issue you find, including minor style/suggestion-level ones — do not filter down to "the most important" ones.
- If the code is short, it's fine to report only what's actually there; if it's long, expect a proportionally longer list.

Rules:
- "line" is the 1-indexed line number in the code below.
- Set "owaspCategory" and "severity" ONLY when type is "SECURITY" — omit for every other type.
- Include "originalCode"/"suggestedCode" only when you have a concrete fix.

Review this ${language} code:

\`\`\`${language}
${code}
\`\`\``,
    config: {
      responseMimeType: "application/json",
      responseSchema: REVIEW_SCHEMA,
      maxOutputTokens: 8192,
      thinkingConfig: {
        thinkingBudget: 2048,
      },
    },
  });

  if (!response.text) throw new Error("AI_NO_STRUCTURED_RESPONSE");

  const result = JSON.parse(response.text) as ReviewResult;

  // Защитный пост-процессинг: DB constraint запрещает owasp/severity вне SECURITY
  result.items = result.items.map((item) =>
    item.type === "SECURITY"
      ? item
      : { ...item, owaspCategory: undefined, severity: undefined },
  );

  return result;
};
