<template>
  <div class="max-w-md mx-auto glass-card p-8">
    <BackButton class="mb-4" />
    <h1 class="text-3xl font-bold mb-6 text-accent">forgot password</h1>

    <div v-if="!submitted">
      <form @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <input
            v-model="email"
            type="email"
            placeholder="enter your email"
            required
            class="w-full bg-secondary border border-theme rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-muted"
          />
          <button
            type="submit"
            class="w-full btn-primary"
            :disabled="loading"
          >
            <span v-if="loading">sending...</span>
            <span v-else>send reset link</span>
          </button>
        </div>
      </form>

      <p v-if="error" class="mt-4 text-red-400 text-sm">{{ error }}</p>
    </div>

    <div v-else class="text-center space-y-4">
      <div class="w-16 h-16 mx-auto bg-accent/20 rounded-full flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 text-accent">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </div>
      <p class="text-foreground">check your email</p>
      <p class="text-sm text-muted">
        if an account exists for <span class="text-accent">{{ email }}</span>, we've sent a password reset link.
      </p>
      <button @click="submitted = false; email = ''" class="text-accent hover:underline text-sm">
        try another email
      </button>
    </div>

    <p class="mt-4 text-center text-sm text-muted">
      remember your password?
      <router-link to="/login" class="text-accent hover:underline">login</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/services/api'
import BackButton from '@/components/BackButton.vue'

const email = ref('')
const loading = ref(false)
const error = ref('')
const submitted = ref(false)

async function handleSubmit() {
  loading.value = true
  error.value = ''
  try {
    await api.forgotPassword(email.value)
    submitted.value = true
  } catch (err: any) {
    error.value = err.message || 'something went wrong'
  } finally {
    loading.value = false
  }
}
</script>
