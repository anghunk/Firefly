<script setup lang="ts">
defineProps<{
  tags: string[];
  selectedTags: string[];
}>();

const emit = defineEmits<{
  toggleTag: [tag: string];
}>();
</script>

<template>
  <div v-if="tags.length > 0" class="px-3 py-2 border-b border-gray-200 dark:border-gray-800">
    <div class="flex items-center gap-1 mb-2">
      <PhTag :size="12" class="text-gray-400" />
      <span class="text-xs text-gray-500 dark:text-gray-400">标签筛选</span>
    </div>
    <div class="flex flex-wrap gap-1">
      <button
        v-for="tag in tags"
        :key="tag"
        :class="[
          'px-2 py-0.5 text-xs rounded transition-colors',
          selectedTags.includes(tag)
            ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        ]"
        @click="emit('toggleTag', tag)"
      >
        {{ tag }}
      </button>
    </div>
  </div>
</template>