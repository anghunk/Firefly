<script setup lang="ts">
import { ref } from 'vue';
import { PhFolderSimple, PhPencilSimple, PhTrash } from '@phosphor-icons/vue';
import type { Category } from '../../types';
import { ContextMenu, ContextMenuItem } from '../common';

const props = defineProps<{
  category: Category;
  isSelected: boolean;
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
}>();

const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

function handleClick() {
  emit('click');
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  showContextMenu.value = true;
}

function handleRename() {
  showContextMenu.value = false;
  emit('rename');
}

function handleDelete() {
  showContextMenu.value = false;
  emit('delete');
}

function handleDragStart(e: DragEvent) {
  console.log('[CategoryItem] dragStart:', props.category.name, props.category.id);
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', props.category.id);
  }
  // Add drag image
  if (e.target) {
    const target = e.target as HTMLElement;
    setTimeout(() => {
      target.style.opacity = '0.5';
    }, 0);
  }
  emit('dragStart', props.category.id);
}

function handleDragEnd(e: DragEvent) {
  console.log('[CategoryItem] dragEnd:', props.category.name);
  if (e.target) {
    const target = e.target as HTMLElement;
    target.style.opacity = '';
  }
  emit('dragEnd');
}

function handleDragEnter(e: DragEvent) {
  e.preventDefault();
  console.log('[CategoryItem] dragEnter:', props.category.name);
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
  emit('dragOver', props.category.id);
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move';
  }
}

function handleDragLeave(e: DragEvent) {
  // Only fire if leaving the element entirely
  const target = e.target as HTMLElement;
  const relatedTarget = e.relatedTarget as HTMLElement;
  if (!target.contains(relatedTarget)) {
    emit('dragLeave');
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  console.log('[CategoryItem] drop on:', props.category.name, props.category.id);
  emit('drop', props.category.id);
}
</script>

<template>
  <div
    :class="[
      'group flex items-center justify-between px-3 py-2 cursor-pointer transition-colors select-none',
      isSelected
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
      <span class="text-sm truncate">{{ category.name }}</span>
      <span v-if="category.noteCount > 0" class="text-xs text-gray-400 flex-shrink-0">
        {{ category.noteCount }}
      </span>
    </div>
  </div>

  <!-- Context Menu -->
  <ContextMenu
    :is-open="showContextMenu"
    :x="contextMenuX"
    :y="contextMenuY"
    @close="showContextMenu = false"
  >
    <ContextMenuItem @click="handleRename">
      <PhPencilSimple :size="16" />
      <span>重命名</span>
    </ContextMenuItem>
    <ContextMenuItem danger @click="handleDelete">
      <PhTrash :size="16" />
      <span>删除</span>
    </ContextMenuItem>
  </ContextMenu>
</template>