import { invoke } from '@tauri-apps/api/core';
import type { AppConfig } from '../types';

export const settingsService = {
  async getConfig(): Promise<AppConfig> {
    const result = await invoke<{
      notes_directory: string;
      theme: string;
      editor_font_size: number;
      editor_line_height: number;
      auto_save_delay: number;
      show_line_numbers: boolean;
    }>('get_app_config');

    return {
      notesDirectory: result.notes_directory,
      theme: result.theme as AppConfig['theme'],
      editorFontSize: result.editor_font_size,
      editorLineHeight: result.editor_line_height,
      autoSaveDelay: result.auto_save_delay,
      showLineNumbers: result.show_line_numbers,
    };
  },

  async saveConfig(config: AppConfig): Promise<void> {
    await invoke('save_app_config', {
      config: {
        notes_directory: config.notesDirectory,
        theme: config.theme,
        editor_font_size: config.editorFontSize,
        editor_line_height: config.editorLineHeight,
        auto_save_delay: config.autoSaveDelay,
        show_line_numbers: config.showLineNumbers,
      },
    });
  },

  async getDefaultNotesDir(): Promise<string> {
    return await invoke<string>('get_default_notes_dir');
  },

  async selectNotesDirectory(): Promise<string | null> {
    const result = await invoke<string | null>('select_notes_directory');
    return result;
  },

  async setNotesDirectory(notesDir: string): Promise<void> {
    await invoke('set_notes_directory', { notesDir });
  },

  async isValidWorkspace(dir: string): Promise<boolean> {
    return await invoke<boolean>('is_valid_workspace', { dir });
  },
};