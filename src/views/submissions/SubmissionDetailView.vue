<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, Download } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth.store'
import { submissionService } from '@/services/submission'
import { createGradeSchema } from '@/schemas/submission.schema'
import type { Submission } from '@/schemas/submission.schema'
import { triggerFileDownload } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const submission = ref<Submission | null>(null)
const loading = ref(false)

const gradeForm = ref({ grade: '', feedback: '' })
const gradeErrors = ref<Record<string, string>>({})
const grading = ref(false)

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

async function loadSubmission() {
  loading.value = true
  try {
    const id = route.params.id as string
    submission.value = await submissionService.getById(id)
    gradeForm.value = {
      grade: submission.value.grade !== null ? String(submission.value.grade) : '',
      feedback: submission.value.feedback ?? '',
    }
  } catch {
    toast.error('Erro ao carregar submissão.')
    router.back()
  } finally {
    loading.value = false
  }
}

async function handleDownload() {
  try {
    const { blob, filename } = await submissionService.downloadFile(submission.value!.id)
    triggerFileDownload(blob, filename)
  } catch {
    toast.error('Erro ao baixar arquivo.')
  }
}

async function handleGrade() {
  gradeErrors.value = {}

  const result = createGradeSchema(submission.value!.task.score).safeParse({
    grade: gradeForm.value.grade !== '' ? Number(gradeForm.value.grade) : undefined,
    feedback: gradeForm.value.feedback || undefined,
  })

  if (!result.success) {
    result.error.issues.forEach((issue) => {
      const key = String(issue.path[0] ?? 'general')
      gradeErrors.value[key] = issue.message
    })
    return
  }

  grading.value = true
  try {
    submission.value = await submissionService.grade(submission.value!.id, result.data)
    toast.success('Avaliação salva com sucesso.')
  } catch {
    toast.error('Erro ao salvar avaliação.')
  } finally {
    grading.value = false
  }
}

onMounted(async () => {
  if (authStore.isStudent) {
    router.replace({ name: 'home' })
    return
  }
  await loadSubmission()
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-3">
      <Button variant="ghost" size="icon" @click="router.back()">
        <ArrowLeft class="size-4" />
      </Button>
      <h1 class="text-xl font-semibold">
        <template v-if="submission">
          Submissão de {{ submission.student.name }}
        </template>
        <template v-else-if="loading">Carregando...</template>
      </h1>
    </div>

    <template v-if="submission">
      <!-- Informações gerais -->
      <div class="rounded-md border p-6 space-y-4">
        <h2 class="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Informações</h2>
        <div class="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Aluno</p>
            <p class="font-semibold">{{ submission.student.name }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">E-mail</p>
            <p class="font-semibold">{{ submission.student.email }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Tarefa</p>
            <p class="font-semibold">{{ submission.task.title }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Turma</p>
            <p class="font-semibold">{{ submission.task.class.code }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Enviado em</p>
            <p class="font-semibold">{{ formatDate(submission.createdAt) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Corrigido em</p>
            <p class="font-semibold">{{ formatDate(submission.gradedAt) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Nota atual</p>
            <Badge v-if="submission.grade !== null" variant="default" class="mt-1">
              {{ submission.grade }}/{{ submission.task.score }}
            </Badge>
            <Badge v-else variant="secondary" class="mt-1">Pendente</Badge>
          </div>
        </div>
      </div>

      <!-- Resposta do aluno -->
      <div class="rounded-md border p-6 space-y-4">
        <h2 class="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Resposta</h2>

        <div v-if="submission.textAnswer">
          <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Texto</p>
          <p class="text-sm whitespace-pre-line rounded-md border bg-muted/40 p-3">
            {{ submission.textAnswer }}
          </p>
        </div>

        <div v-if="submission.fileUrl">
          <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Arquivo</p>
          <a
            href="#"
            target="_blank"
            class="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
            @click.prevent="handleDownload()"
          >
            <Download class="size-3.5" />
            baixar PDF
          </a>
        </div>

        <p
          v-if="!submission.textAnswer && !submission.fileUrl"
          class="text-sm text-muted-foreground"
        >
          Nenhuma resposta enviada.
        </p>
      </div>

      <!-- Formulário de avaliação -->
      <div class="rounded-md border p-6 space-y-4">
        <h2 class="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Avaliação</h2>

        <form class="space-y-4 max-w-sm" @submit.prevent="handleGrade">
          <div class="space-y-2">
            <Label for="grade">Nota (0 – {{ submission.task.score }})</Label>
            <Input
              id="grade"
              v-model="gradeForm.grade"
              type="number"
              min="0"
              :max="submission.task.score"
              :placeholder="`Ex: ${submission.task.score}`"
            />
            <p v-if="gradeErrors.grade" class="text-xs text-destructive">{{ gradeErrors.grade }}</p>
          </div>

          <div class="space-y-2">
            <Label for="feedback">
              Feedback <span class="text-muted-foreground">(opcional)</span>
            </Label>
            <textarea
              id="feedback"
              v-model="gradeForm.feedback"
              rows="4"
              placeholder="Comentários para o aluno..."
              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          <Button type="submit" :disabled="grading">
            {{ grading ? 'Salvando...' : 'Salvar avaliação' }}
          </Button>
        </form>
      </div>
    </template>
  </div>
</template>
