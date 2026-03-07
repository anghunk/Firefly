<script setup lang="ts">
import type { Category } from '../../types';

const props = defineProps<{
  category: Category;
  isSelected: boolean;
  isContextMenuActive?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
}>();

const emit = defineEmits<{
  click: [];
  rename: [];
  delete: [];
  dragStart: [id: string];
  dragEnd: [];
  dragOver: [id: string];
  dragLeave: [];
  drop: [id: string];
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

function handleDragStart(e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', props.category.id);
  }
  // Small delay to let the drag image be created before applying opacity
  setTimeout(() => {
    emit('dragStart', props.category.id);
  }, 0);
}

function handleDragEnd() {
  emit('dragEnd');
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  // Only emit if entering from outside this element
  const currentTarget = e.currentTarget as HTMLElement;
  const relatedTarget = e.relatedTarget as HTMLElement | null;
  if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
    emit('dragOver', props.category.id);
  }
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
}

function handleDragLeave(e: DragEvent) {
  // Only fire if leaving the element entirely (not just entering a child)
  const currentTarget = e.currentTarget as HTMLElement;
  const relatedTarget = e.relatedTarget as HTMLElement | null;
  // If relatedTarget is null or not inside currentTarget, we're leaving the element
  if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
    emit('dragLeave');
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  emit('drop', props.category.id);
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
          : 'hover:bg-gray-50 dark:hover:bg-gray-900',
      isDragging && 'opacity-50',
      isDragOver && 'bg-blue-50 dark:bg-blue-900/20'
    ]"
    draggable="true"
    @click="handleClick"
    @contextmenu="handleContextMenu"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @dragenter="handleDragEnter"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div class="flex items-center gap-2 min-w-0 pointer-events-none">
      <PhFolderSimple :size="16" class="text-gray-400 flex-shrink-0" />
      <span class="text-base truncate">{{ category.name }}</span>
      <span v-if="category.noteCount > 0" class="text-xs text-gray-400 flex-shrink-0">
        {{ category.noteCount }}
      </span>
    </div>
  </div>
</template>