<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <BackButton class="mb-4" />

    <Loader v-if="loading" />
    <ErrorState v-else-if="error" :message="error" @retry="fetchData" />
    <div v-else-if="manga" class="space-y-8">
      <div class="relative rounded-3xl overflow-hidden">
        <div class="absolute inset-0">
          <img
            :src="manga.coverImage.large"
            :alt="manga.title.romaji"
            class="w-full h-full object-cover blur-xl scale-110 opacity-30"
          />
        </div>
        <div class="relative glass-card border-0 p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
          <div class="md:w-1/3 lg:w-1/4 flex-shrink-0 -mt-12 md:mt-0">
            <img
              :src="manga.coverImage.large"
              :alt="manga.title.romaji"
              class="w-full rounded-2xl shadow-2xl ring-4 ring-accent/20"
            />
          </div>

          <div class="flex-1 space-y-4">
            <div>
              <h1 class="text-3xl md:text-4xl font-bold text-foreground">{{ manga.title.romaji }}</h1>
              <p v-if="manga.title.english" class="text-lg text-muted">{{ manga.title.english }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <span class="px-3 py-1 bg-accent/20 rounded-full text-sm flex items-center gap-1">
                <span class="text-yellow-400">★</span> {{ manga.averageScore ? (manga.averageScore / 10).toFixed(1) : '?' }}
              </span>
              <span class="px-3 py-1 bg-secondary/50 rounded-full text-sm">{{ manga.chapters || '?' }} chapters</span>
              <span class="px-3 py-1 bg-secondary/50 rounded-full text-sm">{{ manga.volumes || '?' }} volumes</span>
              <span class="px-3 py-1 bg-secondary/50 rounded-full text-sm">{{ manga.status }}</span>
              <span v-if="manga.startDate?.year" class="px-3 py-1 bg-secondary/50 rounded-full text-sm">{{ manga.startDate.year }}</span>
            </div>

            <div class="glass-card bg-secondary/30 p-4 border-0">
              <p class="text-foreground leading-relaxed" v-html="manga.description || 'No description available.'"></p>
            </div>
          </div>
        </div>
      </div>

      <section v-if="recommendations.length" class="space-y-4">
        <h2 class="text-2xl font-semibold text-accent">you might also like</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <MangaCard v-for="item in recommendations" :key="item.id" :manga="item" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '@/services/api'
import type { AniListManga } from '@/types/anime'
import BackButton from '@/components/BackButton.vue'
import Loader from '@/components/Loader.vue'
import ErrorState from '@/components/ErrorState.vue'
import MangaCard from '@/components/MangaCard.vue'

const route = useRoute()
const manga = ref<AniListManga | null>(null)
const recommendations = ref<AniListManga[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const id = Number(route.params.id)
    manga.value = await api.getMangaById(id)
    const recs = await api.getMangaRecommendations(id)
    recommendations.value = recs.slice(0, 20)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load'
    recommendations.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
watch(() => route.params.id, fetchData)
</script>
