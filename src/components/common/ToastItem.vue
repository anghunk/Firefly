<script setup lang="ts">
import type { Toast } from '../../composables/useToast';

defineProps<{
  toast: Toast;
}>();

const emit = defineEmits<{
  close: [];
}>();

const typeIcons: Record<string, string> = {
  success: '✓',
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
};

const typeClasses: Record<string, string> = {
  success: 'bg-green-500 dark:bg-green-600',
  info: 'bg-blue-500 dark:bg-blue-600',
  warning: 'bg-yellow-500 dark:bg-yellow-600',
  error: 'bg-red-500 dark:bg-red-600',
};

const iconBgClasses: Record<string, string> = {
  success: 'bg-green-100 dark:bg-green-900/30',
  info: 'bg-blue-100 dark:bg-blue-900/30',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30',
  error: 'bg-red-100 dark:bg-red-900/30',
};

const textColorClasses: Record<string, string> = {
  success: 'text-green-600 dark:text-green-400',
  info: 'text-blue-600 dark:text-blue-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  error: 'text-red-600 dark:text-red-400',
};
</script>

<template>
  <div
    class="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
  >
    <div
      :class="['flex items-center justify-center w-8 h-8 rounded-full', iconBgClasses[toast.type]]"
    >
      <span :class="['text-sm font-bold', textColorClasses[toast.type]]">
        {{ typeIcons[toast.type] }}
      </span>
    </div>
    <p class="flex-1 text-sm text-gray-700 dark:text-gray-300">
      {{ toast.message }}
    </p>
    <button
      class="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      @click="emit('close')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>