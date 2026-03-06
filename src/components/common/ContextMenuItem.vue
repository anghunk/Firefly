<script setup lang="ts">
defineProps<{
  danger?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    class="w-full px-3 py-1.5 text-left text-sm flex items-center gap-2 transition-colors"
    :class="danger
      ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
      : 'hover:bg-gray-100 dark:hover:bg-gray-800'"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>