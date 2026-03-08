<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useTreeStore } from '../../stores';
import { Modal, Button, Input } from '../common';

const props = defineProps<{
  isOpen: boolean;
  parentPath: string;
}>();

const emit = defineEmits<{
  close: [];
  submit: [];
}>();

const treeStore = useTreeStore();

const title = ref('');
const isLoading = ref(false);
const error = ref('');

// Get parent folder name for display
const parentName = computed(() => {
  const node = treeStore.getNodeByPath(props.parentPath);
  return node?.name || '根目录';
});

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    title.value = '';
    error.value = '';
  }
}, { immediate: true });

async function handleSubmit() {
  if (!title.value.trim()) {
    error.value = '请输入笔记标题';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const node = await treeStore.createNoteInFolder(props.parentPath, title.value.trim());
    treeStore.selectNode(node.id);
    title.value = '';
    emit('submit');
  } catch (e) {
    error.value = String(e);
  } finally {
    isLoading.value = false;
  }
}

function handleClose() {
  title.value = '';
  error.value = '';
  emit('close');
}
</script>

<template>
  <Modal :is-open="isOpen" title="新建笔记" :close-on-backdrop="false" @close="handleClose">
    <div class="space-y-3">
      <p class="text-xs text-gray-500">在「{{ parentName }}」中创建</p>
      <Input
        v-model="title"
        placeholder="笔记标题"
        autofocus
        @keydown.enter="handleSubmit"
      />
      <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      <div class="flex justify-end gap-2">
        <Button variant="secondary" @click="handleClose">取消</Button>
        <Button variant="primary" :loading="isLoading" @click="handleSubmit">
          创建
        </Button>
      </div>
    </div>
  </Modal>
</template>