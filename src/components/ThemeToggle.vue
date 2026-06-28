<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { useThemeStore } from '@/stores/theme.store'
import { Button } from '@/components/ui/button'

const themeStore = useThemeStore()
</script>

<template>
  <Button variant="ghost" size="icon" @click="themeStore.toggle()">
    <Sun v-if="themeStore.theme === 'dark'" class="size-4" />
    <Moon v-else class="size-4" />
  </Button>
</template>
