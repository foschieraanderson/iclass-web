import http from './http'
import type {
  ChangePasswordRequest,
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UserListQuery,
} from '@/schemas/user.schema'

export const userService = {
  async me(): Promise<User> {
    const response = await http.get<User>('/api/v1/users/me')
    return response.data
  },

  async list(query?: UserListQuery): Promise<User[]> {
    const response = await http.get<User[]>('/api/v1/users', { params: query })
    return response.data
  },

  async getById(id: string): Promise<User> {
    const response = await http.get<User>(`/api/v1/users/${id}`)
    return response.data
  },

  async create(data: CreateUserRequest): Promise<User> {
    const response = await http.post<User>('/api/v1/users', data)
    return response.data
  },

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await http.patch<User>(`/api/v1/users/${id}`, data)
    return response.data
  },

  async remove(id: string): Promise<void> {
    await http.delete(`/api/v1/users/${id}`)
  },

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await http.patch('/api/v1/users/me/password', data)
  },
}
