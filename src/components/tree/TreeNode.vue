<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue';
import type { TreeNode } from '../../types';

const props = defineProps<{
  node: TreeNode;
  isSelected: boolean;
  isContextMenuActive?: boolean;
  isExpanded: boolean;
  isEditing?: boolean;
}>();

const emit = defineEmits<{
  click: [];
  toggle: [];
  rename: [];
  delete: [];
  openInExplorer: [];
  contextmenu: [e: MouseEvent];
  renameSubmit: [newName: string];
  renameCancel: [];
  dblclick: [];
}>();

// Inline editing state
const editInputRef = ref<HTMLInputElement | null>(null);
const editName = ref('');
const hasFocus = ref(false);

// Calculate padding based on depth (16px per level + 12px base)
const paddingStyle = computed(() => ({
  paddingLeft: `${props.node.depth * 16 + 12}px`,
}));

const isFolder = computed(() => props.node.type === 'folder');

function handleClick() {
  if (props.isEditing) {
    // Don't trigger click when editing
    return;
  }
  if (isFolder.value) {
    emit('toggle');
  } else {
    emit('click');
  }
}

function handleDoubleClick(e: MouseEvent) {
  e.stopPropagation();
  emit('dblclick');
}

function handleContextMenu(e: MouseEvent) {
  if (props.isEditing) {
    // When editing, let the blur event handle saving first
    // Don't prevent default, allow the context menu to show after editing completes
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  emit('contextmenu', e);
}

function formatDateTime(dateStr: string): string {
  return dateStr.replace('T', ' ');
}

const tooltipText = computed(() => {
  return `创建时间：${formatDateTime(props.node.createdAt)}
编辑时间：${formatDateTime(props.node.updatedAt)}`;
});

// Handle inline editing
watch(() => props.isEditing, (isEditing) => {
  if (isEditing) {
    editName.value = props.node.name;
    hasFocus.value = false;
    nextTick(() => {
      editInputRef.value?.focus();
      editInputRef.value?.select();
    });
  }
});

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    submitRename();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    emit('renameCancel');
  }
}

function handleBlur() {
  hasFocus.value = false;
  submitRename();
}

function handleFocus() {
  hasFocus.value = true;
}

function handleInputMouseDown(e: MouseEvent) {
  e.stopPropagation();
}

function submitRename() {
  const trimmedName = editName.value.trim();
  if (trimmedName && trimmedName !== props.node.name) {
    emit('renameSubmit', trimmedName);
  } else {
    emit('renameCancel');
  }
}
</script>

<template>
  <div
    :class="[
      'group flex items-center gap-1 py-2 cursor-pointer select-none',
      isContextMenuActive
        ? 'bg-blue-50 dark:bg-blue-900/30'
        : isSelected
          ? 'bg-gray-100 dark:bg-gray-800'
          : 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900'
    ]"
    :style="paddingStyle"
    @click="handleClick"
    @dblclick="handleDoubleClick"
    @contextmenu="handleContextMenu"
  >
    <!-- Folder icon -->
    <template v-if="isFolder">
      <PhFolderOpen
        v-if="isExpanded"
        :size="16"
        class="text-gray-400 flex-shrink-0"
      />
      <PhFolder
        v-else
        :size="16"
        class="text-gray-400 flex-shrink-0"
      />
    </template>

    <!-- File icon -->
    <template v-else>
      <PhFileText :size="16" class="text-gray-400 flex-shrink-0" />
    </template>

    <!-- Name (display mode) -->
    <span
      v-if="!isEditing"
      class="text-base truncate flex-1"
      :title="tooltipText"
    >
      {{ node.name }}
      <span v-if="isFolder && node.isEmpty" class="text-gray-400 text-xs ml-1">(空)</span>
    </span>

    <!-- Name (edit mode) -->
    <input
      v-else
      ref="editInputRef"
      v-model="editName"
      class="flex-1 text-sm px-1.5 py-0.5 border border-blue-500 rounded bg-white dark:bg-gray-900 dark:text-white outline-none"
      @keydown="handleKeyDown"
      @blur="handleBlur"
      @focus="handleFocus"
      @mousedown="handleInputMouseDown"
    />
  </div>
</template>