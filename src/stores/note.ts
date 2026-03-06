import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import type { Note, NoteContent } from '../types';
import { useCategoryStore } from './category';

// Raw API response types (snake_case from Rust)
interface RawNote {
  id: string;
  title: string;
  path: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  tags: string[];
}

interface RawNoteContent {
  id: string;
  title: string;
  content: string;
  front_matter: {
    title?: string;
    tags: string[];
    created_at?: string;
    updated_at?: string;
  };
}

export const useNoteStore = defineStore('note', () => {
  const notes = ref<Note[]>([]);
  const selectedNoteId = ref<string | null>(null);
  const noteContent = ref<NoteContent | null>(null);
  const isLoading = ref(false);
  const isSaving = ref(false);
  const error = ref<string | null>(null);

  const selectedNote = computed(() =>
    notes.value.find(n => n.id === selectedNoteId.value) || null
  );

  // Convert raw API response to frontend type
  function toNote(raw: RawNote): Note {
    return {
      id: raw.id,
      title: raw.title,
      path: raw.path,
      categoryId: raw.category_id,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      tags: raw.tags,
    };
  }

  async function fetchNotes(categoryPath: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await invoke<RawNote[]>('get_notes', { categoryPath });
      notes.value = result.map(toNote);
    } catch (e) {
      error.value = String(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function createNote(categoryId: string, title: string) {
    // Use snake_case to match Rust backend
    const request = { category_id: categoryId, title };
    const result = await invoke<RawNote>('create_note', { request });
    const note = toNote(result);
    notes.value.unshift(note);

    // Update category note count
    const categoryStore = useCategoryStore();
    categoryStore.incrementNoteCount(categoryId);

    return note;
  }

  async function loadNoteContent(notePath: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await invoke<RawNoteContent>('get_note_content', { notePath });
      noteContent.value = {
        id: result.id,
        title: result.title,
        content: result.content,
        frontMatter: {
          title: result.front_matter.title,
          tags: result.front_matter.tags,
          createdAt: result.front_matter.created_at,
          updatedAt: result.front_matter.updated_at,
        },
      };
    } catch (e) {
      error.value = String(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function saveNote(path: string, content: string) {
    isSaving.value = true;
    try {
      // Use snake_case to match Rust backend
      const request = { path, content };
      await invoke('save_note', { request });
    } finally {
      isSaving.value = false;
    }
  }

  async function deleteNote(notePath: string) {
    // Find the note to get its category before deleting
    const note = notes.value.find(n => n.path === notePath);
    const categoryId = note?.categoryId;

    await invoke('delete_note', { notePath });
    notes.value = notes.value.filter(n => n.path !== notePath);
    if (noteContent.value && 'path' in noteContent.value && noteContent.value.path === notePath) {
      noteContent.value = null;
    }
    if (selectedNoteId.value === notePath) {
      selectedNoteId.value = null;
    }

    // Update category note count
    if (categoryId) {
      const categoryStore = useCategoryStore();
      categoryStore.decrementNoteCount(categoryId);
    }
  }

  async function renameNote(notePath: string, newTitle: string) {
    const result = await invoke<RawNote>('rename_note', { notePath, newTitle });
    const note = toNote(result);
    const index = notes.value.findIndex(n => n.path === notePath);
    if (index !== -1) {
      notes.value[index] = note;
    }
    if (selectedNoteId.value === notePath) {
      selectedNoteId.value = note.id;
    }
    return note;
  }

  function selectNote(id: string | null) {
    selectedNoteId.value = id;
  }

  function clearNotes() {
    notes.value = [];
    selectedNoteId.value = null;
    noteContent.value = null;
  }

  return {
    notes,
    selectedNoteId,
    selectedNote,
    noteContent,
    isLoading,
    isSaving,
    error,
    fetchNotes,
    createNote,
    loadNoteContent,
    saveNote,
    deleteNote,
    renameNote,
    selectNote,
    clearNotes,
  };
});