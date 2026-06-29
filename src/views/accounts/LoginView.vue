<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { loginRequestSchema } from '@/schemas/auth.schema'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  const result = loginRequestSchema.safeParse({ email: email.value, password: password.value })
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? 'Dados inválidos'
    return
  }

  loading.value = true
  error.value = ''

  try {
    await authStore.login(result.data)
    router.push({ name: 'home' })
  } catch {
    error.value = 'Email ou senha incorretos'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4">
    <Card class="w-full max-w-sm">
      <CardHeader class="flex flex-col gap-4 items-center">
        <CardTitle class="text-2xl">
            <img class="max-w-3xs" src="../../assets/Iclasslogo.png" alt="Logo IClass" />
        </CardTitle>
        <CardDescription>Acesse sua conta para continuar</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="seu@email.com"
              autocomplete="email"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="password">Senha</Label>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>
          <div class="text-right">
            <RouterLink
              :to="{ name: 'forgot-password' }"
              class="text-sm text-muted-foreground underline-offset-4 hover:underline hover:text-foreground"
            >
              Esqueceu a senha?
            </RouterLink>
          </div>
          <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
