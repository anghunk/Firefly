<script setup lang="ts">
import { ref } from 'vue';
import SidebarLeft from './SidebarLeft.vue';
import SidebarMiddle from './SidebarMiddle.vue';
import MainContent from './MainContent.vue';
import SettingsModal from '../settings/SettingsModal.vue';

const showSettings = ref(false);
</script>

<template>
  <div class="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
    <!-- Left Sidebar - Categories -->
    <SidebarLeft class="w-48 flex-shrink-0 border-r border-gray-200 dark:border-gray-800" @open-settings="showSettings = true" />

    <!-- Middle Sidebar - Notes List -->
    <SidebarMiddle class="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-800" />

    <!-- Main Content - Editor/Preview -->
    <MainContent class="flex-1 min-w-0" />

    <!-- Settings Modal -->
    <SettingsModal :is-open="showSettings" @close="showSettings = false" />
  </div>
</template>