<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  close: [];
}>();

const menuRef = ref<HTMLElement | null>(null);
const position = ref({ x: 0, y: 0 });

// Adjust position to keep menu in viewport
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    requestAnimationFrame(() => {
      if (menuRef.value) {
        const rect = menuRef.value.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = props.x;
        let y = props.y;

        if (x + rect.width > viewportWidth) {
          x = viewportWidth - rect.width - 8;
        }
        if (y + rect.height > viewportHeight) {
          y = viewportHeight - rect.height - 8;
        }

        position.value = { x, y };
      }
    });
  }
});

function handleClickOutside(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit('close');
  }
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close');
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleEscape);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-100"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        ref="menuRef"
        class="fixed z-50 min-w-[120px] py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
      >
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>