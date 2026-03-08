<script setup lang="ts">
import { ref, watch } from 'vue';
import { Modal, Button, Input } from '../common';

const props = defineProps<{
  isOpen: boolean;
  parentPath: string;
}>();

const emit = defineEmits<{
  close: [];
  submit: [name: string];
}>();

const name = ref('');
const isLoading = ref(false);
const error = ref('');

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    name.value = '';
    error.value = '';
  }
}, { immediate: true });

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = '请输入文件夹名称';
    return;
  }

  // Validate folder name
  const invalidChars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|'];
  if (invalidChars.some(char => name.value.includes(char))) {
    error.value = '文件夹名称包含无效字符';
    return;
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
  <Modal :is-open="isOpen" title="新建文件夹" :close-on-backdrop="false" @close="handleClose">
    <div class="space-y-3">
      <Input
        v-model="name"
        placeholder="文件夹名称"
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