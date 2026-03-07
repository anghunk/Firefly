import { defineStore } from 'pinia';
import { ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import type { AppConfig } from '../types';
import { defaultAppConfig } from '../types';

export const useSettingsStore = defineStore('settings', () => {
  const config = ref<AppConfig>({ ...defaultAppConfig });
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isInitialized = ref(false);

  async function loadConfig() {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await invoke<{
        notes_directory: string;
        theme: string;
        show_line_numbers: boolean;
      }>('get_app_config');

      config.value = {
        notesDirectory: result.notes_directory,
        theme: result.theme as AppConfig['theme'],
        showLineNumbers: result.show_line_numbers,
      };
      isInitialized.value = true;

      // Apply theme
      applyTheme(config.value.theme);
    } catch (e) {
      error.value = String(e);
      console.error('Failed to load config:', e);
      // Get default notes directory
      try {
        const defaultDir = await invoke<string>('get_default_notes_dir');
        config.value.notesDirectory = defaultDir;
      } catch (err) {
        console.error('Failed to get default notes dir:', err);
      }
    } finally {
      isLoading.value = false;
    }
  }

  async function saveConfig() {
    isLoading.value = true;
    error.value = null;
    try {
      await invoke('save_app_config', {
        config: {
          notes_directory: config.value.notesDirectory,
          theme: config.value.theme,
          show_line_numbers: config.value.showLineNumbers,
        },
      });
    } catch (e) {
      error.value = String(e);
      console.error('Failed to save config:', e);
    } finally {
      isLoading.value = false;
    }
  }

  async function selectNotesDirectory(): Promise<string | null> {
    try {
      const result = await invoke<string | null>('select_notes_directory');
      if (result) {
        // Backend already saved the directory, reload to get fresh config
        await loadConfig();
      }
      return result;
    } catch (e) {
      error.value = String(e);
      console.error('Failed to select notes directory:', e);
      return null;
    }
  }

  function applyTheme(theme: AppConfig['theme']) {
    const root = document.documentElement;

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }

  function setTheme(theme: AppConfig['theme']) {
    config.value.theme = theme;
    applyTheme(theme);
    saveConfig();
  }

  return {
    config,
    isLoading,
    error,
    isInitialized,
    loadConfig,
    saveConfig,
    selectNotesDirectory,
    setTheme,
  };
});