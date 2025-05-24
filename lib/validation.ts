import { z } from "zod"

// Input validation schemas
export const createUserSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(1).max(50).optional(),
})

export const updateUserSchema = z.object({
  username: z.string().min(1).max(50).optional(),
  email: z.string().email().optional(),
})

export const authCallbackSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  error: z.string().optional(),
})

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, "")
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function validateAndSanitizeUser(data: any) {
  const validated = createUserSchema.parse(data)
  return {
    email: validated.email ? sanitizeEmail(validated.email) : undefined,
    username: validated.username ? sanitizeString(validated.username) : undefined,
  }
}
