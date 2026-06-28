import { z } from 'zod'

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'teacher', 'student']),
})

export const createUserSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres.').max(100, 'Máximo 100 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(6, 'Mínimo 6 caracteres.'),
  role: z.enum(['admin', 'teacher', 'student']).optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres.').max(100, 'Máximo 100 caracteres.').optional(),
  email: z.string().email('E-mail inválido.').optional(),
  role: z.enum(['admin', 'teacher', 'student']).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Mínimo 6 caracteres.'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres.'),
})

export const userListQuerySchema = z.object({
  role: z.enum(['admin', 'teacher', 'student']).optional(),
})

export type User = z.infer<typeof userSchema>
export type CreateUserRequest = z.infer<typeof createUserSchema>
export type UpdateUserRequest = z.infer<typeof updateUserSchema>
export type ChangePasswordRequest = z.infer<typeof changePasswordSchema>
export type UserListQuery = z.infer<typeof userListQuerySchema>
