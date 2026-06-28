<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ArrowLeft, Download } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth.store'
import { taskService } from '@/services/task'
import { submissionService } from '@/services/submission'
import { triggerFileDownload } from '@/lib/utils'
import type { Task } from '@/schemas/task.schema'
import type { Submission } from '@/schemas/submission.schema'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const task = ref<Task | null>(null)
const submissions = ref<Submission[]>([])
const mySubmission = ref<Submission | null>(null)
const loading = ref(false)

// student submit form
const submitText = ref('')
const submitFile = ref<File | null>(null)
const submitFileError = ref('')
const submitting = ref(false)

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

async function handleDownloadTaskFile() {
  try {
    const { blob, filename } = await taskService.downloadFile(task.value!.id)
    triggerFileDownload(blob, filename)
  } catch {
    toast.error('Erro ao baixar arquivo da tarefa.')
  }
}

async function handleDownloadSubmission(submissionId: string) {
  try {
    const { blob, filename } = await submissionService.downloadFile(submissionId)
    triggerFileDownload(blob, filename)
  } catch {
    toast.error('Erro ao baixar arquivo da submissão.')
  }
}

async function loadData() {
  loading.value = true
  try {
    const taskId = route.params.id as string
    task.value = await taskService.getById(taskId)

    if (authStore.isStudent) {
      const mine = await submissionService.getMine()
      mySubmission.value = mine.find((s) => s.taskId === taskId) ?? null
    } else {
      submissions.value = await submissionService.listForTask(taskId)
    }
  } catch {
    toast.error('Erro ao carregar tarefa.')
    router.push({ name: 'tasks' })
  } finally {
    loading.value = false
  }
}

function onSubmitFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  submitFile.value = input.files?.[0] ?? null
  submitFileError.value = ''
}

async function handleSubmit() {
  submitFileError.value = ''

  if (!submitText.value.trim() && !submitFile.value) {
    submitFileError.value = 'Envie ao menos uma resposta em texto ou um arquivo PDF.'
    return
  }

  submitting.value = true
  try {
    const created = await submissionService.submit(task.value!.id, {
      textAnswer: submitText.value.trim() || undefined,
      file: submitFile.value ?? undefined,
    })
    mySubmission.value = created
    toast.success('Resposta enviada com sucesso.')
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 409) {
      toast.error('Você já enviou uma resposta para esta tarefa.')
    } else {
      toast.error('Erro ao enviar resposta.')
    }
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <Button variant="ghost" size="icon" @click="router.push({ name: 'tasks' })">
        <ArrowLeft class="size-4" />
      </Button>
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">
          {{ task?.title ?? 'Carregando...' }}
        </h1>
        <p class="text-sm text-muted-foreground">{{ task?.class.code }}</p>
      </div>
    </div>

    <div v-if="loading" class="py-16 text-center text-muted-foreground">Carregando...</div>

    <template v-else-if="task">
      <!-- Detalhes da tarefa -->
      <div class="rounded-md border p-6 space-y-4">
        <div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Pontuação</p>
            <p class="font-semibold">{{ task.score }} pts</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Prazo</p>
            <p class="font-semibold">{{ formatDate(task.expiresAt) }}</p>
          </div>
          <div>
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Criado por</p>
            <p class="font-semibold">{{ task.createdBy.name }}</p>
          </div>
          <div v-if="task.fileUrl">
            <p class="text-xs text-muted-foreground uppercase tracking-wide">Arquivo</p>
            <a
              href="#"
              target="_blank"
              class="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
              @click.prevent="handleDownloadTaskFile()"
            >
              <Download class="size-3.5" />
              baixar PDF
            </a>
          </div>
        </div>

        <div v-if="task.description">
          <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Descrição</p>
          <p class="text-sm whitespace-pre-line">{{ task.description }}</p>
        </div>
      </div>

      <!-- Visão do aluno -->
      <template v-if="authStore.isStudent">
        <!-- Já submeteu -->
        <div v-if="mySubmission" class="rounded-md border p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold">Sua resposta</h2>
            <div class="flex items-center gap-2">
              <Badge v-if="mySubmission.grade !== null" variant="default">
                {{ mySubmission.grade }}/100
              </Badge>
              <Badge v-else variant="secondary">Aguardando correção</Badge>
            </div>
          </div>

          <div v-if="mySubmission.textAnswer">
            <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Texto</p>
            <p class="text-sm whitespace-pre-line rounded-md border bg-muted/40 p-3">
              {{ mySubmission.textAnswer }}
            </p>
          </div>

          <div v-if="mySubmission.fileUrl">
            <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Arquivo</p>
            <a
              href="#"
              target="_blank"
              class="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
              @click.prevent="handleDownloadSubmission(mySubmission.id)"
            >
              <Download class="size-3.5" />
              baixar PDF enviado
            </a>
          </div>

          <div v-if="mySubmission.feedback">
            <p class="text-xs text-muted-foreground uppercase tracking-wide mb-1">Feedback do professor</p>
            <p class="text-sm whitespace-pre-line rounded-md border bg-muted/40 p-3">
              {{ mySubmission.feedback }}
            </p>
          </div>

          <p class="text-xs text-muted-foreground">
            Enviado em {{ formatDate(mySubmission.createdAt) }}
            <template v-if="mySubmission.gradedAt">
              · Corrigido em {{ formatDate(mySubmission.gradedAt) }}
            </template>
          </p>
        </div>

        <!-- Ainda não submeteu -->
        <div v-else class="rounded-md border p-6 space-y-4">
          <h2 class="font-semibold">Enviar resposta</h2>

          <div class="space-y-2">
            <Label for="submitText">
              Resposta em texto <span class="text-muted-foreground">(opcional)</span>
            </Label>
            <textarea
              id="submitText"
              v-model="submitText"
              rows="5"
              placeholder="Digite sua resposta aqui..."
              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          <div class="space-y-2">
            <Label for="submitFile">
              Arquivo PDF <span class="text-muted-foreground">(opcional)</span>
            </Label>
            <input
              id="submitFile"
              type="file"
              accept="application/pdf"
              class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium text-muted-foreground cursor-pointer"
              @change="onSubmitFileChange"
            />
            <p v-if="submitFileError" class="text-xs text-destructive">{{ submitFileError }}</p>
          </div>

          <Button :disabled="submitting" @click="handleSubmit">
            {{ submitting ? 'Enviando...' : 'Enviar resposta' }}
          </Button>
        </div>
      </template>

      <!-- Visão do professor / admin -->
      <template v-else>
        <div class="space-y-4">
          <h2 class="font-semibold">
            Submissões
            <span class="ml-1 text-sm font-normal text-muted-foreground">
              ({{ submissions.length }})
            </span>
          </h2>

          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Resposta</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Corrigido em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="submissions.length === 0">
                  <TableCell colspan="5" class="py-8 text-center text-muted-foreground">
                    Nenhuma submissão ainda.
                  </TableCell>
                </TableRow>
                <TableRow
                  v-for="sub in submissions"
                  :key="sub.id"
                  class="cursor-pointer"
                  @click="router.push({ name: 'submission-detail', params: { id: sub.id } })"
                >
                  <TableCell class="font-medium">{{ sub.student.name }}</TableCell>
                  <TableCell class="max-w-[200px]">
                    <p v-if="sub.textAnswer" class="truncate text-sm text-muted-foreground">
                      {{ sub.textAnswer }}
                    </p>
                    <span v-else class="text-muted-foreground">—</span>
                  </TableCell>
                  <TableCell>
                    <a
                      v-if="sub.fileUrl"
                      href="#"
                      target="_blank"
                      class="inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
                      @click.prevent.stop="handleDownloadSubmission(sub.id)"
                    >
                      <Download class="size-3.5" />
                      baixar PDF
                    </a>
                    <span v-else class="text-muted-foreground">—</span>
                  </TableCell>
                  <TableCell>
                    <Badge v-if="sub.grade !== null" variant="default">{{ sub.grade }}/100</Badge>
                    <Badge v-else variant="secondary">Pendente</Badge>
                  </TableCell>
                  <TableCell>{{ formatDate(sub.gradedAt) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </template>
    </template>

  </div>
</template>
