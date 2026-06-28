import http from './http'
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  ResetPasswordRequest,
} from '@/schemas/auth.schema'

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await http.post<LoginResponse>('/api/v1/auth/login', data)
    localStorage.setItem('accessToken', response.data.accessToken)
    localStorage.setItem('refreshToken', response.data.refreshToken)
    return response.data
  },

  async refresh(data: RefreshRequest): Promise<RefreshResponse> {
    const response = await http.post<RefreshResponse>('/api/v1/auth/refresh', data)
    localStorage.setItem('accessToken', response.data.accessToken)
    return response.data
  },

  async forgotPassword(data: ForgotPasswordRequest): Promise<void> {
    await http.post('/api/v1/auth/forgot-password', data)
  },

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await http.post('/api/v1/auth/reset-password', data)
  },

  logout(): void {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },
}
