<script setup lang="ts">
import type { Note } from '../../types';

const props = defineProps<{
  note: Note;
  isSelected: boolean;
  isContextMenuActive?: boolean;
}>();

const emit = defineEmits<{
  click: [];
  rename: [];
  delete: [];
  openInExplorer: [];
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

function formatDateTime(dateStr: string): string {
  return dateStr.replace('T', ' ');
}

const tooltipText = `创建时间：${formatDateTime(props.note.createdAt)}
编辑时间：${formatDateTime(props.note.updatedAt)}`;
</script>

<template>
  <div
    :class="[
      'group flex items-center gap-2 px-3 py-2 cursor-pointer',
      isContextMenuActive
        ? 'bg-blue-50 dark:bg-blue-900/30'
        : isSelected
          ? 'bg-gray-100 dark:bg-gray-800'
          : 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900'
    ]"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <PhFileText :size="16" class="text-gray-400 flex-shrink-0" />
    <div class="text-base truncate" :title="tooltipText">{{ note.title }}</div>
  </div>
</template>