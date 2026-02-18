<template>
  <button
    @click="goBack"
    class="flex items-center gap-2 text-muted hover:text-accent transition-colors duration-200 group"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="2"
      stroke="currentColor"
      class="w-5 h-5 transform transition-transform duration-200"
      :class="{ '-translate-x-1': isHovered }"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
    <span>back</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isHovered = ref(false)

// Use router.back() only, let scrollBehavior handle position
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>
