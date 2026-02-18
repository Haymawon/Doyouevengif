import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import type { JikanAnime } from '@/types/anime'

export const useHomeStore = defineStore('home', () => {
  const recommendations = ref<JikanAnime[]>([])

  async function fetchHome() {
    try {
      const data = await api.getHomeRecommendations()
      // Map exactly as you did in Home.vue
      recommendations.value = (data.recommendations as any[]).map((item) => ({
        mal_id: item.mal_id,
        title: item.title,
        images: item.images,
        synopsis: item.synopsis ?? '',
        episodes: item.episodes ?? null,
        score: item.score ?? null,
        year: item.year ?? null,
        status: item.status ?? '',
        type: item.type,
        duration: item.duration,
        rating: item.rating,
      })).filter((item) => 
        item.mal_id && 
        item.title && 
        item.images && 
        item.synopsis !== undefined && 
        item.episodes !== undefined && 
        item.score !== undefined && 
        item.status
      )
    } catch (err) {
      console.error('Failed to fetch home recommendations:', err)
    }
  }

  return { recommendations, fetchHome }
})
