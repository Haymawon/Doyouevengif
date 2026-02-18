<template>
  <router-link
    :to="{ name: 'MangaDetail', params: { id: manga.id } }"
    class="glass-card overflow-hidden group relative transition-transform hover:-translate-y-1 hover:glow block focus:outline-none focus:ring-2 focus:ring-accent"
  >
    <div class="aspect-[2/3] overflow-hidden bg-secondary relative">
      <img
        :src="manga.coverImage.large"
        :alt="manga.title.romaji"
        class="w-full h-full object-cover group-hover:scale-110 transition duration-500"
        loading="lazy"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-bg-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <div class="w-12 h-12 rounded-full bg-accent/90 flex items-center justify-center backdrop-blur-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="white" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </div>
    </div>

    <div class="p-3">
      <h3 class="font-medium text-sm leading-tight line-clamp-1 text-foreground">{{ manga.title.romaji }}</h3>
      <p class="text-xs text-muted mt-1 line-clamp-2" v-html="manga.description?.replace(/<[^>]*>/g, '').slice(0, 80) + '…'"></p>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { AniListManga } from '@/types/anime'

defineProps<{ manga: AniListManga }>()
</script>
