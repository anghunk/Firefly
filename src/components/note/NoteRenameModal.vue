<script setup lang="ts">
import { ref, watch } from 'vue';
import { Modal, Button, Input } from '../common';

const props = defineProps<{
  isOpen: boolean;
  currentTitle: string;
}>();

const emit = defineEmits<{
  close: [];
  submit: [newTitle: string];
}>();

const title = ref('');
const isLoading = ref(false);
const error = ref('');

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    title.value = props.currentTitle;
    error.value = '';
  }
}, { immediate: true });

async function handleSubmit() {
  if (!title.value.trim()) {
    error.value = '请输入笔记标题';
    return;
  }

  if (title.value.trim() === props.currentTitle) {
    emit('close');
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    emit('submit', title.value.trim());
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
  <Modal :is-open="isOpen" title="重命名笔记" :close-on-backdrop="false" @close="handleClose">
    <div class="space-y-3">
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
          保存
        </Button>
      </div>
    </div>
  </Modal>
</template>