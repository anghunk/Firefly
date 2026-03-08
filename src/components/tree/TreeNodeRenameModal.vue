<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { Modal, Button, Input } from '../common';
import type { TreeNode } from '../../types';

const props = defineProps<{
  isOpen: boolean;
  node: TreeNode | null;
}>();

const emit = defineEmits<{
  close: [];
  submit: [newName: string];
}>();

const name = ref('');
const isLoading = ref(false);
const error = ref('');

const isFolder = computed(() => props.node?.type === 'folder');
const title = computed(() => isFolder.value ? '重命名文件夹' : '重命名');
const placeholder = computed(() => isFolder.value ? '文件夹名称' : '笔记标题');

watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.node) {
    name.value = props.node.name;
    error.value = '';
  }
}, { immediate: true });

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = isFolder.value ? '请输入文件夹名称' : '请输入笔记标题';
    return;
  }

  if (name.value.trim() === props.node?.name) {
    emit('close');
    return;
  }

  // Validate folder name
  if (isFolder.value) {
    const invalidChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
    if (invalidChars.some(char => name.value.includes(char))) {
      error.value = '文件夹名称包含无效字符';
      return;
    }
  }

  isLoading.value = true;
  error.value = '';

  try {
    emit('submit', name.value.trim());
  } catch (e) {
    error.value = String(e);
  } finally {
    isLoading.value = false;
  }
}

function handleClose() {
  name.value = '';
  error.value = '';
  emit('close');
}
</script>

<template>
  <Modal :is-open="isOpen" :title="title" :close-on-backdrop="false" @close="handleClose">
    <div class="space-y-3">
      <Input
        v-model="name"
        :placeholder="placeholder"
        autofocus
        @keydown.enter="handleSubmit"
      />
      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <Button variant="secondary" @click="handleClose">取消</Button>
        <Button variant="primary" :loading="isLoading" @click="handleSubmit">
          保存
        </Button>
      </div>
    </div>
  </Modal>
</template>