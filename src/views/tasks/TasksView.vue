<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth.store'
import { classService } from '@/services/class'
import { taskService } from '@/services/task'
import { submissionService } from '@/services/submission'
import { createTaskSchema, updateTaskSchema, FIBONACCI_VALUES } from '@/schemas/task.schema'
import type { Task } from '@/schemas/task.schema'
import type { Submission } from '@/schemas/submission.schema'
import type { Class } from '@/schemas/class.schema'
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

const router = useRouter()
const authStore = useAuthStore()
const apiUrl = import.meta.env.VITE_API_URL as string

const tasks = ref<Task[]>([])
const classes = ref<Class[]>([])
const mySubmissions = ref<Submission[]>([])

const availableClasses = computed(() => {
  if (authStore.isAdmin) return classes.value
  return classes.value.filter((c) => c.teacher.id === authStore.user?.id)
})
const loading = ref(false)

const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const selectedTask = ref<Task | null>(null)
const submitting = ref(false)

const deleteDialogOpen = ref(false)
const taskToDelete = ref<Task | null>(null)
const deleting = ref(false)

const formData = ref({
  classId: '',
  title: '',
  description: '',
  score: '',
  expiresAt: '',
})
const formErrors = ref<Record<string, string>>({})
const selectedFile = ref<File | null>(null)

const submissionMap = computed(() => {
  const map = new Map<string, Submission>()
  for (const sub of mySubmissions.value) {
    map.set(sub.taskId, sub)
  }
  return map
})

function taskStatus(task: Task): 'Entregue' | 'Pendente' | 'Expirada' {
  if (submissionMap.value.has(task.id)) return 'Entregue'
  if (task.expiresAt && new Date(task.expiresAt) < new Date()) return 'Expirada'
  return 'Pendente'
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Entregue') return 'default'
  if (status === 'Expirada') return 'destructive'
  return 'secondary'
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function loadData() {
  loading.value = true
  try {
    const promises: Promise<unknown>[] = [taskService.list()]
    if (authStore.isStudent) promises.push(submissionService.getMine())
    if (!authStore.isStudent) promises.push(classService.list())

    if (authStore.isStudent) {
      const [taskList, submissionList] = (await Promise.all(promises)) as [Task[], Submission[]]
      tasks.value = taskList
      mySubmissions.value = submissionList
    } else {
      const [taskList, classList] = (await Promise.all(promises)) as [Task[], Class[]]
      tasks.value = taskList
      classes.value = classList
    }
  } finally {
    loading.value = false
  }
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

function openCreateDialog() {
  dialogMode.value = 'create'
  selectedTask.value = null
  formData.value = { classId: '', title: '', description: '', score: '', expiresAt: '' }
  formErrors.value = {}
  selectedFile.value = null
  dialogOpen.value = true
}

function openEditDialog(task: Task) {
  dialogMode.value = 'edit'
  selectedTask.value = task
  formData.value = {
    classId: task.classId,
    title: task.title,
    description: task.description ?? '',
    score: String(task.score),
    expiresAt: task.expiresAt ? toDatetimeLocal(task.expiresAt) : '',
  }
  formErrors.value = {}
  selectedFile.value = null
  dialogOpen.value = true
}

function openDeleteDialog(task: Task) {
  taskToDelete.value = task
  deleteDialogOpen.value = true
}

function navigateToTask(task: Task) {
  router.push({ name: 'task-detail', params: { id: task.id } })
}

async function handleSubmit() {
  formErrors.value = {}

  if (dialogMode.value === 'create') {
    const result = createTaskSchema.safeParse({
      classId: formData.value.classId,
      title: formData.value.title,
      description: formData.value.description || undefined,
      score: formData.value.score ? Number(formData.value.score) : undefined,
      expiresAt: formData.value.expiresAt || undefined,
    })
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'general')
        formErrors.value[key] = issue.message
      })
      return
    }
    submitting.value = true
    try {
      await taskService.create({
        ...result.data,
        file: selectedFile.value ?? undefined,
      })
      dialogOpen.value = false
      await loadData()
      toast.success('Tarefa criada com sucesso.')
    } catch {
      toast.error('Erro ao criar tarefa.')
    } finally {
      submitting.value = false
    }
  } else {
    const result = updateTaskSchema.safeParse({
      title: formData.value.title || undefined,
      description: formData.value.description || undefined,
      score: formData.value.score ? Number(formData.value.score) : undefined,
      expiresAt: formData.value.expiresAt || undefined,
    })
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'general')
        formErrors.value[key] = issue.message
      })
      return
    }
    submitting.value = true
    try {
      await taskService.update(selectedTask.value!.id, {
        ...result.data,
        file: selectedFile.value ?? undefined,
      })
      dialogOpen.value = false
      await loadData()
      toast.success('Tarefa atualizada com sucesso.')
    } catch {
      toast.error('Erro ao atualizar tarefa.')
    } finally {
      submitting.value = false
    }
  }
}

async function handleDelete() {
  if (!taskToDelete.value) return
  deleting.value = true
  try {
    await taskService.remove(taskToDelete.value.id)
    deleteDialogOpen.value = false
    await loadData()
    toast.success('Tarefa excluída com sucesso.')
  } catch {
    toast.error('Erro ao excluir tarefa.')
  } finally {
    deleting.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Tarefas</h1>
        <p class="text-sm text-muted-foreground">Gerencie as tarefas da plataforma.</p>
      </div>
      <Button v-if="!authStore.isStudent" @click="openCreateDialog">
        <Plus class="mr-2 size-4" />
        Nova Tarefa
      </Button>
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Turma</TableHead>
            <TableHead>Pontuação</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead v-if="authStore.isStudent">Status</TableHead>
            <TableHead v-if="!authStore.isStudent" class="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">
              Carregando...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="tasks.length === 0">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">
              Nenhuma tarefa encontrada.
            </TableCell>
          </TableRow>
          <TableRow
            v-for="task in tasks"
            :key="task.id"
            class="cursor-pointer"
            @click="navigateToTask(task)"
          >
            <TableCell class="font-medium">{{ task.title }}</TableCell>
            <TableCell>{{ task.class.code }}</TableCell>
            <TableCell>{{ task.score }} pts</TableCell>
            <TableCell>{{ formatDate(task.expiresAt) }}</TableCell>
            <TableCell v-if="authStore.isStudent">
              <Badge :variant="statusVariant(taskStatus(task))">
                {{ taskStatus(task) }}
              </Badge>
            </TableCell>
            <TableCell v-if="!authStore.isStudent" class="text-right">
              <div class="flex justify-end gap-1">
                <Button variant="ghost" size="icon" @click.stop="openEditDialog(task)">
                  <Pencil class="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  class="text-destructive hover:text-destructive"
                  @click.stop="openDeleteDialog(task)"
                >
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
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ dialogMode === 'create' ? 'Nova Tarefa' : 'Editar Tarefa' }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{
              dialogMode === 'create'
                ? 'Preencha os dados para criar uma nova tarefa.'
                : 'Atualize os dados da tarefa.'
            }}
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <!-- Turma — somente no modo criar -->
          <div v-if="dialogMode === 'create'" class="space-y-2">
            <Label>Turma</Label>
            <Select v-model="formData.classId">
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="cls in availableClasses" :key="cls.id" :value="cls.id">
                  {{ cls.code }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="formErrors.classId" class="text-xs text-destructive">{{ formErrors.classId }}</p>
          </div>

          <div class="space-y-2">
            <Label for="title">Título</Label>
            <Input id="title" v-model="formData.title" placeholder="Ex: Lista de exercícios 1" />
            <p v-if="formErrors.title" class="text-xs text-destructive">{{ formErrors.title }}</p>
          </div>

          <div class="space-y-2">
            <Label for="description">Descrição <span class="text-muted-foreground">(opcional)</span></Label>
            <textarea
              id="description"
              v-model="formData.description"
              rows="3"
              placeholder="Instruções ou detalhes da tarefa..."
              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label>Pontuação</Label>
              <Select v-model="formData.score">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="fib in FIBONACCI_VALUES" :key="fib" :value="String(fib)">
                    {{ fib }}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p v-if="formErrors.score" class="text-xs text-destructive">{{ formErrors.score }}</p>
            </div>

            <div class="space-y-2">
              <Label for="expiresAt">Prazo <span class="text-muted-foreground">(opcional)</span></Label>
              <Input id="expiresAt" v-model="formData.expiresAt" type="datetime-local" />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="file">
              Arquivo PDF
              <span class="text-muted-foreground">(opcional)</span>
            </Label>
            <div v-if="dialogMode === 'edit' && selectedTask?.fileUrl" class="text-sm">
              <span class="text-muted-foreground">Atual: </span>
              <a
                :href="`${apiUrl}${selectedTask.fileUrl}`"
                target="_blank"
                class="text-primary underline underline-offset-2"
              >
                ver arquivo
              </a>
            </div>
            <input
              id="file"
              type="file"
              accept="application/pdf"
              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium text-muted-foreground cursor-pointer"
              @change="onFileChange"
            />
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
          <AlertDialogTitle>Excluir tarefa</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a tarefa
            <strong>{{ taskToDelete?.title }}</strong>? Esta ação não pode ser desfeita.
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
