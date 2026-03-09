<script setup lang="ts">
import { computed } from 'vue';
import { useNoteStore, useSettingsStore, useTreeStore } from '../../stores';
import MarkdownEditor from '../editor/MarkdownEditor.vue';

const noteStore = useNoteStore();
const settingsStore = useSettingsStore();
const treeStore = useTreeStore();

// Get selected node path from tree store
const selectedNodePath = computed(() => {
  if (!treeStore.selectedNodeId) return '';
  const node = treeStore.allNodes.find(n => n.id === treeStore.selectedNodeId);
  return node?.path || '';
});

// Handle note rename
async function handleNoteRenamed(newTitle: string) {
  if (!selectedNodePath.value) return;
  try {
    await treeStore.renameNode(selectedNodePath.value, newTitle, 'file');
  } catch (e) {
    console.error('更新树节点失败:', e);
  }
}
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
      :note-path="selectedNodePath"
      @save="(content) => noteStore.saveNote(selectedNodePath, content)"
      @renamed="handleNoteRenamed"
    />
  </div>
</template>