<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useCategoryStore, useSettingsStore } from '../../stores';
import CategoryList from '../category/CategoryList.vue';
import CategoryForm from '../category/CategoryForm.vue';
import CategoryRenameModal from '../category/CategoryRenameModal.vue';
import { ContextMenu, ContextMenuItem, ConfirmDialog } from '../common';
import { useContextMenu } from '../../composables/useContextMenu';

const emit = defineEmits<{
  openSettings: [];
}>();

const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();
const { openMenu, closeMenu } = useContextMenu();

const MENU_ID = 'sidebar-left';

const showCreateForm = ref(false);
const isLoading = ref(false);

// Context menu state
const showContextMenu = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

// Rename state
const showRenameModal = ref(false);
const renamingCategoryId = ref<string | null>(null);
const renamingCategoryName = ref('');

// Delete confirm state
const showDeleteConfirm = ref(false);
const deletingCategoryId = ref<string | null>(null);

// 监听全局关闭事件
function handleCloseContextMenu() {
  showContextMenu.value = false;
  closeMenu();
}

onMounted(async () => {
  await settingsStore.loadConfig();
  window.addEventListener('close-context-menu', handleCloseContextMenu);
});

onUnmounted(() => {
  window.removeEventListener('close-context-menu', handleCloseContextMenu);
});

watch(() => settingsStore.config.notesDirectory, async (notesDir) => {
  if (notesDir) {
    isLoading.value = true;
    await categoryStore.fetchCategories(notesDir);

    // Auto create Default category if no categories exist
    if (categoryStore.categories.length === 0) {
      try {
        await categoryStore.createCategory(notesDir, 'Default');
      } catch (e) {
        console.error('Failed to create Default category:', e);
      }
    }

    isLoading.value = false;
  }
}, { immediate: true });

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  contextMenuX.value = e.clientX;
  contextMenuY.value = e.clientY;
  showContextMenu.value = true;
  openMenu(MENU_ID);
}

function closeContextMenu() {
  showContextMenu.value = false;
  closeMenu();
}

function handleCreateCategory() {
  closeContextMenu();
  showCreateForm.value = true;
}

function handleRenameCategory(id: string) {
  const category = categoryStore.categories.find(c => c.id === id);
  if (category) {
    renamingCategoryId.value = id;
    renamingCategoryName.value = category.name;
    showRenameModal.value = true;
  }
}

async function handleRenameSubmit(newName: string) {
  if (renamingCategoryId.value) {
    await categoryStore.renameCategory(settingsStore.config.notesDirectory, renamingCategoryId.value, newName);
    showRenameModal.value = false;
    renamingCategoryId.value = null;
  }
}

function handleDeleteCategory(id: string) {
  deletingCategoryId.value = id;
  showDeleteConfirm.value = true;
}

async function confirmDelete() {
  if (deletingCategoryId.value) {
    await categoryStore.deleteCategory(settingsStore.config.notesDirectory, deletingCategoryId.value);
    showDeleteConfirm.value = false;
    deletingCategoryId.value = null;
  }
}

async function handleReorder(fromId: string, toId: string) {
  console.log('[SidebarLeft] handleReorder:', fromId, '->', toId);
  console.log('[SidebarLeft] notesDirectory:', settingsStore.config.notesDirectory);
  await categoryStore.reorderCategories(settingsStore.config.notesDirectory, fromId, toId);
}

const deletingCategory = () => {
  if (!deletingCategoryId.value) return null;
  return categoryStore.categories.find(c => c.id === deletingCategoryId.value);
};
</script>

<template>
  <div class="flex flex-col h-full" @contextmenu="handleContextMenu">
    <!-- Category List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="isLoading" class="px-3 py-4 text-xs text-gray-400 text-center">
        加载中...
      </div>
      <CategoryList
        v-else-if="categoryStore.categories.length > 0"
        :categories="categoryStore.categories"
        :selected-id="categoryStore.selectedCategoryId"
        @select="categoryStore.selectCategory"
        @rename="handleRenameCategory"
        @delete="handleDeleteCategory"
        @reorder="handleReorder"
      />
      <div v-else class="px-3 py-4 text-xs text-gray-400 text-center">
        暂无分类
      </div>
    </div>

    <!-- Footer - Settings button -->
    <div class="flex items-center px-3 h-10 border-t border-gray-200 dark:border-gray-800">
      <button
        class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        @click="emit('openSettings')"
        title="设置"
      >
        <PhGear :size="16" />
      </button>
    </div>

    <!-- Create Category Form -->
    <CategoryForm
      :is-open="showCreateForm"
      @close="showCreateForm = false"
      @submit="showCreateForm = false"
    />

    <!-- Rename Modal -->
    <CategoryRenameModal
      :is-open="showRenameModal"
      :current-name="renamingCategoryName"
      @close="showRenameModal = false"
      @submit="handleRenameSubmit"
    />

    <!-- Delete Confirm -->
    <ConfirmDialog
      :is-open="showDeleteConfirm"
      title="删除分类"
      :message="`确定要删除分类「${deletingCategory()?.name || ''}」吗？该分类下的所有笔记也会被删除。`"
      confirm-text="删除"
      variant="danger"
      @cancel="showDeleteConfirm = false"
      @confirm="confirmDelete"
    />

    <!-- Context Menu -->
    <ContextMenu
      :is-open="showContextMenu"
      :x="contextMenuX"
      :y="contextMenuY"
      @close="closeContextMenu"
    >
      <ContextMenuItem @click="handleCreateCategory">
        <PhFolderPlus :size="16" />
        <span>新建分类</span>
      </ContextMenuItem>
    </ContextMenu>
  </div>
</template>