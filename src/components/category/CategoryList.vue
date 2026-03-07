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
}>();

const { openMenu, closeMenu } = useContextMenu();
const MENU_ID = 'category-list';

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
      @click="emit('select', category.id)"
      @rename="emit('rename', category.id)"
      @delete="emit('delete', category.id)"
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