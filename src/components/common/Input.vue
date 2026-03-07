<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  type?: string;
  autofocus?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  keydown: [event: KeyboardEvent];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

watch(() => props.autofocus, async (shouldFocus) => {
  if (shouldFocus) {
    await nextTick();
    inputRef.value?.focus();
  }
}, { immediate: true });
</script>

<template>
  <input
    ref="inputRef"
    :type="type || 'text'"
    :value="modelValue"
    :placeholder="placeholder"
    class="w-full h-9 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @keydown="emit('keydown', $event)"
  />
</template>