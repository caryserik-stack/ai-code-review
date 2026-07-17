// Типы для результата анализа
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
  }[];
}

export type ReviewerLevel = "junior" | "middle" | "senior";

export const REVIEWER_LEVEL_TO_PRISMA = {
  junior: "JUNIOR",
  middle: "MIDDLE",
  senior: "SENIOR",
} as const;

// Наборы моковых issues под каждый уровень —
// имитируем, что junior-ревью более подробное и обучающее,
// а senior-ревью фокусируется на архитектуре и безопасности
const MOCK_ITEMS_BY_LEVEL: Record<ReviewerLevel, ReviewResult["items"]> = {
  junior: [
    {
      type: "SUGGESTION",
      title: "Add explicit type annotation",
      description:
        "In TypeScript, explicitly typing variables (instead of relying on inference) makes your code easier to read for other developers, and catches mistakes earlier.",
      line: 1,
      originalCode: "const x: number = 1",
      suggestedCode: "const x: number = 1",
    },
    {
      type: "WARNING",
      title: "Unused variable",
      description:
        'Variable "x" is declared but never used anywhere else in the code. Unused variables often signal leftover debug code or a forgotten step — consider removing it or double-checking your logic.',
      line: 1,
    },
    {
      type: "SUGGESTION",
      title: "Consider adding a comment",
      description:
        "A short comment explaining what this function does would help future readers (including future you!) understand the intent faster.",
      line: 1,
    },
  ],
  middle: [
    {
      type: "SUGGESTION",
      title: "Add explicit type annotation",
      description:
        "Variable declarations should have explicit types in TypeScript",
      line: 1,
      originalCode: "const x = 1",
      suggestedCode: "const x: number = 1",
    },
    {
      type: "WARNING",
      title: "Unused variable",
      description: "Variable x is declared but never used",
      line: 1,
    },
    {
      type: "SECURITY",
      title: "No input validation",
      description: "Consider validating inputs before processing",
      line: 1,
      suggestedCode: "if (!input) throw new Error('Input is required');",
    },
  ],
  senior: [
    {
      type: "SECURITY",
      title: "Missing input validation at boundary",
      description:
        "No validation at the function entry point. In production, unvalidated input at API boundaries is a common source of injection and type-confusion bugs.",
      line: 1,
      suggestedCode: "const parsed = schema.parse(input);",
    },
    {
      type: "ERROR",
      title: "Unhandled edge case",
      description:
        "No handling for empty/null input. Under concurrent load or malformed upstream data, this will throw and potentially crash the request handler.",
      line: 1,
    },
    {
      type: "SUGGESTION",
      title: "Consider extracting to a pure function",
      description:
        "Side-effect-free logic here would improve testability and make this safe to memoize if called on a hot path.",
      line: 1,
    },
  ],
};

const MOCK_SCORE_BY_LEVEL: Record<ReviewerLevel, number> = {
  junior: 78, // мягче — фокус на обучении, не на идеальности
  middle: 72,
  senior: 61, // строже — выше планка ожиданий
};

// Mock версия — имитирует ответ Claude
// Когда получишь API ключ — заменим на реальный вызов
export const analyzeCode = async (
  code: string,
  language: string,
  reviewerLevel: ReviewerLevel = "junior",
  customRules: string[] = [],
): Promise<ReviewResult> => {
  // Имитируем задержку AI (1 секунда)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    summary:
      customRules.length > 0
        ? `Mock ${reviewerLevel}-level analysis of ${language} code, checked against ${customRules.length} custom team rule(s). ${code.length} characters analyzed.`
        : `Mock ${reviewerLevel}-level analysis of ${language} code. ${code.length} characters analyzed.`,
    score: MOCK_SCORE_BY_LEVEL[reviewerLevel],
    items: MOCK_ITEMS_BY_LEVEL[reviewerLevel],
  };
};
