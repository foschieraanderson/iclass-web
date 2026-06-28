import { z } from 'zod'

export const classReportSchema = z.object({
  classId: z.string().uuid(),
  classCode: z.string(),
  tasks: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      score: z.number(),
    }),
  ),
  students: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string(),
      submissions: z.array(
        z.object({
          taskId: z.string().uuid(),
          submitted: z.boolean(),
          grade: z.number().nullable(),
          gradedAt: z.string().nullable(),
        }),
      ),
      totalEarned: z.number(),
      totalPossible: z.number(),
    }),
  ),
})

export type ClassReport = z.infer<typeof classReportSchema>
