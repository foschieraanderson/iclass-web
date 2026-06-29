<script setup lang="ts">
import { computed } from 'vue'
import { BookOpen, Check, ClipboardList, FileBarChart2, House, Info, Users } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth.store'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const authStore = useAuthStore()

const roleLabel = computed(() => {
  if (authStore.isAdmin) return 'Admin'
  if (authStore.isTeacher) return 'Professor'
  return 'Aluno'
})

const roleBadgeVariant = computed<'default' | 'secondary' | 'outline'>(() => {
  if (authStore.isAdmin) return 'default'
  if (authStore.isTeacher) return 'secondary'
  return 'outline'
})
</script>

<template>
  <main class="p-6 space-y-8 max-w-4xl mx-auto">
    <div class="space-y-2">
      <div class="flex items-center gap-3 flex-wrap">
        <Info class="h-7 w-7 text-primary" />
        <h1 class="text-2xl font-bold">Sobre o iClass</h1>
        <Badge :variant="roleBadgeVariant">{{ roleLabel }}</Badge>
      </div>
      <p class="text-muted-foreground text-sm max-w-2xl">
        iClass é uma plataforma de gestão de aprendizagem que conecta professores e alunos em um
        ambiente digital integrado. Abaixo estão as funcionalidades disponíveis para o seu perfil.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <!-- Início -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <House class="h-5 w-5" />
            </div>
            <div>
              <CardTitle class="text-base">Início</CardTitle>
              <CardDescription>Visão geral das suas métricas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <ul class="space-y-1.5">
            <li class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Acompanhe estatísticas do período em tempo real</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Visualize gráficos de desempenho mensais</span>
            </li>
            <li v-if="authStore.isStudent" class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Monitore tarefas pendentes, submetidas e avaliadas</span>
            </li>
            <li v-if="authStore.isTeacher || authStore.isAdmin" class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Acompanhe submissões pendentes de correção</span>
            </li>
            <li v-if="authStore.isAdmin" class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Visualize totais de usuários, turmas e tarefas da plataforma</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- Turmas -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <BookOpen class="h-5 w-5" />
            </div>
            <div>
              <CardTitle class="text-base">Turmas</CardTitle>
              <CardDescription>Gerencie e acesse turmas</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <ul class="space-y-1.5">
            <li v-if="authStore.isStudent" class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Visualize as turmas nas quais está matriculado</span>
            </li>
            <li v-if="authStore.isTeacher || authStore.isAdmin" class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Crie e edite turmas</span>
            </li>
            <li v-if="authStore.isTeacher || authStore.isAdmin" class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Gerencie alunos matriculados por turma</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Acesse detalhes e materiais de cada turma</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- Tarefas -->
      <Card>
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <ClipboardList class="h-5 w-5" />
            </div>
            <div>
              <CardTitle class="text-base">Tarefas</CardTitle>
              <CardDescription>
                <span v-if="authStore.isStudent">Envie e acompanhe suas atividades</span>
                <span v-else>Crie, gerencie e avalie atividades</span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <ul class="space-y-1.5">
            <template v-if="authStore.isStudent">
              <li class="flex items-start gap-2 text-sm text-muted-foreground">
                <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Visualize tarefas disponíveis e seus prazos</span>
              </li>
              <li class="flex items-start gap-2 text-sm text-muted-foreground">
                <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Envie sua submissão antes do prazo (upload de PDF)</span>
              </li>
              <li class="flex items-start gap-2 text-sm text-muted-foreground">
                <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Acompanhe o status: Pendente, Submetida, Avaliada, Expirada</span>
              </li>
              <li class="flex items-start gap-2 text-sm text-muted-foreground">
                <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Consulte pontuação e feedback do professor</span>
              </li>
            </template>
            <template v-else>
              <li class="flex items-start gap-2 text-sm text-muted-foreground">
                <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Crie e edite tarefas com pontuação Fibonacci (1, 2, 3, 5, 8…)</span>
              </li>
              <li class="flex items-start gap-2 text-sm text-muted-foreground">
                <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Defina prazos e faça upload de arquivos de referência (PDF)</span>
              </li>
              <li class="flex items-start gap-2 text-sm text-muted-foreground">
                <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Avalie submissões dos alunos e atribua notas</span>
              </li>
              <li class="flex items-start gap-2 text-sm text-muted-foreground">
                <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>Visualize o detalhe de cada submissão entregue</span>
              </li>
            </template>
          </ul>
        </CardContent>
      </Card>

      <!-- Relatórios — teacher + admin -->
      <Card v-if="authStore.isTeacher || authStore.isAdmin">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <FileBarChart2 class="h-5 w-5" />
            </div>
            <div>
              <CardTitle class="text-base">Relatórios</CardTitle>
              <CardDescription>Métricas de desempenho por turma</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <ul class="space-y-1.5">
            <li class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Visualize a quantidade de submissões por mês</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Analise a média de notas por turma</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Filtre os dados por período para análise detalhada</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <!-- Usuários — admin only -->
      <Card v-if="authStore.isAdmin">
        <CardHeader>
          <div class="flex items-center gap-3">
            <div class="p-2 rounded-lg bg-red-500/10 text-red-500">
              <Users class="h-5 w-5" />
            </div>
            <div>
              <CardTitle class="text-base">Usuários</CardTitle>
              <CardDescription>Gerencie todos os usuários da plataforma</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <ul class="space-y-1.5">
            <li class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Crie contas para alunos, professores e administradores</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Edite informações e altere o role de usuários existentes</span>
            </li>
            <li class="flex items-start gap-2 text-sm text-muted-foreground">
              <Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <span>Remova usuários inativos da plataforma</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </main>
</template>
