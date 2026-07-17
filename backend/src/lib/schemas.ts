import { z } from "zod";

export const MAX_RULES = 20;
export const MAX_RULE_LENGTH = 200;

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const REVIEWER_LEVELS = ["junior", "middle", "senior"] as const;

// Review schemas
export const createReviewSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .max(10000, "Code is too long (max 10000 characters)"),
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
    .default("junior"),
});

export const toggleResolvedSchema = z.object({
  resolved: z.boolean(),
});

export const teamProfileSchema = z.object({
  rules: z
    .array(
      z
        .string()
        .min(1, "Rule cannot be empty")
        .max(MAX_RULE_LENGTH, `Rule too long (max ${MAX_RULE_LENGTH} chars)`),
    )
    .max(MAX_RULES, `Too many rules (max ${MAX_RULES})`),
});
