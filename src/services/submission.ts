import http from './http'
import type { Submission } from '@/schemas/submission.schema'
import type { GradeSubmissionRequest } from '@/schemas/submission.schema'

export const submissionService = {
  async listForTask(taskId: string): Promise<Submission[]> {
    const response = await http.get<Submission[]>(`/api/v1/tasks/${taskId}/submissions`)
    return response.data
  },

  async getMine(): Promise<Submission[]> {
    const response = await http.get<Submission[]>('/api/v1/submissions/mine')
    return response.data
  },

  async getById(id: string): Promise<Submission> {
    const response = await http.get<Submission>(`/api/v1/submissions/${id}`)
    return response.data
  },

  async submit(taskId: string, data: { textAnswer?: string; file?: File }): Promise<Submission> {
    const formData = new FormData()
    if (data.textAnswer) formData.append('textAnswer', data.textAnswer)
    if (data.file) formData.append('file', data.file)
    const response = await http.post<Submission>(
      `/api/v1/tasks/${taskId}/submissions`,
      formData,
      { headers: { 'Content-Type': undefined } },
    )
    return response.data
  },

  async grade(id: string, data: GradeSubmissionRequest): Promise<Submission> {
    const response = await http.patch<Submission>(`/api/v1/submissions/${id}`, data)
    return response.data
  },

  async downloadFile(id: string): Promise<{ blob: Blob; filename: string }> {
    const response = await http.get(`/api/v1/submissions/${id}/download`, { responseType: 'blob' })
    const disposition: string = response.headers['content-disposition'] ?? ''
    const match = disposition.match(/filename="(.+)"/)
    const filename = match?.[1] ?? 'arquivo.pdf'
    return { blob: response.data as Blob, filename }
  },
}
