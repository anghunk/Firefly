<script setup lang="ts">
import type { Category } from '../../types';

const props = defineProps<{
  category: Category;
  isSelected: boolean;
  isContextMenuActive?: boolean;
}>();

const emit = defineEmits<{
  click: [];
  rename: [];
  delete: [];
  contextmenu: [e: MouseEvent];
}>();

function handleClick() {
  emit('click');
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  emit('contextmenu', e);
}
</script>

<template>
  <div
    :class="[
      'group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors select-none',
      isContextMenuActive
        ? 'bg-blue-50 dark:bg-blue-900/30'
        : isSelected
          ? 'bg-gray-100 dark:bg-gray-800'
          : 'hover:bg-gray-50 dark:hover:bg-gray-900'
    ]"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <div class="flex items-center gap-2 min-w-0 pointer-events-none">
      <PhFolderOpen :size="16" class="text-gray-400 flex-shrink-0" />
      <span class="text-base truncate">{{ category.name }}</span>
      <span v-if="category.noteCount > 0" class="text-xs text-gray-400 flex-shrink-0">
        {{ category.noteCount }}
      </span>
    </div>
  </div>
</template>