<template>
  <footer class="w-full bg-secondary/80 text-muted py-6 mt-12 border-t border-theme">
    <div class="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="font-bold text-accent">DoYouEvenGif</span>
        <span class="text-xs">© {{ new Date().getFullYear() }}</span>
      </div>
      <div class="flex gap-4 text-sm">
        <router-link to="/about" class="hover:text-accent transition">About</router-link>
        <router-link to="/privacy" class="hover:text-accent transition">Privacy</router-link>
        <router-link to="/terms" class="hover:text-accent transition">Terms</router-link>
        <a href="https://github.com/hayma/doyouevengif" target="_blank" class="hover:text-accent transition">GitHub</a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// No script needed for static footer
</script>

<style scoped>
footer {
  backdrop-filter: blur(6px);
}
</style>
