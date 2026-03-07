import { invoke } from '@tauri-apps/api/core';
import type { AppConfig } from '../types';

export const settingsService = {
  async getConfig(): Promise<AppConfig> {
    const result = await invoke<{
      notes_directory: string;
      theme: string;
      show_line_numbers: boolean;
    }>('get_app_config');

    return {
      notesDirectory: result.notes_directory,
      theme: result.theme as AppConfig['theme'],
      showLineNumbers: result.show_line_numbers,
    };
  },

  async saveConfig(config: AppConfig): Promise<void> {
    await invoke('save_app_config', {
      config: {
        notes_directory: config.notesDirectory,
        theme: config.theme,
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