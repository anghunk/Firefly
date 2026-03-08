<script setup lang="ts">
import { computed } from 'vue';
import type { TreeNode } from '../../types';

const props = defineProps<{
  node: TreeNode;
  isSelected: boolean;
  isContextMenuActive?: boolean;
  isExpanded: boolean;
}>();

const emit = defineEmits<{
  click: [];
  toggle: [];
  rename: [];
  delete: [];
  openInExplorer: [];
  contextmenu: [e: MouseEvent];
}>();

// Calculate padding based on depth (16px per level + 12px base)
const paddingStyle = computed(() => ({
  paddingLeft: `${props.node.depth * 16 + 12}px`,
}));

const isFolder = computed(() => props.node.type === 'folder');

function handleClick() {
  if (isFolder.value) {
    emit('toggle');
  } else {
    emit('click');
  }
}

function handleContextMenu(e: MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  emit('contextmenu', e);
}

function formatDateTime(dateStr: string): string {
  return dateStr.replace('T', ' ');
}

const tooltipText = computed(() => {
  const typeLabel = isFolder.value ? '文件夹' : '文件';
  return `${typeLabel}
创建时间：${formatDateTime(props.node.createdAt)}
编辑时间：${formatDateTime(props.node.updatedAt)}`;
});
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

    <!-- Name -->
    <span
      class="text-base truncate flex-1"
      :title="tooltipText"
    >
      {{ node.name }}
      <span v-if="isFolder && node.isEmpty" class="text-gray-400 text-xs ml-1">(空)</span>
    </span>
  </div>
</template>