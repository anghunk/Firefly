<script setup lang="ts">
import { ref } from 'vue';
import { PhFileText, PhPencilSimple, PhTrash, PhFolderOpen } from '@phosphor-icons/vue';
import type { Note } from '../../types';
import { ContextMenu, ContextMenuItem } from '../common';

const props = defineProps<{
  note: Note;
  isSelected: boolean;
}>();

const emit = defineEmits<{
  click: [];
  rename: [];
  delete: [];
  openInExplorer: [];
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

function handleOpenInExplorer() {
  showContextMenu.value = false;
  emit('openInExplorer');
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
      'group flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
      isSelected
        ? 'bg-gray-100 dark:bg-gray-800'
        : 'hover:bg-gray-50 dark:hover:bg-gray-900'
    ]"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <PhFileText :size="16" class="text-gray-400 flex-shrink-0" />
    <div class="text-base truncate" :title="tooltipText">{{ note.title }}</div>
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
    <ContextMenuItem @click="handleOpenInExplorer">
      <PhFolderOpen :size="16" />
      <span>打开资源管理器</span>
    </ContextMenuItem>
    <ContextMenuItem danger @click="handleDelete">
      <PhTrash :size="16" />
      <span>删除</span>
    </ContextMenuItem>
  </ContextMenu>
</template>