import { z } from "zod";

export const MAX_CODE_LENGTH = 10000;

export const REVIEWER_LEVELS = ["junior", "middle", "senior"] as const;

export const createReviewSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(MAX_CODE_LENGTH, "The code is too long (maximum 10000 characters)"),
  language: z.enum(
    [
      "typescript",
      "javascript",
      "python",
      "java",
      "go",
      "rust",
      "cpp",
      "css",
      "html",
    ],
    {
      errorMap: () => ({ message: "Unsupported language" }),
    },
  ),
  reviewerLevel: z
    .enum(REVIEWER_LEVELS, {
      errorMap: () => ({ message: "Invalid reviewer level" }),
    })
    .default("middle"),
});
