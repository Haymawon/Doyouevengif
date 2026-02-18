<template>
  <div class="max-w-md mx-auto glass-card p-8">
    <BackButton class="mb-4" />
    <h1 class="text-3xl font-bold mb-6 text-accent">login</h1>
    <form @submit.prevent="handleLogin">
      <div class="space-y-4">
        <input v-model="username" type="text" placeholder="username" required class="w-full bg-secondary border border-theme rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-muted">
        <input v-model="password" type="password" placeholder="password" required class="w-full bg-secondary border border-theme rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-muted">
        <button type="submit" class="w-full btn-primary">login</button>
      </div>
    </form>
    <p class="mt-4 text-center text-muted">
      don't have an account?
      <router-link to="/register" class="text-accent hover:underline">register</router-link>
    </p>
    <p class="text-center text-sm text-muted mt-2">
      <router-link to="/forgot-password" class="hover:text-accent">forgot password?</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import BackButton from '@/components/BackButton.vue'

const router = useRouter()
const auth = useAuthStore()
const username = ref('')
const password = ref('')

async function handleLogin() {
  try {
    const res = await api.login({ username: username.value, password: password.value })
    auth.setAuth(res.token, res.user)
    router.push('/')
  } catch (err: any) {
    alert(err.message)
  }
}
</script>
