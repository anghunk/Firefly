import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useNoteStore } from './note';

export const useTagStore = defineStore('tag', () => {
  const selectedTags = ref<string[]>([]);

  const allTags = computed(() => {
    const noteStore = useNoteStore();
    const tagSet = new Set<string>();

    noteStore.notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag));
    });

    return Array.from(tagSet).sort();
  });

  function toggleTag(tag: string) {
    const index = selectedTags.value.indexOf(tag);
    if (index === -1) {
      selectedTags.value.push(tag);
    } else {
      selectedTags.value.splice(index, 1);
    }
  }

  function clearSelection() {
    selectedTags.value = [];
  }

  return {
    selectedTags,
    allTags,
    toggleTag,
    clearSelection,
  };
});