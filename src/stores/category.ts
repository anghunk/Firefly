import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import type { Category, CreateCategoryRequest, RenameCategoryRequest } from '../types';

// Raw API response types (snake_case from Rust)
interface RawCategory {
  id: string;
  name: string;
  path: string;
  created_at: string;
  updated_at: string;
  note_count: number;
}

interface RawCategoryOrderConfig {
  category_ids: string[];
}

export const useCategoryStore = defineStore('category', () => {
  const categories = ref<Category[]>([]);
  const selectedCategoryId = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const categoryOrder = ref<string[]>([]);

  const selectedCategory = computed(() =>
    categories.value.find(c => c.id === selectedCategoryId.value) || null
  );

  // Convert raw API response to frontend type
  function toCategory(raw: RawCategory): Category {
    return {
      id: raw.id,
      name: raw.name,
      path: raw.path,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      noteCount: raw.note_count,
    };
  }

  async function fetchCategories(notesDir: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await invoke<RawCategory[]>('get_categories', { notesDir });
      categories.value = result.map(toCategory);

      // Load order config (non-blocking, don't fail if this errors)
      try {
        const orderConfig = await invoke<RawCategoryOrderConfig>('get_category_order', { notesDir });
        categoryOrder.value = orderConfig.category_ids || [];
      } catch {
        // Order config doesn't exist yet, use empty array
        categoryOrder.value = [];
      }
    } catch (e) {
      error.value = String(e);
    } finally {
      isLoading.value = false;
    }
  }

  async function createCategory(notesDir: string, name: string) {
    const request: CreateCategoryRequest = { name };
    const result = await invoke<RawCategory>('create_category', { notesDir, request });
    const category = toCategory(result);

    // Add to order list and save (non-blocking)
    categoryOrder.value.push(category.id);
    try {
      await invoke('save_category_order', {
        notesDir,
        order: { category_ids: categoryOrder.value }
      });
    } catch (e) {
      console.warn('Failed to save category order:', e);
    }

    categories.value.push(category);
    return category;
  }

  async function renameCategory(notesDir: string, id: string, newName: string) {
    const request: RenameCategoryRequest = { id, newName };
    const result = await invoke<RawCategory>('rename_category', { request });

    const index = categories.value.findIndex(c => c.id === id);
    if (index !== -1) {
      categories.value[index] = toCategory(result);
      // Update selected category id if it changed
      if (selectedCategoryId.value === id) {
        selectedCategoryId.value = result.id;
      }
    }

    // Update order list with new ID
    const orderIndex = categoryOrder.value.indexOf(id);
    if (orderIndex !== -1) {
      categoryOrder.value[orderIndex] = result.id;
      try {
        await invoke('save_category_order', {
          notesDir,
          order: { category_ids: categoryOrder.value }
        });
      } catch (e) {
        console.warn('Failed to save category order:', e);
      }
    }
  }

  async function deleteCategory(notesDir: string, id: string) {
    await invoke('delete_category', { categoryPath: id });
    categories.value = categories.value.filter(c => c.id !== id);

    // Remove from order list and save
    categoryOrder.value = categoryOrder.value.filter(cid => cid !== id);
    try {
      await invoke('save_category_order', {
        notesDir,
        order: { category_ids: categoryOrder.value }
      });
    } catch (e) {
      console.warn('Failed to save category order:', e);
    }

    if (selectedCategoryId.value === id) {
      selectedCategoryId.value = null;
    }
  }

  async function reorderCategories(notesDir: string, fromId: string, toId: string) {
    // Find positions in current categories array
    const fromIndex = categories.value.findIndex(c => c.id === fromId);
    const toIndex = categories.value.findIndex(c => c.id === toId);

    if (fromIndex === -1 || toIndex === -1) return;

    // Reorder locally first for immediate UI feedback
    const [removed] = categories.value.splice(fromIndex, 1);
    categories.value.splice(toIndex, 0, removed);

    // Update order list
    const [orderRemoved] = categoryOrder.value.splice(
      categoryOrder.value.indexOf(fromId),
      1
    );
    categoryOrder.value.splice(toIndex, 0, orderRemoved);

    // Persist to backend
    try {
      await invoke('reorder_categories', { notesDir, fromId, toId });
    } catch (e) {
      console.warn('Failed to save category order:', e);
    }
  }

  function selectCategory(id: string | null) {
    selectedCategoryId.value = id;
  }

  function incrementNoteCount(categoryId: string) {
    const category = categories.value.find(c => c.id === categoryId);
    if (category) {
      category.noteCount++;
    }
  }

  function decrementNoteCount(categoryId: string) {
    const category = categories.value.find(c => c.id === categoryId);
    if (category && category.noteCount > 0) {
      category.noteCount--;
    }
  }

  return {
    categories,
    selectedCategoryId,
    selectedCategory,
    isLoading,
    error,
    categoryOrder,
    fetchCategories,
    createCategory,
    renameCategory,
    deleteCategory,
    reorderCategories,
    selectCategory,
    incrementNoteCount,
    decrementNoteCount,
  };
});