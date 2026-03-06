<script setup lang="ts">
defineProps<{
  modelValue: string;
  placeholder?: string;
  type?: string;
  autofocus?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  keydown: [event: KeyboardEvent];
}>();
</script>

<template>
  <input
    :type="type || 'text'"
    :value="modelValue"
    :placeholder="placeholder"
    :autofocus="autofocus"
    class="w-full h-9 px-3 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    @keydown="emit('keydown', $event)"
  />
</template>