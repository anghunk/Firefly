<script setup lang="ts">
import { ref } from 'vue';
import type { Category } from '../../types';
import CategoryItem from './CategoryItem.vue';

defineProps<{
  categories: Category[];
  selectedId: string | null;
}>();

const emit = defineEmits<{
  select: [id: string];
  rename: [id: string];
  delete: [id: string];
  reorder: [fromId: string, toId: string];
}>();

const draggedId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);

function handleDragStart(id: string) {
  draggedId.value = id;
}

function handleDragEnd() {
  draggedId.value = null;
  dragOverId.value = null;
}

function handleDragOver(id: string) {
  if (draggedId.value && draggedId.value !== id) {
    dragOverId.value = id;
  }
}

function handleDrop(toId: string) {
  if (draggedId.value && draggedId.value !== toId) {
    emit('reorder', draggedId.value, toId);
  }
  draggedId.value = null;
  dragOverId.value = null;
}

function handleDragLeave() {
  dragOverId.value = null;
}
</script>

<template>
  <div class="pb-1">
    <CategoryItem
      v-for="category in categories"
      :key="category.id"
      :category="category"
      :is-selected="category.id === selectedId"
      :is-dragging="category.id === draggedId"
      :is-drag-over="category.id === dragOverId"
      @click="emit('select', category.id)"
      @rename="emit('rename', category.id)"
      @delete="emit('delete', category.id)"
      @drag-start="handleDragStart"
      @drag-end="handleDragEnd"
      @drag-over="handleDragOver"
      @drag-leave="handleDragLeave"
      @drop="handleDrop"
    />
  </div>
</template>