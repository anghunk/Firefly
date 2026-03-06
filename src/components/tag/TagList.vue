<script setup lang="ts">

defineProps<{
  tags: string[];
  editable?: boolean;
}>();

const emit = defineEmits<{
  removeTag: [tag: string];
  addTag: [];
}>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-1">
    <span
      v-for="tag in tags"
      :key="tag"
      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
    >
      {{ tag }}
      <button
        v-if="editable"
        class="hover:text-red-500"
        @click="emit('removeTag', tag)"
      >
        ×
      </button>
    </span>
    <button
      v-if="editable"
      class="px-2 py-0.5 text-xs rounded border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
      @click="emit('addTag')"
    >
      + 添加标签
    </button>
  </div>
</template>