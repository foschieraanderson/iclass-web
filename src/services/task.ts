import http from './http'
import type { Task } from '@/schemas/task.schema'

type CreateTaskFormData = {
  classId: string
  title: string
  description?: string
  score: number
  expiresAt?: string
  file?: File
}

type UpdateTaskFormData = {
  title?: string
  description?: string
  score?: number
  expiresAt?: string
  file?: File
}

export const taskService = {
  async list(params?: { classId?: string }): Promise<Task[]> {
    const response = await http.get<Task[]>('/api/v1/tasks', { params })
    return response.data
  },

  async getById(id: string): Promise<Task> {
    const response = await http.get<Task>(`/api/v1/tasks/${id}`)
    return response.data
  },

  async create(data: CreateTaskFormData): Promise<Task> {
    const formData = new FormData()
    formData.append('classId', data.classId)
    formData.append('title', data.title)
    if (data.description) formData.append('description', data.description)
    formData.append('score', String(data.score))
    if (data.expiresAt) formData.append('expiresAt', new Date(data.expiresAt).toISOString())
    if (data.file) formData.append('file', data.file)
    const response = await http.post<Task>('/api/v1/tasks', formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },

  async update(id: string, data: UpdateTaskFormData): Promise<Task> {
    const formData = new FormData()
    if (data.title !== undefined) formData.append('title', data.title)
    if (data.description !== undefined) formData.append('description', data.description)
    if (data.score !== undefined) formData.append('score', String(data.score))
    if (data.expiresAt !== undefined)
      formData.append('expiresAt', new Date(data.expiresAt).toISOString())
    if (data.file) formData.append('file', data.file)
    const response = await http.patch<Task>(`/api/v1/tasks/${id}`, formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/api/v1/tasks/${id}`)
  },

  async downloadFile(id: string): Promise<{ blob: Blob; filename: string }> {
    const response = await http.get(`/api/v1/tasks/${id}/file`, { responseType: 'blob' })
    const disposition: string = response.headers['content-disposition'] ?? ''
    const match = disposition.match(/filename="(.+)"/)
    const filename = match?.[1] ?? 'arquivo.pdf'
    return { blob: response.data as Blob, filename }
  },
}
