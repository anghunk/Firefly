<script setup lang="ts">
import {
  PhCheck,
  PhInfo,
  PhWarning,
  PhX,
} from '@phosphor-icons/vue';
import type { Toast } from '../../composables/useToast';

defineProps<{
  toast: Toast;
}>();

const emit = defineEmits<{
  close: [];
}>();

const typeIcons: Record<string, any> = {
  success: PhCheck,
  info: PhInfo,
  warning: PhWarning,
  error: PhX,
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
    class="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[280px] max-w-md"
  >
    <div
      :class="['flex items-center justify-center flex-shrink-0']"
    >
      <component :is="typeIcons[toast.type]" :class="['text-xl', textColorClasses[toast.type]]" weight="fill" />
    </div>
    <p class="flex-1 text-sm text-gray-700 dark:text-gray-300">
      {{ toast.message }}
    </p>
    <button
      class="flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
      @click="emit('close')"
    >
      <PhX class="w-4 h-4" />
    </button>
  </div>
</template>