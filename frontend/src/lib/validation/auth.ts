import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, "The name must be shorter than 2 characters"),
  email: z.string().email("Enter a correct email"),
  password: z.string().min(8, "The password must be at least 8 characters long.")
})

export const loginSchema = z.object({
  email: z.string().email("Enter a correct email"),
  password: z.string().min(1, "Enter password"),
})


