<script setup lang="ts">
import { ref, watch } from 'vue';
import { Command } from '@tauri-apps/plugin-shell';
import { useCategoryStore, useNoteStore } from '../../stores';
import NoteList from '../note/NoteList.vue';
import NoteForm from '../note/NoteForm.vue';
import NoteRenameModal from '../note/NoteRenameModal.vue';
import ConfirmDialog from '../common/ConfirmDialog.vue';
import type { Note } from '../../types';

const categoryStore = useCategoryStore();
const noteStore = useNoteStore();

const showCreateForm = ref(false);
const showRenameModal = ref(false);
const showDeleteConfirm = ref(false);
const noteToRename = ref<Note | null>(null);
const noteToDelete = ref<Note | null>(null);

watch(() => categoryStore.selectedCategoryId, async (categoryId) => {
  if (categoryId) {
    await noteStore.fetchNotes(categoryId);
  } else {
    noteStore.clearNotes();
  }
});

function handleRenameNote(note: Note) {
  noteToRename.value = note;
  showRenameModal.value = true;
}

async function handleRenameSubmit(newTitle: string) {
  if (noteToRename.value) {
    await noteStore.renameNote(noteToRename.value.path, newTitle);
    showRenameModal.value = false;
    noteToRename.value = null;
  }
}

function handleDeleteNote(note: Note) {
  noteToDelete.value = note;
  showDeleteConfirm.value = true;
}

async function confirmDelete() {
  if (noteToDelete.value) {
    await noteStore.deleteNote(noteToDelete.value.path);
    showDeleteConfirm.value = false;
    noteToDelete.value = null;
  }
}

async function handleOpenInExplorer(note: Note) {
  // Windows: use explorer /select to open and highlight the file
  await Command.create('explorer', ['/select,', note.path]).execute();
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 h-10 border-b border-gray-200 dark:border-gray-800">
      <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
        {{ categoryStore.selectedCategory?.name || '笔记' }}
      </span>
      <button
        v-if="categoryStore.selectedCategoryId"
        class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        @click="showCreateForm = true"
        title="新建笔记"
      >
        <PhHighlighter :size="14" />
      </button>
    </div>

    <!-- Note List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="noteStore.isLoading" class="px-3 py-4 text-xs text-gray-400 text-center">
        加载中...
      </div>
      <NoteList
        v-else-if="noteStore.notes.length > 0"
        :notes="noteStore.notes"
        :selected-id="noteStore.selectedNoteId"
        @select="noteStore.selectNote"
        @rename="handleRenameNote"
        @delete="handleDeleteNote"
        @open-in-explorer="handleOpenInExplorer"
      />
      <div v-else-if="categoryStore.selectedCategoryId" class="px-3 py-4 text-xs text-gray-400 text-center">
        暂无笔记
      </div>
      <div v-else class="px-3 py-4 text-xs text-gray-400 text-center">
        请选择分类
      </div>
    </div>

    <!-- Create Note Form -->
    <NoteForm
      v-if="categoryStore.selectedCategoryId"
      :is-open="showCreateForm"
      :category-id="categoryStore.selectedCategoryId"
      @close="showCreateForm = false"
      @submit="showCreateForm = false"
    />

    <!-- Rename Modal -->
    <NoteRenameModal
      v-if="noteToRename"
      :is-open="showRenameModal"
      :current-title="noteToRename.title"
      @close="showRenameModal = false; noteToRename = null"
      @submit="handleRenameSubmit"
    />

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      :is-open="showDeleteConfirm"
      title="删除笔记"
      :message="`确定要删除笔记「${noteToDelete?.title}」吗？此操作将移至回收站。`"
      confirm-text="删除"
      @cancel="showDeleteConfirm = false; noteToDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>