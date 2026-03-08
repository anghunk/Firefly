import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import type { TreeNode } from '../types';

// Raw API response types (snake_case from Rust)
interface RawTreeNode {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  depth: number;
  created_at: string;
  updated_at: string;
  tags?: string[];
  is_empty?: boolean;
}

const EXPANDED_PATHS_KEY = 'firefly_expanded_folders';

export const useTreeStore = defineStore('tree', () => {
  // All nodes from backend (flat with depth)
  const allNodes = ref<TreeNode[]>([]);

  // Expanded folder paths (persisted to localStorage)
  const expandedPaths = ref<Set<string>>(new Set());

  // Currently selected node ID
  const selectedNodeId = ref<string | null>(null);

  // Loading states
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Flattened visible nodes (respecting expanded state)
  const visibleNodes = computed(() => {
    const result: TreeNode[] = [];
    const hiddenPaths = new Set<string>();

    for (const node of allNodes.value) {
      // Check if any parent is collapsed
      let isHidden = false;
      for (const hiddenPath of hiddenPaths) {
        if (node.path.startsWith(hiddenPath)) {
          isHidden = true;
          break;
        }
      }

      if (isHidden) continue;

      // Check if this node's parent path is hidden
      const parentPath = node.path.substring(0, node.path.lastIndexOf(node.type === 'file' ? '\\' : '/'));
      if (parentPath && !expandedPaths.value.has(parentPath)) {
        // Check if this is a direct child of a collapsed folder
        for (const hiddenPath of hiddenPaths) {
          if (node.path.startsWith(hiddenPath)) {
            isHidden = true;
            break;
          }
        }
        if (isHidden) continue;
      }

      result.push(node);

      // If this is a collapsed folder, mark its path as hidden
      if (node.type === 'folder' && !expandedPaths.value.has(node.path) && !node.isEmpty) {
        hiddenPaths.add(node.path + '\\');
        hiddenPaths.add(node.path + '/');
      }
    }

    return result;
  });

  // Convert raw API response to frontend type
  function toTreeNode(raw: RawTreeNode): TreeNode {
    return {
      id: raw.id,
      name: raw.name,
      path: raw.path,
      type: raw.type,
      depth: raw.depth,
      createdAt: raw.created_at,
      updatedAt: raw.updated_at,
      tags: raw.tags,
      isEmpty: raw.is_empty,
    };
  }

  // Load expanded paths from localStorage (now defaults to collapsed)
  function loadExpandedPaths() {
    // Always start with collapsed state, don't restore from localStorage
    expandedPaths.value = new Set();
  }

  // Save expanded paths to localStorage
  function saveExpandedPaths() {
    localStorage.setItem(EXPANDED_PATHS_KEY, JSON.stringify([...expandedPaths.value]));
  }

  // Fetch tree for a category
  async function fetchTree(categoryPath: string) {
    isLoading.value = true;
    error.value = null;
    try {
      const result = await invoke<RawTreeNode[]>('get_tree_nodes', { categoryPath });
      allNodes.value = result.map(toTreeNode);
    } catch (e) {
      error.value = String(e);
      allNodes.value = [];
    } finally {
      isLoading.value = false;
    }
  }

  // Toggle folder expansion
  function toggleFolder(path: string) {
    if (expandedPaths.value.has(path)) {
      expandedPaths.value.delete(path);
    } else {
      expandedPaths.value.add(path);
    }
    saveExpandedPaths();
  }

  // Check if a folder is expanded
  function isExpanded(path: string): boolean {
    return expandedPaths.value.has(path);
  }

  // Create folder
  async function createFolder(parentPath: string, name: string): Promise<TreeNode> {
    // Use snake_case to match Rust backend
    const request = { parent_path: parentPath, name };
    const result = await invoke<RawTreeNode>('create_folder', { request });
    const node = toTreeNode(result);

    // Recalculate depth based on parent
    const parentNode = allNodes.value.find(n => n.path === parentPath);
    node.depth = parentNode ? parentNode.depth + 1 : 0;

    // Insert into allNodes at correct position
    insertNode(node);

    // Update parent's isEmpty status
    if (parentNode) {
      const parentIndex = allNodes.value.findIndex(n => n.path === parentPath);
      if (parentIndex !== -1) {
        allNodes.value[parentIndex] = { ...allNodes.value[parentIndex], isEmpty: false };
      }
    }

    // Expand parent to show new folder
    if (parentPath && !expandedPaths.value.has(parentPath)) {
      expandedPaths.value.add(parentPath);
      saveExpandedPaths();
    }

    return node;
  }

  // Create note in folder
  async function createNoteInFolder(parentPath: string, title: string): Promise<TreeNode> {
    // Use snake_case to match Rust backend
    const request = { parent_path: parentPath, title };
    const result = await invoke<RawTreeNode>('create_note_in_folder', { request });
    const node = toTreeNode(result);

    // Recalculate depth based on parent
    const parentNode = allNodes.value.find(n => n.path === parentPath);
    node.depth = parentNode ? parentNode.depth + 1 : 0;

    // Insert into allNodes at correct position
    insertNode(node);

    // Expand parent to show new note
    if (parentPath && !expandedPaths.value.has(parentPath)) {
      expandedPaths.value.add(parentPath);
      saveExpandedPaths();
    }

    return node;
  }

  // Delete node (file or folder)
  async function deleteNode(path: string, type: 'folder' | 'file') {
    if (type === 'folder') {
      await invoke('delete_folder', { folderPath: path });
      // Remove folder and all its children
      allNodes.value = allNodes.value.filter(n => !n.path.startsWith(path + '\\') && !n.path.startsWith(path + '/') && n.path !== path);
      // Remove from expanded paths if present
      expandedPaths.value.delete(path);
      saveExpandedPaths();
    } else {
      await invoke('delete_note', { notePath: path });
      allNodes.value = allNodes.value.filter(n => n.path !== path);
    }

    // Clear selection if deleted node was selected
    if (selectedNodeId.value === path) {
      selectedNodeId.value = null;
    }
  }

  // Rename node
  async function renameNode(path: string, newName: string, type: 'folder' | 'file'): Promise<TreeNode | null> {
    // Store original depth before rename (backend returns incorrect depth)
    const originalNode = allNodes.value.find(n => n.path === path);
    const originalDepth = originalNode?.depth ?? 0;

    let result: RawTreeNode;

    if (type === 'folder') {
      result = await invoke<RawTreeNode>('rename_folder', { folderPath: path, newName });
    } else {
      result = await invoke<RawTreeNode>('rename_note', { notePath: path, newTitle: newName });
    }

    const newNode = toTreeNode(result);
    // Keep original depth (backend calculation is incorrect for nested items)
    newNode.depth = originalDepth;

    // For folders, update all children paths
    if (type === 'folder') {
      const oldPath = path;
      const newPath = result.path;

      allNodes.value = allNodes.value.map(n => {
        if (n.path === oldPath) {
          return newNode;
        }
        if (n.path.startsWith(oldPath + '\\') || n.path.startsWith(oldPath + '/')) {
          return {
            ...n,
            path: newPath + n.path.substring(oldPath.length),
            id: newPath + n.path.substring(oldPath.length),
          };
        }
        return n;
      });

      // Update expanded paths
      if (expandedPaths.value.has(oldPath)) {
        expandedPaths.value.delete(oldPath);
        expandedPaths.value.add(newPath);
        saveExpandedPaths();
      }
    } else {
      // For files, just update the single node
      const index = allNodes.value.findIndex(n => n.path === path);
      if (index !== -1) {
        allNodes.value[index] = newNode;
      }
    }

    // Update selection if renamed node was selected
    if (selectedNodeId.value === path) {
      selectedNodeId.value = newNode.id;
    }

    return newNode;
  }

  // Helper: Insert node at correct position (after its parent, before siblings)
  function insertNode(node: TreeNode) {
    // Find parent index
    const parentPath = node.path.substring(0, node.path.lastIndexOf('\\'));
    const parentIndex = allNodes.value.findIndex(n => n.path === parentPath);

    if (parentIndex !== -1) {
      // Find insertion point after parent's last child
      let insertIndex = parentIndex + 1;
      while (insertIndex < allNodes.value.length) {
        const nextNode = allNodes.value[insertIndex];
        if (nextNode.depth <= node.depth) {
          break;
        }
        insertIndex++;
      }

      // Insert at correct position based on type (folders first) and name
      const sameDepthStart = parentIndex + 1;
      let insertAt = sameDepthStart;

      // Find correct position among siblings
      for (let i = sameDepthStart; i < allNodes.value.length; i++) {
        const sibling = allNodes.value[i];
        if (sibling.depth !== node.depth) break;

        // Folders come first
        if (node.type === 'folder' && sibling.type === 'file') {
          insertAt = i;
          break;
        }
        if (node.type === sibling.type && node.name.localeCompare(sibling.name) <= 0) {
          insertAt = i;
          break;
        }
        insertAt = i + 1;
      }

      allNodes.value.splice(insertAt, 0, node);
    } else {
      // Insert at root level
      let insertAt = 0;
      for (let i = 0; i < allNodes.value.length; i++) {
        if (allNodes.value[i].depth > 0) break;

        if (node.type === 'folder' && allNodes.value[i].type === 'file') {
          insertAt = i;
          break;
        }
        if (node.type === allNodes.value[i].type && node.name.localeCompare(allNodes.value[i].name) <= 0) {
          insertAt = i;
          break;
        }
        insertAt = i + 1;
      }

      allNodes.value.splice(insertAt, 0, node);
    }
  }

  function selectNode(id: string | null) {
    selectedNodeId.value = id;
  }

  function clearTree() {
    allNodes.value = [];
    selectedNodeId.value = null;
  }

  // Get node by path
  function getNodeByPath(path: string): TreeNode | undefined {
    return allNodes.value.find(n => n.path === path);
  }

  return {
    allNodes,
    visibleNodes,
    expandedPaths,
    selectedNodeId,
    isLoading,
    error,
    fetchTree,
    toggleFolder,
    isExpanded,
    createFolder,
    createNoteInFolder,
    deleteNode,
    renameNode,
    selectNode,
    clearTree,
    loadExpandedPaths,
    saveExpandedPaths,
    getNodeByPath,
  };
});