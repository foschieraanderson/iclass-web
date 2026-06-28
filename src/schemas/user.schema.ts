import { z } from 'zod'

export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['admin', 'teacher', 'student']),
})

export type User = z.infer<typeof userSchema>
