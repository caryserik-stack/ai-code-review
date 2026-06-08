import { z } from 'zod'

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

// Review schemas
export const createReviewSchema = z.object({
  code: z.string()
    .min(1, 'Code is required')
    .max(10000, 'Code is too long (max 10000 characters)'),
  language: z.enum([
    'typescript', 'javascript', 'python',
    'java', 'go', 'rust', 'cpp', 'css', 'html'
  ], {
    errorMap: () => ({ message: 'Unsupported language' })
  }),
})