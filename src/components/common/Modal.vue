<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  isOpen: boolean;
  title?: string;
  closeOnBackdrop?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}>(), {
  size: 'md',
});

const emit = defineEmits<{
  close: [];
}>();

const sizeClasses = computed(() => {
  const sizes: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-[400px]',
    lg: 'max-w-[80%]',
    xl: 'max-w-4xl',
  };
  return sizes[props.size];
});

function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    emit('close');
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click="closeOnBackdrop !== false && handleBackdropClick($event)"
      >
        <Transition
          enter-active-class="transition-transform duration-150"
          enter-from-class="scale-95"
          enter-to-class="scale-100"
          leave-active-class="transition-transform duration-150"
          leave-from-class="scale-100"
          leave-to-class="scale-95"
        >
          <div
            v-if="isOpen"
            :class="['bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 mx-4 w-full', sizeClasses]"
          >
            <div v-if="title" class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 class="text-sm font-medium">{{ title }}</h3>
            </div>
            <div class="p-4">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>