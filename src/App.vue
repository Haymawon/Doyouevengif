<template>
  <div class="min-h-screen flex flex-col bg-primary text-foreground" :class="`theme-${themeStore.theme}`">
    <header class="glass-card border-0 sticky top-0 z-10 backdrop-blur-md border-theme">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-3 group">
          <div class="w-8 h-8 accent-bg rounded-lg flex items-center justify-center shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform duration-200">
            <span class="text-white font-bold text-lg">G</span>
          </div>
          <span class="text-xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">evengif</span>
        </router-link>

        <nav class="hidden md:flex items-center gap-1">
          <router-link to="/" class="nav-link">Home</router-link>
          <router-link to="/anime" class="nav-link">Anime</router-link>
          <router-link to="/manga" class="nav-link">Manga</router-link>
          <router-link to="/themes" class="nav-link">Themes</router-link>
        </nav>

        <div class="flex items-center gap-4">
          <button @click="mobileMenuOpen = !mobileMenuOpen" class="md:hidden text-muted hover:text-accent transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          <div v-if="auth.user" class="relative" v-click-outside="closeProfileDropdown">
            <button @click="profileDropdown = !profileDropdown" class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full accent-bg flex items-center justify-center text-sm font-bold uppercase hover:scale-110 transition-transform">
                {{ auth.user.name.charAt(0) }}
              </div>
            </button>
            <div v-if="profileDropdown" class="absolute right-0 mt-2 w-48 glass-card rounded-lg overflow-hidden z-20 border border-theme">
              <router-link to="/profile" class="block px-4 py-2 hover:bg-accent/20 transition" @click="profileDropdown = false">Profile</router-link>
              <button @click="logout" class="block w-full text-left px-4 py-2 hover:bg-accent/20 transition">Logout</button>
            </div>
          </div>
          <router-link v-else to="/login" class="btn-primary text-sm">Login</router-link>
        </div>
      </div>

      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="transform -translate-y-2 opacity-0"
        enter-to-class="transform translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="transform translate-y-0 opacity-100"
        leave-to-class="transform -translate-y-2 opacity-0"
      >
        <div v-if="mobileMenuOpen" class="md:hidden glass-card border-t border-theme p-4">
          <nav class="flex flex-col space-y-2">
            <router-link to="/" class="nav-link" @click="mobileMenuOpen = false">Home</router-link>
            <router-link to="/anime" class="nav-link" @click="mobileMenuOpen = false">Anime</router-link>
            <router-link to="/manga" class="nav-link" @click="mobileMenuOpen = false">Manga</router-link>
            <router-link to="/about" class="nav-link" @click="mobileMenuOpen = false">About</router-link>
            <router-link to="/themes" class="nav-link" @click="mobileMenuOpen = false">Themes</router-link>
          </nav>
        </div>
      </transition>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
      <router-view />
    </main>

    <Footer />
  </div>
</template>

<script setup lang="ts">
import Footer from './components/Footer.vue'
import { ref } from 'vue'
import { useAuthStore } from './stores/auth'
import { useThemeStore } from './stores/theme'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const themeStore = useThemeStore()
const router = useRouter()
const mobileMenuOpen = ref(false)
const profileDropdown = ref(false)

const closeProfileDropdown = () => {
  profileDropdown.value = false
}

function logout() {
  auth.logout()
  profileDropdown.value = false
  router.push('/')
}
</script>
