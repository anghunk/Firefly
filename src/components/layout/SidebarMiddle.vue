<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { Command } from '@tauri-apps/plugin-shell';
import { useCategoryStore, useTreeStore, useNoteStore } from '../../stores';
import { TreeList, FolderCreateModal, TreeNodeRenameModal, NoteCreateModal } from '../tree';
import ConfirmDialog from '../common/ConfirmDialog.vue';
import type { TreeNode } from '../../types';

const categoryStore = useCategoryStore();
const treeStore = useTreeStore();
const noteStore = useNoteStore();

// Load expanded paths on mount
onMounted(() => {
  treeStore.loadExpandedPaths();
});

// Modal states
const showCreateNoteModal = ref(false);
const showCreateFolderModal = ref(false);
const showRenameModal = ref(false);
const showDeleteConfirm = ref(false);

// Node being operated on
const nodeToRename = ref<TreeNode | null>(null);
const nodeToDelete = ref<TreeNode | null>(null);
const createNoteParentPath = ref('');

// Search state
const searchQuery = ref('');

// Filtered nodes based on search query
const filteredNodes = computed(() => {
  if (!searchQuery.value.trim()) {
    return treeStore.visibleNodes;
  }
  const query = searchQuery.value.toLowerCase();
  return treeStore.visibleNodes.filter(node =>
    node.name.toLowerCase().includes(query)
  );
});

function clearSearch() {
  searchQuery.value = '';
}

watch(() => categoryStore.selectedCategoryId, async (categoryId) => {
  if (categoryId) {
    await treeStore.fetchTree(categoryId);
  } else {
    treeStore.clearTree();
  }
  // Clear search when switching categories
  searchQuery.value = '';
}, { immediate: true });

// Handle node selection
function handleSelect(id: string) {
  treeStore.selectNode(id);
  const node = treeStore.allNodes.find(n => n.id === id);

  // If it's a file, load its content
  if (node?.type === 'file') {
    noteStore.selectNote(node.id);
    noteStore.loadNoteContent(node.path);
  } else {
    noteStore.selectNote(null);
  }
}

// Handle folder toggle
function handleToggle(path: string) {
  treeStore.toggleFolder(path);
}

// Handle rename
function handleRename(node: TreeNode) {
  nodeToRename.value = node;
  showRenameModal.value = true;
}

async function handleRenameSubmit(newName: string) {
  if (nodeToRename.value) {
    await treeStore.renameNode(nodeToRename.value.path, newName, nodeToRename.value.type);
    showRenameModal.value = false;
    nodeToRename.value = null;
  }
}

// Handle inline rename from TreeList
async function handleInlineRenameSubmit(node: TreeNode, newName: string) {
  await treeStore.renameNode(node.path, newName, node.type);
}

function handleInlineRenameCancel() {
  // Nothing to do, just cancel editing
}

// Handle delete
function handleDelete(node: TreeNode) {
  nodeToDelete.value = node;
  showDeleteConfirm.value = true;
}

const deleteMessage = computed(() => {
  if (!nodeToDelete.value) return '';
  const node = nodeToDelete.value;
  if (node.type === 'folder') {
    return `确定要删除文件夹「${node.name}」及其所有内容吗？此操作将移至回收站。`;
  }
  return `确定要删除笔记「${node.name}」吗？此操作将移至回收站。`;
});

async function confirmDelete() {
  if (nodeToDelete.value) {
    await treeStore.deleteNode(nodeToDelete.value.path, nodeToDelete.value.type);
    showDeleteConfirm.value = false;
    nodeToDelete.value = null;
  }
}

// Handle create note
function handleCreateNote(parentPath: string) {
  createNoteParentPath.value = parentPath;
  showCreateNoteModal.value = true;
}

function handleCreateNoteSubmit() {
  showCreateNoteModal.value = false;
  createNoteParentPath.value = '';
}

// Handle create folder
const createFolderParentPath = ref('');

function handleCreateFolder(parentPath: string) {
  createFolderParentPath.value = parentPath;
  showCreateFolderModal.value = true;
}

async function handleCreateFolderSubmit(name: string) {
  await treeStore.createFolder(createFolderParentPath.value, name);
  showCreateFolderModal.value = false;
  createFolderParentPath.value = '';
}

// Handle open in explorer
async function handleOpenInExplorer(node: TreeNode) {
  // Windows: use explorer /select to open and highlight the file/folder
  await Command.create('explorer', ['/select,', node.path]).execute();
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Header with Search and Create Buttons -->
    <div class="flex items-center gap-2 px-3 h-10 border-b border-gray-200 dark:border-gray-800">
      <!-- Search Input -->
      <div class="flex-1 relative">
        <PhMagnifyingGlass
          :size="14"
          class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="categoryStore.selectedCategory?.name || '搜索笔记'"
          class="w-full h-7 pl-7 pr-6 text-sm bg-gray-100 dark:bg-gray-800 rounded border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-gray-200 placeholder:text-gray-400"
        />
        <button
          v-if="searchQuery"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          @click="clearSearch"
        >
          <PhX :size="12" />
        </button>
      </div>

      <!-- Create Buttons -->
      <template v-if="categoryStore.selectedCategoryId">
        <button
          class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer"
          @click="createNoteParentPath = categoryStore.selectedCategoryId || ''; showCreateNoteModal = true"
          title="新建笔记"
        >
          <PhHighlighter :size="14" />
        </button>
        <button
          class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-pointer"
          @click="createFolderParentPath = categoryStore.selectedCategoryId || ''; showCreateFolderModal = true"
          title="新建文件夹"
        >
          <PhFolderPlus :size="14" />
        </button>
      </template>
    </div>

    <!-- Tree List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="treeStore.isLoading" class="px-3 py-4 text-xs text-gray-400 text-center">
        加载中...
      </div>
      <TreeList
        v-else-if="filteredNodes.length > 0"
        :nodes="filteredNodes"
        :selected-id="treeStore.selectedNodeId"
        :expanded-paths="treeStore.expandedPaths"
        @select="handleSelect"
        @toggle="handleToggle"
        @rename="handleRename"
        @rename-submit="handleInlineRenameSubmit"
        @rename-cancel="handleInlineRenameCancel"
        @delete="handleDelete"
        @create-note="handleCreateNote"
        @create-folder="handleCreateFolder"
        @open-in-explorer="handleOpenInExplorer"
      />
      <div v-else-if="categoryStore.selectedCategoryId && searchQuery" class="px-3 py-4 text-xs text-gray-400 text-center">
        未找到匹配的内容
      </div>
      <div v-else-if="categoryStore.selectedCategoryId" class="px-3 py-4 text-xs text-gray-400 text-center">
        暂无笔记或文件夹
      </div>
      <div v-else class="px-3 py-4 text-sm text-gray-400 text-center">
        请选择分类
      </div>
    </div>

    <!-- Create Note Modal -->
    <NoteCreateModal
      :is-open="showCreateNoteModal"
      :parent-path="createNoteParentPath"
      @close="showCreateNoteModal = false; createNoteParentPath = ''"
      @submit="handleCreateNoteSubmit"
    />

    <!-- Create Folder Modal -->
    <FolderCreateModal
      :is-open="showCreateFolderModal"
      :parent-path="createFolderParentPath"
      @close="showCreateFolderModal = false; createFolderParentPath = ''"
      @submit="handleCreateFolderSubmit"
    />

    <!-- Rename Modal -->
    <TreeNodeRenameModal
      v-if="nodeToRename"
      :is-open="showRenameModal"
      :node="nodeToRename"
      @close="showRenameModal = false; nodeToRename = null"
      @submit="handleRenameSubmit"
    />

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      :is-open="showDeleteConfirm"
      :title="nodeToDelete?.type === 'folder' ? '删除文件夹' : '删除笔记'"
      :message="deleteMessage"
      confirm-text="删除"
      @cancel="showDeleteConfirm = false; nodeToDelete = null"
      @confirm="confirmDelete"
    />
  </div>
</template>