import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as pkg from '../../package.json';
import type { UpdateInfo } from '../composables/useUpdateChecker';

const GITHUB_REPO = 'anghunk/Firefly';
const UPDATE_URL = `https://github.com/${GITHUB_REPO}/releases`;

export const useUpdateStore = defineStore('update', () => {
  const updateInfo = ref<UpdateInfo>({
    currentVersion: pkg.version,
    latestVersion: null,
    isUpdateAvailable: false,
    updateUrl: UPDATE_URL,
    isLoading: false,
    error: null,
  });

  /**
   * Check if version1 is older than version2
   * Returns true if version1 < version2
   */
  function isVersionOlder(version1: string, version2: string): boolean {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const v1 = v1Parts[i] || 0;
      const v2 = v2Parts[i] || 0;

      if (v1 < v2) return true;
      if (v1 > v2) return false;
    }

    return false;
  }

  /**
   * Check for updates from GitHub releases
   */
  async function checkForUpdates(): Promise<void> {
    updateInfo.value.isLoading = true;
    updateInfo.value.error = null;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const latestVersion = data.tag_name.replace(/^v/, '');

      updateInfo.value.latestVersion = latestVersion;
      updateInfo.value.isUpdateAvailable = isVersionOlder(
        updateInfo.value.currentVersion,
        latestVersion
      );
    } catch (error) {
      updateInfo.value.error =
        error instanceof Error ? error.message : String(error);
      console.error('Failed to check for updates:', error);
    } finally {
      updateInfo.value.isLoading = false;
    }
  }

  return {
    updateInfo,
    checkForUpdates,
  };
});