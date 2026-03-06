<script setup lang="ts">
import type { Note } from '../../types';
import NoteItem from './NoteItem.vue';

defineProps<{
  notes: Note[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
  rename: [note: Note];
  delete: [note: Note];
  openInExplorer: [note: Note];
}>();
</script>

<template>
  <div class="pb-1">
    <NoteItem
      v-for="note in notes"
      :key="note.id"
      :note="note"
      :is-selected="note.id === selectedId"
      @click="emit('select', note.id)"
      @rename="emit('rename', note)"
      @delete="emit('delete', note)"
      @open-in-explorer="emit('openInExplorer', note)"
    />
  </div>
</template>