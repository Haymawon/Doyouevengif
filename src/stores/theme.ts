import { defineStore } from 'pinia'
import { ref } from 'vue'

export type Theme = 'dark-purple' | 'light-pink' | 'dark-blue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<Theme>((localStorage.getItem('theme') as Theme) || 'dark-purple')

  function setTheme(newTheme: Theme) {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  function applyTheme(themeName: Theme) {
    const root = document.documentElement
    root.classList.remove('theme-dark-purple', 'theme-light-pink', 'theme-dark-blue')
    root.classList.add(`theme-${themeName}`)
  }

  applyTheme(theme.value)

  return { theme, setTheme }
})
