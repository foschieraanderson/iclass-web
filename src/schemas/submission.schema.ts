import { z } from 'zod'

export const submissionSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  studentId: z.string().uuid(),
  textAnswer: z.string().nullable(),
  fileUrl: z.string().nullable(),
  grade: z.number().nullable(),
  feedback: z.string().nullable(),
  gradedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  task: z.object({
    id: z.string(),
    title: z.string(),
    score: z.number(),
    expiresAt: z.string().nullable(),
    class: z.object({ id: z.string(), code: z.string() }),
  }),
  student: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
  }),
})

export const gradeSubmissionSchema = z.object({
  grade: z
    .number()
    .int('Deve ser um número inteiro.')
    .min(0, 'Mínimo 0.')
    .max(100, 'Máximo 100.'),
  feedback: z.string().optional(),
})

export function createGradeSchema(maxScore: number) {
  return z.object({
    grade: z
      .number()
      .int('Deve ser um número inteiro.')
      .min(0, 'Mínimo 0.')
      .max(maxScore, `Máximo ${maxScore}.`),
    feedback: z.string().optional(),
  })
}

export type Submission = z.infer<typeof submissionSchema>
export type GradeSubmissionRequest = z.infer<typeof gradeSubmissionSchema>
