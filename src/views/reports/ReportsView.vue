<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { classService } from '@/services/class'
import { taskService } from '@/services/task'
import { reportService } from '@/services/report'
import type { ClassReport } from '@/schemas/report.schema'
import type { Submission } from '@/schemas/submission.schema'
import type { Class } from '@/schemas/class.schema'
import type { Task } from '@/schemas/task.schema'
import { Badge } from '@/components/ui/badge'
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

const activeTab = ref<'class' | 'submissions'>('class')

const classes = ref<Class[]>([])
const loadingClasses = ref(false)

// Tab 1 — Class Report
const selectedClassId = ref('')
const classReport = ref<ClassReport | null>(null)
const loadingReport = ref(false)

// Tab 2 — Submissions
const selectedClassIdSub = ref('')
const tasks = ref<Task[]>([])
const selectedTaskId = ref('')
const submissions = ref<Submission[]>([])
const loadingTasks = ref(false)
const loadingSubmissions = ref(false)

const visibleClasses = computed(() => {
  if (authStore.isAdmin) return classes.value
  return classes.value.filter((c) => c.teacher.id === authStore.user?.id)
})

const submissionMap = computed(() => {
  if (!classReport.value) return {} as Record<string, Record<string, ClassReport['students'][0]['submissions'][0]>>
  const map: Record<string, Record<string, ClassReport['students'][0]['submissions'][0]>> = {}
  for (const student of classReport.value.students) {
    map[student.id] = {}
    for (const sub of student.submissions) {
      map[student.id][sub.taskId] = sub
    }
  }
  return map
})

async function loadClasses() {
  loadingClasses.value = true
  try {
    classes.value = await classService.list()
  } finally {
    loadingClasses.value = false
  }
}

async function loadClassReport() {
  if (!selectedClassId.value) {
    classReport.value = null
    return
  }
  loadingReport.value = true
  classReport.value = null
  try {
    classReport.value = await reportService.getClassReport(selectedClassId.value)
  } finally {
    loadingReport.value = false
  }
}

async function loadTasksForClass() {
  tasks.value = []
  selectedTaskId.value = ''
  submissions.value = []
  if (!selectedClassIdSub.value) return
  loadingTasks.value = true
  try {
    tasks.value = await taskService.list({ classId: selectedClassIdSub.value })
  } finally {
    loadingTasks.value = false
  }
}

async function loadSubmissions() {
  submissions.value = []
  if (!selectedTaskId.value) return
  loadingSubmissions.value = true
  try {
    submissions.value = await reportService.getTaskSubmissions(selectedTaskId.value)
  } finally {
    loadingSubmissions.value = false
  }
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso),
  )
}

onMounted(async () => {
  if (authStore.isStudent) {
    router.replace({ name: 'home' })
    return
  }
  await loadClasses()
})

watch(selectedClassId, loadClassReport)
watch(selectedClassIdSub, loadTasksForClass)
watch(selectedTaskId, loadSubmissions)
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Relatórios</h1>
      <p class="text-sm text-muted-foreground">Visualize o desempenho de turmas e submissões.</p>
    </div>

    <!-- Tab navigation -->
    <div class="flex border-b gap-1">
      <button
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="
          activeTab === 'class'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'class'"
      >
        Relatório de Turma
      </button>
      <button
        class="px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px"
        :class="
          activeTab === 'submissions'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
        "
        @click="activeTab = 'submissions'"
      >
        Relatório de Submissões
      </button>
    </div>

    <!-- Tab 1: Class Report -->
    <div v-if="activeTab === 'class'" class="space-y-4">
      <div class="w-72">
        <Select v-model="selectedClassId">
          <SelectTrigger>
            <SelectValue
              :placeholder="loadingClasses ? 'Carregando...' : 'Selecione uma turma'"
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="cls in visibleClasses" :key="cls.id" :value="cls.id">
              {{ cls.code }} — {{ cls.teacher.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div v-if="loadingReport" class="py-8 text-center text-sm text-muted-foreground">
        Carregando relatório...
      </div>

      <div
        v-else-if="!selectedClassId"
        class="py-8 text-center text-sm text-muted-foreground rounded-md border"
      >
        Selecione uma turma para ver o relatório.
      </div>

      <div v-else-if="classReport" class="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="min-w-40">Aluno</TableHead>
              <TableHead
                v-for="task in classReport.tasks"
                :key="task.id"
                class="min-w-32 text-center"
              >
                <div class="flex flex-col items-center">
                  <span>{{ task.title }}</span>
                  <span class="text-xs font-normal text-muted-foreground">{{ task.score }} pts</span>
                </div>
              </TableHead>
              <TableHead class="min-w-28 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="classReport.students.length === 0">
              <TableCell
                :colspan="classReport.tasks.length + 2"
                class="py-8 text-center text-muted-foreground"
              >
                Nenhum aluno matriculado.
              </TableCell>
            </TableRow>
            <TableRow v-for="student in classReport.students" :key="student.id">
              <TableCell class="font-medium">{{ student.name }}</TableCell>
              <TableCell
                v-for="task in classReport.tasks"
                :key="task.id"
                class="text-center"
              >
                <template v-if="submissionMap[student.id]?.[task.id]?.submitted">
                  <span v-if="submissionMap[student.id][task.id].grade !== null">
                    {{ submissionMap[student.id][task.id].grade }}
                  </span>
                  <Badge v-else variant="secondary">Entregue</Badge>
                </template>
                <span v-else class="text-muted-foreground">—</span>
              </TableCell>
              <TableCell class="text-right font-medium">
                {{ student.totalEarned }} / {{ student.totalPossible }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>

    <!-- Tab 2: Submissions Report -->
    <div v-if="activeTab === 'submissions'" class="space-y-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="w-72">
          <Select v-model="selectedClassIdSub">
            <SelectTrigger>
              <SelectValue
                :placeholder="loadingClasses ? 'Carregando...' : 'Selecione uma turma'"
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="cls in visibleClasses" :key="cls.id" :value="cls.id">
                {{ cls.code }} — {{ cls.teacher.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="selectedClassIdSub" class="w-72">
          <Select v-model="selectedTaskId" :disabled="loadingTasks || tasks.length === 0">
            <SelectTrigger>
              <SelectValue
                :placeholder="
                  loadingTasks ? 'Carregando...' : tasks.length === 0 ? 'Sem tarefas' : 'Selecione uma tarefa'
                "
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="task in tasks" :key="task.id" :value="task.id">
                {{ task.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div v-if="loadingSubmissions" class="py-8 text-center text-sm text-muted-foreground">
        Carregando submissões...
      </div>

      <div
        v-else-if="!selectedClassIdSub"
        class="py-8 text-center text-sm text-muted-foreground rounded-md border"
      >
        Selecione uma turma e uma tarefa para ver as submissões.
      </div>

      <div
        v-else-if="!selectedTaskId"
        class="py-8 text-center text-sm text-muted-foreground rounded-md border"
      >
        Selecione uma tarefa para ver as submissões.
      </div>

      <div v-else-if="submissions.length === 0" class="py-8 text-center text-sm text-muted-foreground rounded-md border">
        Nenhuma submissão encontrada para esta tarefa.
      </div>

      <div v-else class="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Entregue em</TableHead>
              <TableHead class="text-center">Nota</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead class="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="sub in submissions" :key="sub.id">
              <TableCell class="font-medium">{{ sub.student.name }}</TableCell>
              <TableCell class="text-sm">{{ formatDate(sub.createdAt) }}</TableCell>
              <TableCell class="text-center">
                <span v-if="sub.grade !== null">{{ sub.grade }}/{{ sub.task.score }}</span>
                <span v-else class="text-muted-foreground">—</span>
              </TableCell>
              <TableCell class="max-w-48 truncate text-sm">
                {{ sub.feedback ?? '—' }}
              </TableCell>
              <TableCell class="text-center">
                <Badge v-if="sub.grade !== null">Corrigida</Badge>
                <Badge v-else variant="secondary">Pendente</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </div>
</template>
