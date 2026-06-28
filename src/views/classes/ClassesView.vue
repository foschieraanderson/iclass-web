<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { toast } from 'vue-sonner'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth.store'
import { classService } from '@/services/class'
import { userService } from '@/services/user'
import { createClassSchema, updateClassSchema } from '@/schemas/class.schema'
import type { Class, CreateClassRequest, UpdateClassRequest } from '@/schemas/class.schema'
import type { User } from '@/schemas/user.schema'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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

const classes = ref<Class[]>([])

const filteredClasses = computed(() => {
  if (authStore.isAdmin) return classes.value
  if (authStore.isTeacher) {
    return classes.value.filter((c) => c.teacher.id === authStore.user?.id)
  }
  return classes.value.filter((c) => c.students.some((s) => s.id === authStore.user?.id))
})
const teachers = ref<User[]>([])
const students = ref<User[]>([])
const loading = ref(false)

const dialogOpen = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const selectedClass = ref<Class | null>(null)
const submitting = ref(false)

const deleteDialogOpen = ref(false)
const classToDelete = ref<Class | null>(null)
const deleting = ref(false)

const formData = ref({
  period: '',
  grade: '',
  teacherId: '',
  studentIds: [] as string[],
})
const formErrors = ref<Record<string, string>>({})

async function loadData() {
  loading.value = true
  try {
    const [classList, teacherList, studentList] = await Promise.all([
      classService.list(),
      userService.list({ role: 'teacher' }),
      userService.list({ role: 'student' }),
    ])
    classes.value = classList
    teachers.value = teacherList
    students.value = studentList
  } finally {
    loading.value = false
  }
}

function toggleStudent(id: string, checked: boolean) {
  if (checked) {
    formData.value.studentIds = [...formData.value.studentIds, id]
  } else {
    formData.value.studentIds = formData.value.studentIds.filter((s) => s !== id)
  }
}

function openCreateDialog() {
  dialogMode.value = 'create'
  selectedClass.value = null
  formData.value = { period: '', grade: '', teacherId: '', studentIds: [] }
  formErrors.value = {}
  dialogOpen.value = true
}

function openEditDialog(cls: Class) {
  dialogMode.value = 'edit'
  selectedClass.value = cls
  formData.value = {
    period: cls.period,
    grade: cls.grade,
    teacherId: cls.teacher.id,
    studentIds: cls.students.map((s) => s.id),
  }
  formErrors.value = {}
  dialogOpen.value = true
}

function openDeleteDialog(cls: Class) {
  classToDelete.value = cls
  deleteDialogOpen.value = true
}

async function handleSubmit() {
  formErrors.value = {}

  if (dialogMode.value === 'create') {
    const payload: CreateClassRequest = {
      period: formData.value.period,
      grade: formData.value.grade,
      teacherId: formData.value.teacherId,
      studentIds: formData.value.studentIds,
    }
    const result = createClassSchema.safeParse(payload)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'general')
        formErrors.value[key] = issue.message
      })
      return
    }
    submitting.value = true
    try {
      await classService.create(result.data)
      dialogOpen.value = false
      await loadData()
      toast.success('Turma criada com sucesso.')
    } catch {
      toast.error('Erro ao criar turma.')
    } finally {
      submitting.value = false
    }
  } else {
    const payload: UpdateClassRequest = {
      period: formData.value.period || undefined,
      grade: formData.value.grade || undefined,
      teacherId: formData.value.teacherId || undefined,
      studentIds: formData.value.studentIds.length > 0 ? formData.value.studentIds : undefined,
    }
    const result = updateClassSchema.safeParse(payload)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const key = String(issue.path[0] ?? 'general')
        formErrors.value[key] = issue.message
      })
      return
    }
    submitting.value = true
    try {
      await classService.update(selectedClass.value!.id, result.data)
      dialogOpen.value = false
      await loadData()
      toast.success('Turma atualizada com sucesso.')
    } catch {
      toast.error('Erro ao atualizar turma.')
    } finally {
      submitting.value = false
    }
  }
}

async function handleDelete() {
  if (!classToDelete.value) return
  deleting.value = true
  try {
    await classService.remove(classToDelete.value.id)
    deleteDialogOpen.value = false
    await loadData()
    toast.success('Turma excluída com sucesso.')
  } catch {
    toast.error('Erro ao excluir turma.')
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
        <h1 class="text-2xl font-semibold tracking-tight">Turmas</h1>
        <p class="text-sm text-muted-foreground">Gerencie as turmas da plataforma.</p>
      </div>
      <Button v-if="authStore.isAdmin" @click="openCreateDialog">
        <Plus class="mr-2 size-4" />
        Nova Turma
      </Button>
    </div>

    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Professor</TableHead>
            <TableHead>Alunos</TableHead>
            <TableHead v-if="authStore.isAdmin" class="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell :colspan="authStore.isAdmin ? 4 : 3" class="py-8 text-center text-muted-foreground">
              Carregando...
            </TableCell>
          </TableRow>
          <TableRow v-else-if="classes.length === 0">
            <TableCell :colspan="authStore.isAdmin ? 4 : 3" class="py-8 text-center text-muted-foreground">
              Nenhuma turma encontrada.
            </TableCell>
          </TableRow>
          <TableRow v-for="cls in filteredClasses" :key="cls.id">
            <TableCell class="font-medium">{{ cls.code }}</TableCell>
            <TableCell>{{ cls.teacher.name }}</TableCell>
            <TableCell>{{ cls.students.length }}</TableCell>
            <TableCell v-if="authStore.isAdmin" class="text-right">
              <div class="flex justify-end gap-1">
                <Button variant="ghost" size="icon" @click="openEditDialog(cls)">
                  <Pencil class="size-4" />
                </Button>
                <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive" @click="openDeleteDialog(cls)">
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
          <DialogTitle>{{ dialogMode === 'create' ? 'Nova Turma' : 'Editar Turma' }}</DialogTitle>
          <DialogDescription class="sr-only">
            {{ dialogMode === 'create' ? 'Preencha os dados para criar uma nova turma.' : 'Atualize os dados da turma.' }}
          </DialogDescription>
        </DialogHeader>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="period">Período</Label>
              <Input id="period" v-model="formData.period" placeholder="2026/1" />
              <p v-if="formErrors.period" class="text-xs text-destructive">{{ formErrors.period }}</p>
            </div>
            <div class="space-y-2">
              <Label for="grade">Série</Label>
              <Input id="grade" v-model="formData.grade" placeholder="3A" />
              <p v-if="formErrors.grade" class="text-xs text-destructive">{{ formErrors.grade }}</p>
            </div>
          </div>

          <div class="space-y-2">
            <Label>Professor</Label>
            <Select v-model="formData.teacherId">
              <SelectTrigger>
                <SelectValue placeholder="Selecione o professor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                  {{ teacher.name }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p v-if="formErrors.teacherId" class="text-xs text-destructive">{{ formErrors.teacherId }}</p>
          </div>

          <div class="space-y-2">
            <Label>Alunos</Label>
            <div class="max-h-48 overflow-y-auto rounded-md border p-3 space-y-2">
              <p v-if="students.length === 0" class="text-sm text-muted-foreground">
                Nenhum aluno cadastrado.
              </p>
              <div
                v-for="student in students"
                :key="student.id"
                class="flex items-center gap-2"
              >
                <Checkbox
                  :id="`student-${student.id}`"
                  :model-value="formData.studentIds.includes(student.id)"
                  @update:model-value="(val: boolean | 'indeterminate') => toggleStudent(student.id, val === true)"
                />
                <Label :for="`student-${student.id}`" class="font-normal cursor-pointer">
                  {{ student.name }}
                </Label>
              </div>
            </div>
            <p v-if="formErrors.studentIds" class="text-xs text-destructive">{{ formErrors.studentIds }}</p>
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
          <AlertDialogTitle>Excluir turma</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a turma <strong>{{ classToDelete?.code }}</strong>?
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
