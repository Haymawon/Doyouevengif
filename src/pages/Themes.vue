<template>
  <div class="max-w-2xl mx-auto space-y-8">
    <BackButton class="mb-4" />
    <h1 class="text-4xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">choose your theme</h1>

    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <button
        v-for="t in themes"
        :key="t.id"
        @click="themeStore.setTheme(t.id)"
        class="glass-card p-6 text-left hover:scale-105 transition-transform duration-200"
        :class="{ 'ring-2 ring-accent': themeStore.theme === t.id }"
      >
        <div class="w-full h-24 rounded-lg mb-4" :style="{ backgroundColor: t.preview }"></div>
        <h3 class="font-semibold text-lg text-foreground">{{ t.name }}</h3>
        <p class="text-sm text-muted">{{ t.description }}</p>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/theme'
import BackButton from '@/components/BackButton.vue'

const themeStore = useThemeStore()

type ThemeId = 'dark-purple' | 'light-pink' | 'dark-blue'
interface ThemeOption {
  id: ThemeId
  name: string
  description: string
  preview: string
}
const themes: ThemeOption[] = [
  { id: 'dark-purple', name: 'Dark Purple', description: 'Sleek and mysterious', preview: '#0b0710' },
  { id: 'light-pink', name: 'Light Pink', description: 'Soft and cute', preview: '#ff8fc7' },
  { id: 'dark-blue', name: 'Dark Blue', description: 'Deep ocean vibes', preview: '#0a1929' },
]
</script>
