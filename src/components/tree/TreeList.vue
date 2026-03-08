<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import type { TreeNode } from '../../types';
import TreeNodeComponent from './TreeNode.vue';
import { ContextMenu, ContextMenuItem } from '../common';
import { useContextMenu } from '../../composables/useContextMenu';

const props = defineProps<{
  nodes: TreeNode[];
  selectedId: string | null;
  expandedPaths: Set<string>;
}>();

const emit = defineEmits<{
  select: [id: string];
  toggle: [path: string];
  rename: [node: TreeNode];
  renameSubmit: [node: TreeNode, newName: string];
  renameCancel: [];
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

// Inline editing state
const editingNodeId = ref<string | null>(null);
const pendingActions = ref<Array<() => void>>([]);
const isSavingRename = ref(false);

onMounted(() => {
  window.addEventListener('close-context-menu', handleCloseContextMenu);
});

onUnmounted(() => {
  window.removeEventListener('close-context-menu', handleCloseContextMenu);
});

function handleCloseContextMenu() {
  contextMenuNode.value = null;
}

async function executePendingActions() {
  const actions = [...pendingActions.value];
  pendingActions.value = [];
  await nextTick();
  for (const action of actions) {
    action();
  }
}

function handleContextMenu(node: TreeNode, e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();

  // If currently editing or saving, queue this action
  if (editingNodeId.value || isSavingRename.value) {
    pendingActions.value.push(() => {
      contextMenuNode.value = null;
      requestAnimationFrame(() => {
        contextMenuX.value = e.clientX;
        contextMenuY.value = e.clientY;
        contextMenuNode.value = node;
        openMenu(MENU_ID);
      });
    });
  } else {
    contextMenuNode.value = null;
    requestAnimationFrame(() => {
      contextMenuX.value = e.clientX;
      contextMenuY.value = e.clientY;
      contextMenuNode.value = node;
      openMenu(MENU_ID);
    });
  }
}

function closeContextMenu() {
  contextMenuNode.value = null;
  closeMenu();
}

function handleRename() {
  if (contextMenuNode.value) {
    editingNodeId.value = contextMenuNode.value.id;
  }
  closeContextMenu();
}

async function handleInlineRenameSubmit(newName: string) {
  isSavingRename.value = true;
  try {
    if (editingNodeId.value) {
      const node = props.nodes.find(n => n.id === editingNodeId.value);
      if (node) {
        await emit('renameSubmit', node, newName);
      }
    }
    editingNodeId.value = null;
    // Execute any pending actions after rename completes
    await executePendingActions();
  } finally {
    isSavingRename.value = false;
  }
}

async function handleInlineRenameCancel() {
  editingNodeId.value = null;
  await nextTick();
  // Execute any pending actions after cancel
  await executePendingActions();
}

function handleSelect(id: string) {
  // If editing or saving, queue this action
  if (editingNodeId.value || isSavingRename.value) {
    pendingActions.value.push(() => emit('select', id));
  } else {
    emit('select', id);
  }
}

function handleToggle(path: string) {
  // If editing or saving, queue this action
  if (editingNodeId.value || isSavingRename.value) {
    pendingActions.value.push(() => emit('toggle', path));
  } else {
    emit('toggle', path);
  }
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

function handleDoubleClick(node: TreeNode) {
  // Only allow double-click rename on files, not folders
  if (node.type === 'file') {
    editingNodeId.value = node.id;
  }
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
      :is-editing="node.id === editingNodeId"
      @click="handleSelect(node.id)"
      @toggle="handleToggle(node.path)"
      @dblclick="handleDoubleClick(node)"
      @rename="emit('rename', node)"
      @delete="emit('delete', node)"
      @create-note="emit('createNote', node.path)"
      @create-folder="emit('createFolder', node.path)"
      @open-in-explorer="emit('openInExplorer', node)"
      @contextmenu="(e) => handleContextMenu(node, e)"
      @rename-submit="handleInlineRenameSubmit"
      @rename-cancel="handleInlineRenameCancel"
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