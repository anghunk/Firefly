<script setup lang="ts">
defineProps<{
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <button
    :class="[
      'px-3 py-1.5 text-sm rounded transition-colors',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variant === 'primary' && 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100',
      variant === 'secondary' && 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
      variant === 'danger' && 'bg-red-500 text-white hover:bg-red-600',
    ]"
    :disabled="disabled || loading"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>