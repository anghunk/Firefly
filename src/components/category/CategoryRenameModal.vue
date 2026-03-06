<script setup lang="ts">
import { ref, watch } from 'vue';
import { Modal, Button, Input } from '../common';

const props = defineProps<{
  isOpen: boolean;
  currentName: string;
}>();

const emit = defineEmits<{
  close: [];
  submit: [newName: string];
}>();

const name = ref('');
const isLoading = ref(false);
const error = ref('');

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    name.value = props.currentName;
    error.value = '';
  }
}, { immediate: true });

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = '请输入分类名称';
    return;
  }

  if (name.value.trim() === props.currentName) {
    emit('close');
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
  <Modal :is-open="isOpen" title="重命名分类" :close-on-backdrop="false" @close="handleClose">
    <div class="space-y-3">
      <Input
        v-model="name"
        placeholder="分类名称"
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