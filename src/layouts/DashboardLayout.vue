<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { BookOpen, ClipboardList, FileBarChart2, GraduationCap, House, Info, KeyRound, LogOut, Users } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth.store'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { name: 'home', label: 'Home', icon: House },
  { name: 'classes', label: 'Turmas', icon: BookOpen },
  { name: 'tasks', label: 'Tarefas', icon: ClipboardList },
  { name: 'reports', label: 'Relatórios', icon: FileBarChart2, teacherOrAdmin: true },
  { name: 'users', label: 'Usuários', icon: Users, adminOnly: true },
  { name: 'about', label: 'Sobre', icon: Info },
]

const visibleNavItems = computed(() =>
  navItems.filter((item) => {
    if (item.adminOnly && !authStore.isAdmin) return false
    if (item.teacherOrAdmin && !authStore.isAdmin && !authStore.isTeacher) return false
    return true
  }),
)

const extraLabels: Record<string, string> = {
  'task-detail': 'Detalhe da Tarefa',
  'change-password': 'Alterar Senha',
}

const pageLabel = computed(() => {
  const item = navItems.find((i) => i.name === route.name)
  return item?.label ?? extraLabels[String(route.name)] ?? String(route.name ?? '')
})

const userInitials = computed(() => {
  const name = authStore.user?.name ?? ''
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
})

const userRole = computed(() => {
  const map: Record<string, string> = { admin: 'Admin', teacher: 'Professor', student: 'Aluno' }
  return map[authStore.user?.role ?? ''] ?? ''
})

function handleLogout() {
  router.push({ name: 'logout' })
}
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child>
              <RouterLink :to="{ name: 'home' }">
                <div
                  class="flex aspect-square size-8 items-center justify-center"
                >
                  <img class="h-full" src="../assets/IclassIcon.png" alt="Icon Iclass" />
                </div>
                <div class="flex flex-col gap-0.5 leading-none">
                  <span class="font-semibold">iClass</span>
                  <span class="text-xs text-muted-foreground">Plataforma</span>
                </div>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in visibleNavItems" :key="item.name">
            <SidebarMenuButton
              as-child
              :is-active="route.name === item.name"
              :tooltip="item.label"
              class="group-data-[collapsible=icon]:[&>span:last-child]:hidden group-data-[collapsible=icon]:justify-center"
            >
              <RouterLink :to="{ name: item.name }">
                <component :is="item.icon" />
                <span>{{ item.label }}</span>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar class="size-8 rounded-lg">
                    <AvatarFallback class="rounded-lg text-xs">
                      {{ userInitials }}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex flex-col gap-0.5 leading-none truncate">
                    <span class="font-semibold truncate">{{ authStore.user?.name }}</span>
                    <span class="text-xs text-muted-foreground truncate">{{ userRole }}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" class="w-56" align="start">
                <DropdownMenuLabel class="flex flex-col gap-0.5">
                  <span class="font-medium">{{ authStore.user?.name }}</span>
                  <span class="text-xs text-muted-foreground font-normal">{{ authStore.user?.email }}</span>
                </DropdownMenuLabel>
                <DropdownMenuItem class="cursor-pointer" @click="router.push({ name: 'change-password' })">
                  <KeyRound class="mr-2 size-4" />
                  Alterar senha
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem class="cursor-pointer text-destructive focus:text-destructive" @click="handleLogout">
                  <LogOut class="mr-2 size-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>

    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{{ pageLabel }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div class="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main class="flex flex-1 flex-col gap-4 p-6">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
