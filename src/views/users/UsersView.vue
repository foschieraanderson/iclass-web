<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth.store'
import { userService } from '@/services/user'
import { createUserSchema, updateUserSchema } from '@/schemas/user.schema'
import type { CreateUserRequest, UpdateUserRequest, User } from '@/schemas/user.schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const authStore = useAuthStore()
const router = useRouter()

const users = ref<User[]>([])
const loading = ref(false)
const roleFilter = ref<string>('all')

const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const selectedUser = ref<User | null>(null)
const submitting = ref(false)

const deleteDialogOpen = ref(false)
const userToDelete = ref<User | null>(null)
const deleting = ref(false)

const formData = ref({ name: '', email: '', password: '', role: '' })
const formErrors = ref<Record<string, string>>({})

const roleConfig: Record<string, { label: string; variant: 'destructive' | 'secondary' | 'outline' }> = {
  admin: { label: 'Admin', variant: 'destructive' },
  teacher: { label: 'Professor', variant: 'secondary' },
  student: { label: 'Aluno', variant: 'outline' },
}

async function loadUsers() {
  loading.value = true
  try {
    const query = roleFilter.value !== 'all' ? { role: roleFilter.value as User['role'] } : undefined
    users.value = await userService.list(query)
  } finally {
    loading.value = false
  }
}

watch(roleFilter, loadUsers)

function openCreateDialog() {
  dialogMode.value = 'create'
  selectedUser.value = null
  formData.value = { name: '', email: '', password: '', role: 'student' }
  formErrors.value = {}
  dialogOpen.value = true
}

function openEditDialog(user: User) {
  dialogMode.value = 'edit'
  selectedUser.value = user
  formData.value = { name: user.name, email: user.email, password: '', role: user.role }
  formErrors.value = {}
  dialogOpen.value = true
}

function openDeleteDialog(user: User) {
  userToDelete.value = user
  deleteDialogOpen.value = true
}

async function handleSubmit() {
  formErrors.value = {}

  if (dialogMode.value === 'create') {
    const payload: CreateUserRequest = {
      name: formData.value.name,
      email: formData.value.email,
      password: formData.value.password,
      role: formData.value.role as User['role'] || undefined,
    }
    const result = createUserSchema.safeParse(payload)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'general')
        formErrors.value[key] = issue.message
      })
      return
    }
    submitting.value = true
    try {
      await userService.create(result.data)
      dialogOpen.value = false
      await loadUsers()
      toast.success('Usuário criado com sucesso.')
    } catch {
      toast.error('Erro ao criar usuário.')
    } finally {
      submitting.value = false
    }
  } else {
    const payload: UpdateUserRequest = {
      name: formData.value.name || undefined,
      email: formData.value.email || undefined,
      role: formData.value.role as User['role'] || undefined,
    }
    const result = updateUserSchema.safeParse(payload)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'general')
        formErrors.value[key] = issue.message
      })
      return
    }
    submitting.value = true
    try {
      await userService.update(selectedUser.value!.id, result.data)
      dialogOpen.value = false
      await loadUsers()
      toast.success('Usuário atualizado com sucesso.')
    } catch {
      toast.error('Erro ao atualizar usuário.')
    } finally {
      submitting.value = false
    }
  }
}

async function handleDelete() {
  if (!userToDelete.value) return
  deleting.value = true
  try {
    await userService.remove(userToDelete.value.id)
    deleteDialogOpen.value = false
    await loadUsers()
    toast.success('Usuário excluído com sucesso.')
  } catch {
    toast.error('Erro ao excluir usuário.')
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  if (!authStore.isAdmin) {
    router.replace({ name: 'home' })
    return
  }
  await loadUsers()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p class="text-sm text-muted-foreground">Gerencie os usuários da plataforma.</p>
      </div>
      <Button v-if="authStore.isAdmin" @click="openCreateDialog">
        <Plus class="mr-2 size-4" />
        Novo Usuário
      </Button>
    </div>

    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-foreground">Filtrar por perfil:</span>
      <Select v-model="roleFilter">
        <SelectTrigger class="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="teacher">Professor</SelectItem>
          <SelectItem value="student">Aluno</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead v-if="authStore.isAdmin" class="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell :colspan="authStore.isAdmin ? 4 : 3" class="py-8 text-center text-muted-foreground">
              Carregando...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="users.length === 0">
            <TableCell :colspan="authStore.isAdmin ? 4 : 3" class="py-8 text-center text-muted-foreground">
              Nenhum usuário encontrado.
            </TableCell>
          </TableRow>
          <TableRow v-for="user in users" :key="user.id">
            <TableCell class="font-medium">{{ user.name }}</TableCell>
            <TableCell class="text-muted-foreground">{{ user.email }}</TableCell>
            <TableCell>
              <Badge :variant="roleConfig[user.role]?.variant">
                {{ roleConfig[user.role]?.label }}
              </Badge>
            </TableCell>
            <TableCell v-if="authStore.isAdmin" class="text-right">
              <div class="flex justify-end gap-1">
                <Button variant="ghost" size="icon" @click="openEditDialog(user)">
                  <Pencil class="size-4" />
                </Button>
                <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive" @click="openDeleteDialog(user)">
                  <Trash2 class="size-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Dialog criar / editar -->
    <Dialog v-model:open="dialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ dialogMode === 'create' ? 'Novo Usuário' : 'Editar Usuário' }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ dialogMode === 'create' ? 'Preencha os dados para criar um novo usuário.' : 'Atualize os dados do usuário.' }}
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-2">
            <Label for="name">Nome</Label>
            <Input id="name" v-model="formData.name" placeholder="Nome completo" />
            <p v-if="formErrors.name" class="text-xs text-destructive">{{ formErrors.name }}</p>
          </div>

          <div class="space-y-2">
            <Label for="email">Email</Label>
            <Input id="email" v-model="formData.email" type="email" placeholder="email@exemplo.com" />
            <p v-if="formErrors.email" class="text-xs text-destructive">{{ formErrors.email }}</p>
          </div>

          <div v-if="dialogMode === 'create'" class="space-y-2">
            <Label for="password">Senha</Label>
            <Input id="password" v-model="formData.password" type="password" placeholder="Mínimo 6 caracteres" />
            <p v-if="formErrors.password" class="text-xs text-destructive">{{ formErrors.password }}</p>
          </div>

          <div class="space-y-2">
            <Label>Perfil</Label>
            <Select v-model="formData.role">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Professor</SelectItem>
                <SelectItem value="student">Aluno</SelectItem>
              </SelectContent>
            </Select>
            <p v-if="formErrors.role" class="text-xs text-destructive">{{ formErrors.role }}</p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" @click="dialogOpen = false">Cancelar</Button>
            <Button type="submit" :disabled="submitting">
              {{ submitting ? 'Salvando...' : 'Salvar' }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <!-- AlertDialog excluir -->
    <AlertDialog v-model:open="deleteDialogOpen">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{{ userToDelete?.name }}</strong>?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            :disabled="deleting"
            @click.prevent="handleDelete"
          >
            {{ deleting ? 'Excluindo...' : 'Excluir' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
