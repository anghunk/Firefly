<script setup lang="ts">
import { onMounted, watch } from "vue";
import { AppLayout } from "./components/layout";
import { ToastContainer } from "./components/common";
import { useSettingsStore, useUpdateStore } from "./stores";
import { useToast } from "./composables/useToast";

const settingsStore = useSettingsStore();
const updateStore = useUpdateStore();
const { toasts, removeToast } = useToast();

// Debug: watch toasts
watch(toasts, (newToasts) => {
  console.log('App.vue toasts changed:', newToasts);
}, { deep: true });

onMounted(async () => {
  await settingsStore.loadConfig();
  // Silently check for updates in the background
  updateStore.checkForUpdates();
});
</script>

<template>
  <AppLayout />
  <ToastContainer :toasts="toasts" @close="removeToast" />
</template>

<style>

</style>
