<script setup lang="ts">
import { ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { userService } from '@/services/user'
import { changePasswordSchema } from '@/schemas/user.schema'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const currentPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')

const touched = ref({ currentPassword: false, newPassword: false, confirmNewPassword: false })
const fieldErrors = ref({ currentPassword: '', newPassword: '', confirmNewPassword: '' })
const submitting = ref(false)

function validateField(field: keyof typeof touched.value) {
  if (field === 'currentPassword') {
    const r = changePasswordSchema.shape.currentPassword.safeParse(currentPassword.value)
    fieldErrors.value.currentPassword = r.success ? '' : (r.error.issues[0]?.message ?? '')
  }
  if (field === 'newPassword') {
    const r = changePasswordSchema.shape.newPassword.safeParse(newPassword.value)
    fieldErrors.value.newPassword = r.success ? '' : (r.error.issues[0]?.message ?? '')
    if (touched.value.confirmNewPassword) validateField('confirmNewPassword')
  }
  if (field === 'confirmNewPassword') {
    fieldErrors.value.confirmNewPassword =
      confirmNewPassword.value === newPassword.value ? '' : 'As senhas não coincidem.'
  }
}

watch(currentPassword, () => { touched.value.currentPassword = true; validateField('currentPassword') })
watch(newPassword, () => { touched.value.newPassword = true; validateField('newPassword') })
watch(confirmNewPassword, () => { touched.value.confirmNewPassword = true; validateField('confirmNewPassword') })

async function handleSubmit() {
  touched.value = { currentPassword: true, newPassword: true, confirmNewPassword: true }
  validateField('currentPassword')
  validateField('newPassword')
  validateField('confirmNewPassword')

  const hasErrors = Object.values(fieldErrors.value).some((e) => e !== '')
  if (hasErrors) return

  submitting.value = true
  try {
    await userService.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    toast.success('Senha alterada com sucesso.')
    currentPassword.value = ''
    newPassword.value = ''
    confirmNewPassword.value = ''
    touched.value = { currentPassword: false, newPassword: false, confirmNewPassword: false }
    fieldErrors.value = { currentPassword: '', newPassword: '', confirmNewPassword: '' }
  } catch {
    toast.error('Senha atual incorreta ou erro ao alterar senha.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex justify-center">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Alterar senha</CardTitle>
        <CardDescription>Informe sua senha atual e escolha uma nova.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              v-model="currentPassword"
              type="password"
              autocomplete="current-password"
            />
            <p v-if="fieldErrors.currentPassword" class="text-xs text-destructive">
              {{ fieldErrors.currentPassword }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              v-model="newPassword"
              type="password"
              autocomplete="new-password"
            />
            <p v-if="fieldErrors.newPassword" class="text-xs text-destructive">
              {{ fieldErrors.newPassword }}
            </p>
          </div>

          <div class="space-y-2">
            <Label for="confirmNewPassword">Confirmar nova senha</Label>
            <Input
              id="confirmNewPassword"
              v-model="confirmNewPassword"
              type="password"
              autocomplete="new-password"
            />
            <p v-if="fieldErrors.confirmNewPassword" class="text-xs text-destructive">
              {{ fieldErrors.confirmNewPassword }}
            </p>
          </div>

          <Button type="submit" class="w-full" :disabled="submitting">
            {{ submitting ? 'Salvando...' : 'Alterar senha' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
