import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { authService } from '@/services/auth'
import { userService } from '@/services/user'
import type { User } from '@/schemas/user.schema'
import type { LoginRequest } from '@/schemas/auth.schema'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isTeacher = computed(() => user.value?.role === 'teacher')
  const isStudent = computed(() => user.value?.role === 'student')

  async function login(credentials: LoginRequest): Promise<void> {
    await authService.login(credentials)
    await fetchMe()
  }

  async function fetchMe(): Promise<void> {
    user.value = await userService.me()
  }

  function logout(): void {
    authService.logout()
    user.value = null
  }

  return { user, isAuthenticated, isAdmin, isTeacher, isStudent, login, fetchMe, logout }
})
