import { z } from 'zod'

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const refreshRequestSchema = z.object({
  refreshToken: z.string(),
})

export const refreshResponseSchema = z.object({
  accessToken: z.string(),
})

export const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordRequestSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
})

export type LoginRequest = z.infer<typeof loginRequestSchema>
export type LoginResponse = z.infer<typeof loginResponseSchema>
export type RefreshRequest = z.infer<typeof refreshRequestSchema>
export type RefreshResponse = z.infer<typeof refreshResponseSchema>
export type ForgotPasswordRequest = z.infer<typeof forgotPasswordRequestSchema>
export type ResetPasswordRequest = z.infer<typeof resetPasswordRequestSchema>
