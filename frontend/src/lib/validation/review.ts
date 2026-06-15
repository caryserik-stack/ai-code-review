import { z } from "zod";

export const MAX_CODE_LENGTH = 10000;

export const createReviewSchema = z.object({
  code: z
    .string()
    .min(1, "Enter password")
    .max(MAX_CODE_LENGTH, "The code is too long (maximum 10000 characters)"),
  language: z.enum([
    "typescript",
    "javascript",
    "python",
    "java",
    "go",
    "rust",
    "cpp",
    "css",
    "html",
  ]),
});
