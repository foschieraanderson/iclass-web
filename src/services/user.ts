import http from './http'
import type { User } from '@/schemas/user.schema'

export const userService = {
  async me(): Promise<User> {
    const response = await http.get<User>('/api/v1/users/me')
    return response.data
  },
}
