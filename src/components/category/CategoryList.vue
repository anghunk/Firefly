<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { Category } from '../../types';
import CategoryItem from './CategoryItem.vue';
import { ContextMenu, ContextMenuItem } from '../common';
import { useContextMenu } from '../../composables/useContextMenu';

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

const { openMenu, closeMenu } = useContextMenu();
const MENU_ID = 'category-list';

const draggedId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);
// Use counter to track nested drag enter/leave
const dragEnterCount = ref(0);

// Context menu state (managed at list level to ensure only one is open)
const contextMenuCategory = ref<Category | null>(null);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

// 监听全局关闭事件
function handleCloseContextMenu() {
  contextMenuCategory.value = null;
}

onMounted(() => {
  window.addEventListener('close-context-menu', handleCloseContextMenu);
});

onUnmounted(() => {
  window.removeEventListener('close-context-menu', handleCloseContextMenu);
});

function handleDragStart(id: string) {
  draggedId.value = id;
  dragEnterCount.value = 0;
}

function handleDragEnd() {
  draggedId.value = null;
  dragOverId.value = null;
  dragEnterCount.value = 0;
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
  // Reset state
  draggedId.value = null;
  dragOverId.value = null;
  dragEnterCount.value = 0;
}

function handleDragLeave() {
  // Only clear dragOverId when truly leaving the drop target
  // This is a fallback - the main logic uses relatedTarget in CategoryItem
  dragOverId.value = null;
}

function handleContextMenu(category: Category, e: MouseEvent) {
  e.preventDefault();
  // 先关闭当前菜单，再打开新菜单
  contextMenuCategory.value = null;
  requestAnimationFrame(() => {
    contextMenuX.value = e.clientX;
    contextMenuY.value = e.clientY;
    contextMenuCategory.value = category;
    openMenu(MENU_ID);
  });
}

function closeContextMenu() {
  contextMenuCategory.value = null;
  closeMenu();
}

function handleRename() {
  if (contextMenuCategory.value) {
    emit('rename', contextMenuCategory.value.id);
  }
  closeContextMenu();
}

function handleDelete() {
  if (contextMenuCategory.value) {
    emit('delete', contextMenuCategory.value.id);
  }
  closeContextMenu();
}
</script>

<template>
  <div class="pb-1">
    <CategoryItem
      v-for="category in categories"
      :key="category.id"
      :category="category"
      :is-selected="category.id === selectedId"
      :is-context-menu-active="contextMenuCategory?.id === category.id"
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
      @contextmenu="(e) => handleContextMenu(category, e)"
    />

    <!-- Context Menu (managed at list level to ensure only one is open) -->
    <ContextMenu
      :is-open="contextMenuCategory !== null"
      :x="contextMenuX"
      :y="contextMenuY"
      @close="closeContextMenu"
    >
      <ContextMenuItem @click="handleRename">
        <PhPencilSimple :size="16" />
        <span>重命名</span>
      </ContextMenuItem>
      <ContextMenuItem danger @click="handleDelete">
        <PhTrash :size="16" />
        <span>删除</span>
      </ContextMenuItem>
    </ContextMenu>
  </div>
</template>