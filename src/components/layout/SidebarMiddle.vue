<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Command } from '@tauri-apps/plugin-shell';
import { PhMagnifyingGlass, PhPlus, PhX } from '@phosphor-icons/vue';
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

// Search state
const searchQuery = ref('');

// Filtered notes based on search query
const filteredNotes = computed(() => {
  if (!searchQuery.value.trim()) {
    return noteStore.notes;
  }
  const query = searchQuery.value.toLowerCase();
  return noteStore.notes.filter(note =>
    note.title.toLowerCase().includes(query)
  );
});

function clearSearch() {
  searchQuery.value = '';
}

watch(() => categoryStore.selectedCategoryId, async (categoryId) => {
  if (categoryId) {
    await noteStore.fetchNotes(categoryId);
  } else {
    noteStore.clearNotes();
  }
  // Clear search when switching categories
  searchQuery.value = '';
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
    <!-- Header with Search -->
    <div class="flex items-center gap-2 px-3 h-10 border-b border-gray-200 dark:border-gray-800">
      <!-- Search Input -->
      <div class="flex-1 relative">
        <PhMagnifyingGlass
          :size="14"
          class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="categoryStore.selectedCategory?.name || '搜索笔记'"
          class="w-full h-7 pl-7 pr-6 text-sm bg-gray-100 dark:bg-gray-800 rounded border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-gray-200 placeholder:text-gray-400"
        />
        <button
          v-if="searchQuery"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="clearSearch"
        >
          <PhX :size="12" />
        </button>
      </div>
      <!-- Create Button -->
      <button
        v-if="categoryStore.selectedCategoryId"
        class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer"
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
        v-else-if="filteredNotes.length > 0"
        :notes="filteredNotes"
        :selected-id="noteStore.selectedNoteId"
        @select="noteStore.selectNote"
        @rename="handleRenameNote"
        @delete="handleDeleteNote"
        @open-in-explorer="handleOpenInExplorer"
      />
      <div v-else-if="categoryStore.selectedCategoryId && searchQuery" class="px-3 py-4 text-xs text-gray-400 text-center">
        未找到匹配的笔记
      </div>
      <div v-else-if="categoryStore.selectedCategoryId" class="px-3 py-4 text-xs text-gray-400 text-center">
        暂无笔记
      </div>
      <div v-else class="px-3 py-4 text-sm text-gray-400 text-center">
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