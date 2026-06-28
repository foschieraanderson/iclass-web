import http from './http'
import type { ClassReport } from '@/schemas/report.schema'
import type { Submission } from '@/schemas/submission.schema'

export const reportService = {
  async getClassReport(classId: string): Promise<ClassReport> {
    const response = await http.get<ClassReport>(`/api/v1/classes/${classId}/report`)
    return response.data
  },

  async getTaskSubmissions(taskId: string): Promise<Submission[]> {
    const response = await http.get<Submission[]>(`/api/v1/tasks/${taskId}/submissions`)
    return response.data
  },
}
