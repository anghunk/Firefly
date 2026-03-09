<script setup lang="ts">
import { onMounted } from "vue";
import { AppLayout } from "./components/layout";
import { useSettingsStore } from "./stores";
import { useUpdateChecker } from "./composables/useUpdateChecker";

const settingsStore = useSettingsStore();
const { checkForUpdates } = useUpdateChecker();

onMounted(async () => {
  await settingsStore.loadConfig();
  // Silently check for updates in the background
  checkForUpdates();
});
</script>

<template>
  <AppLayout />
</template>

<style>

</style>
