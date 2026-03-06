import { invoke } from '@tauri-apps/api/core';
import type { Category, CreateCategoryRequest, RenameCategoryRequest } from '../types';

export const categoryService = {
  async getAll(notesDir: string): Promise<Category[]> {
    const result = await invoke<{
      id: string;
      name: string;
      path: string;
      created_at: string;
      updated_at: string;
      note_count: number;
    }[]>('get_categories', { notesDir });

    return result.map(c => ({
      id: c.id,
      name: c.name,
      path: c.path,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      noteCount: c.note_count,
    }));
  },

  async create(notesDir: string, request: CreateCategoryRequest): Promise<Category> {
    const result = await invoke<{
      id: string;
      name: string;
      path: string;
      created_at: string;
      updated_at: string;
      note_count: number;
    }>('create_category', { notesDir, request });

    return {
      id: result.id,
      name: result.name,
      path: result.path,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      noteCount: result.note_count,
    };
  },

  async rename(request: RenameCategoryRequest): Promise<Category> {
    const result = await invoke<{
      id: string;
      name: string;
      path: string;
      created_at: string;
      updated_at: string;
      note_count: number;
    }>('rename_category', { request });

    return {
      id: result.id,
      name: result.name,
      path: result.path,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      noteCount: result.note_count,
    };
  },

  async delete(categoryPath: string): Promise<void> {
    await invoke('delete_category', { categoryPath });
  },
};