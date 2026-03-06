import { invoke } from '@tauri-apps/api/core';
import type { Note, NoteContent, CreateNoteRequest, SaveNoteRequest } from '../types';

export const noteService = {
  async getAll(categoryPath: string): Promise<Note[]> {
    const result = await invoke<{
      id: string;
      title: string;
      path: string;
      category_id: string;
      created_at: string;
      updated_at: string;
      tags: string[];
    }[]>('get_notes', { categoryPath });

    return result.map(n => ({
      id: n.id,
      title: n.title,
      path: n.path,
      categoryId: n.category_id,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
      tags: n.tags,
    }));
  },

  async create(request: CreateNoteRequest): Promise<Note> {
    const result = await invoke<{
      id: string;
      title: string;
      path: string;
      category_id: string;
      created_at: string;
      updated_at: string;
      tags: string[];
    }>('create_note', { request });

    return {
      id: result.id,
      title: result.title,
      path: result.path,
      categoryId: result.category_id,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      tags: result.tags,
    };
  },

  async getContent(notePath: string): Promise<NoteContent> {
    const result = await invoke<{
      id: string;
      title: string;
      content: string;
      front_matter: {
        title?: string;
        tags: string[];
        created_at?: string;
        updated_at?: string;
      };
    }>('get_note_content', { notePath });

    return {
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
  },

  async save(request: SaveNoteRequest): Promise<void> {
    await invoke('save_note', { request });
  },

  async delete(notePath: string): Promise<void> {
    await invoke('delete_note', { notePath });
  },
};