<script setup lang="ts">
import { watch } from 'vue';
import { useNoteStore, useSettingsStore } from '../../stores';
import MarkdownEditor from '../editor/MarkdownEditor.vue';

const noteStore = useNoteStore();
const settingsStore = useSettingsStore();

// Load note content when selected
watch(() => noteStore.selectedNoteId, async (noteId) => {
  if (noteId) {
    const note = noteStore.notes.find(n => n.id === noteId);
    if (note) {
      await noteStore.loadNoteContent(note.path);
    }
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Empty State -->
    <div
      v-if="!noteStore.selectedNoteId"
      class="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-600"
    >
      <PhSun :size="32" />
    </div>

    <!-- Editor -->
    <MarkdownEditor
      v-else-if="noteStore.noteContent"
      :content="noteStore.noteContent.content"
      :show-line-numbers="settingsStore.config.showLineNumbers"
      :note-path="noteStore.selectedNote?.path || ''"
      @save="(content) => noteStore.saveNote(noteStore.selectedNote?.path || '', content)"
    />
  </div>
</template>