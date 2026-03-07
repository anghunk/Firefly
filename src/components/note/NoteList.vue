<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Note } from '../../types';
import NoteItem from './NoteItem.vue';
import { ContextMenu, ContextMenuItem } from '../common';
import { useContextMenu } from '../../composables/useContextMenu';

defineProps<{
  notes: Note[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
  rename: [note: Note];
  delete: [note: Note];
  openInExplorer: [note: Note];
}>();

const { openMenu, closeMenu } = useContextMenu();
const MENU_ID = 'note-list';

const contextMenuNote = ref<Note | null>(null);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

// 监听全局关闭事件
function handleCloseContextMenu() {
  contextMenuNote.value = null;
}

onMounted(() => {
  window.addEventListener('close-context-menu', handleCloseContextMenu);
});

onUnmounted(() => {
  window.removeEventListener('close-context-menu', handleCloseContextMenu);
});

function handleContextMenu(note: Note, e: MouseEvent) {
  e.preventDefault();
  // 先关闭当前菜单，再打开新菜单
  contextMenuNote.value = null;
  requestAnimationFrame(() => {
    contextMenuX.value = e.clientX;
    contextMenuY.value = e.clientY;
    contextMenuNote.value = note;
    openMenu(MENU_ID);
  });
}

function closeContextMenu() {
  contextMenuNote.value = null;
  closeMenu();
}

function handleRename() {
  if (contextMenuNote.value) {
    emit('rename', contextMenuNote.value);
  }
  closeContextMenu();
}

function handleDelete() {
  if (contextMenuNote.value) {
    emit('delete', contextMenuNote.value);
  }
  closeContextMenu();
}

function handleOpenInExplorer() {
  if (contextMenuNote.value) {
    emit('openInExplorer', contextMenuNote.value);
  }
  closeContextMenu();
}
</script>

<template>
  <div class="pb-1">
    <NoteItem
      v-for="note in notes"
      :key="note.id"
      :note="note"
      :is-selected="note.id === selectedId"
      :is-context-menu-active="contextMenuNote?.id === note.id"
      @click="emit('select', note.id)"
      @rename="emit('rename', note)"
      @delete="emit('delete', note)"
      @open-in-explorer="emit('openInExplorer', note)"
      @contextmenu="(e) => handleContextMenu(note, e)"
    />

    <!-- Context Menu (managed at list level to ensure only one is open) -->
    <ContextMenu
      :is-open="contextMenuNote !== null"
      :x="contextMenuX"
      :y="contextMenuY"
      @close="closeContextMenu"
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
  </div>
</template>