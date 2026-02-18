<template>
  <div
    v-if="suggestions.length > 0 && show"
    class="absolute top-full left-0 right-0 mt-2 glass-card overflow-hidden z-20 border border-theme divide-y divide-theme/20"
  >
    <div
      v-for="(item, index) in suggestions"
      :key="index"
      class="p-3 hover:bg-accent/20 cursor-pointer transition flex items-center gap-3"
      @click="selectSuggestion(item)"
    >
      <img
        v-if="item.image"
        :src="item.image"
        class="w-8 h-8 rounded object-cover"
        :alt="item.title"
      />
      <div class="flex-1">
        <p class="font-medium text-foreground text-sm">{{ item.title }}</p>
        <p class="text-xs text-muted">{{ item.type }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'

export interface Suggestion {
  title: string
  type: 'anime' | 'manga'
  image?: string
  id: number
}

defineProps({
  suggestions: {
    type: Array as PropType<Suggestion[]>,
    default: () => []
  },
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select'])

function selectSuggestion(item: Suggestion) {
  emit('select', item)
}
</script>
