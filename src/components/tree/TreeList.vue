<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { TreeNode } from '../../types';
import TreeNodeComponent from './TreeNode.vue';
import { ContextMenu, ContextMenuItem } from '../common';
import { useContextMenu } from '../../composables/useContextMenu';

defineProps<{
  nodes: TreeNode[];
  selectedId: string | null;
  expandedPaths: Set<string>;
}>();

const emit = defineEmits<{
  select: [id: string];
  toggle: [path: string];
  rename: [node: TreeNode];
  delete: [node: TreeNode];
  createNote: [parentPath: string];
  createFolder: [parentPath: string];
  openInExplorer: [node: TreeNode];
}>();

const { openMenu, closeMenu } = useContextMenu();
const MENU_ID = 'tree-list';

const contextMenuNode = ref<TreeNode | null>(null);
const contextMenuX = ref(0);
const contextMenuY = ref(0);

onMounted(() => {
  window.addEventListener('close-context-menu', handleCloseContextMenu);
});

onUnmounted(() => {
  window.removeEventListener('close-context-menu', handleCloseContextMenu);
});

function handleCloseContextMenu() {
  contextMenuNode.value = null;
}

function handleContextMenu(node: TreeNode, e: MouseEvent) {
  e.preventDefault();
  contextMenuNode.value = null;
  requestAnimationFrame(() => {
    contextMenuX.value = e.clientX;
    contextMenuY.value = e.clientY;
    contextMenuNode.value = node;
    openMenu(MENU_ID);
  });
}

function closeContextMenu() {
  contextMenuNode.value = null;
  closeMenu();
}

function handleRename() {
  if (contextMenuNode.value) {
    emit('rename', contextMenuNode.value);
  }
  closeContextMenu();
}

function handleDelete() {
  if (contextMenuNode.value) {
    emit('delete', contextMenuNode.value);
  }
  closeContextMenu();
}

function handleCreateNote() {
  if (contextMenuNode.value && contextMenuNode.value.type === 'folder') {
    emit('createNote', contextMenuNode.value.path);
  }
  closeContextMenu();
}

function handleCreateFolder() {
  if (contextMenuNode.value && contextMenuNode.value.type === 'folder') {
    emit('createFolder', contextMenuNode.value.path);
  }
  closeContextMenu();
}

function handleOpenInExplorer() {
  if (contextMenuNode.value) {
    emit('openInExplorer', contextMenuNode.value);
  }
  closeContextMenu();
}

function isExpanded(path: string, expandedPaths: Set<string>): boolean {
  return expandedPaths.has(path);
}
</script>

<template>
  <div class="pb-1">
    <TreeNodeComponent
      v-for="node in nodes"
      :key="node.id"
      :node="node"
      :is-selected="node.id === selectedId"
      :is-context-menu-active="contextMenuNode?.id === node.id"
      :is-expanded="isExpanded(node.path, expandedPaths)"
      @click="emit('select', node.id)"
      @toggle="emit('toggle', node.path)"
      @rename="emit('rename', node)"
      @delete="emit('delete', node)"
      @create-note="emit('createNote', node.path)"
      @create-folder="emit('createFolder', node.path)"
      @open-in-explorer="emit('openInExplorer', node)"
      @contextmenu="(e) => handleContextMenu(node, e)"
    />

    <!-- Context Menu -->
    <ContextMenu
      :is-open="contextMenuNode !== null"
      :x="contextMenuX"
      :y="contextMenuY"
      @close="closeContextMenu"
    >
      <!-- Folder-specific options -->
      <template v-if="contextMenuNode?.type === 'folder'">
        <ContextMenuItem @click="handleCreateNote">
          <PhFilePlus :size="16" />
          <span>新建笔记</span>
        </ContextMenuItem>
        <ContextMenuItem @click="handleCreateFolder">
          <PhFolderPlus :size="16" />
          <span>新建子文件夹</span>
        </ContextMenuItem>
        <div class="border-t border-gray-200 dark:border-gray-700 my-1" />
      </template>

      <ContextMenuItem @click="handleRename">
        <PhPencilSimple :size="16" />
        <span>重命名</span>
      </ContextMenuItem>
      <ContextMenuItem @click="handleOpenInExplorer">
        <PhFolderOpen :size="16" />
        <span>打开资源管理器</span>
      </ContextMenuItem>
      <ContextMenuItem danger @click="handleDelete">
        <PhTrash :size="16" />
        <span>删除</span>
      </ContextMenuItem>
    </ContextMenu>
  </div>
</template>