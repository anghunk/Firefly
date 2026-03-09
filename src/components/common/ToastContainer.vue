<script setup lang="ts">
import { Transition } from 'vue';
import type { Toast } from '../../composables/useToast';

defineProps<{
  toasts: Toast[];
}>();

const emit = defineEmits<{
  close: [id: string];
}>();
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <template v-for="toast in toasts" :key="toast.id">
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 translate-x-4"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 translate-x-4"
        >
          <div class="pointer-events-auto">
            <ToastItem :toast="toast" @close="emit('close', toast.id)" />
          </div>
        </Transition>
      </template>
    </div>
  </Teleport>
</template>