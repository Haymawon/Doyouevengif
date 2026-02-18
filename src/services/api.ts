import { useAuthStore } from '@/stores/auth'
import type { JikanAnime, AniListManga } from '@/types/anime'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const auth = useAuthStore()
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  const headers = new Headers(options.headers || {})
  if (auth.token) {
    headers.set('Authorization', `Bearer ${auth.token}`)
  }
  headers.set('Content-Type', 'application/json')

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers
    })
    clearTimeout(timeoutId)

    if (!res.ok) {
      const error = await res.json().catch(() => ({}))
      throw new Error(error.error || 'Request failed')
    }
    return res.json()
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new Error('Request timeout – please try again')
    }
    throw err
  }
}

export const api = {
  // Auth
  register(data: { name: string; username: string; email: string; password: string; terms: boolean }) {
    return fetchWithAuth('/register', { method: 'POST', body: JSON.stringify(data) })
  },
  login(credentials: { username: string; password: string }) {
    return fetchWithAuth('/login', { method: 'POST', body: JSON.stringify(credentials) })
  },
  getProfile() {
    return fetchWithAuth('/profile')
  },
  updateProfile(data: { name?: string; username?: string }) {
    return fetchWithAuth('/profile', { method: 'PUT', body: JSON.stringify(data) })
  },

  // Password reset
  forgotPassword(email: string) {
    return fetchWithAuth('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  },
  resetPassword(token: string, password: string) {
    return fetchWithAuth('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    })
  },

  // Search
  searchAnime(query: string): Promise<JikanAnime[]> {
    return fetchWithAuth(`/search/anime?q=${encodeURIComponent(query)}`)
  },
  searchManga(query: string): Promise<AniListManga[]> {
    return fetchWithAuth(`/search/manga?q=${encodeURIComponent(query)}`)
  },

  // Details
  getAnimeById(id: number): Promise<JikanAnime> {
    return fetchWithAuth(`/anime/${id}`)
  },
  getMangaById(id: number): Promise<AniListManga> {
    return fetchWithAuth(`/manga/${id}`)
  },

  // Recommendations
  async getAnimeRecommendations(id: number): Promise<JikanAnime[]> {
    try {
      return await fetchWithAuth(`/recommendations/anime/${id}`)
    } catch {
      return []
    }
  },
  async getMangaRecommendations(id: number): Promise<any[]> {
    try {
      return await fetchWithAuth(`/recommendations/manga/${id}`)
    } catch {
      return []
    }
  },

  // Home
  getHomeRecommendations(): Promise<{ recommendations: JikanAnime[] }> {
    return fetchWithAuth('/home')
  },
}
