<script setup lang="ts">
import { onMounted } from "vue";
import { AppLayout } from "./components/layout";
import { useSettingsStore } from "./stores";

const settingsStore = useSettingsStore();

onMounted(async () => {
  await settingsStore.loadConfig();
});
</script>

<template>
  <AppLayout />
</template>

<style>

</style>
