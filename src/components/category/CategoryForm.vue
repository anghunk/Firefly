<script setup lang="ts">
import { ref } from 'vue';
import { useCategoryStore, useSettingsStore } from '../../stores';
import { Modal, Button, Input } from '../common';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  submit: [];
}>();

const categoryStore = useCategoryStore();
const settingsStore = useSettingsStore();

const name = ref('');
const isLoading = ref(false);
const error = ref('');

async function handleSubmit() {
  if (!name.value.trim()) {
    error.value = '请输入分类名称';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    await categoryStore.createCategory(settingsStore.config.notesDirectory, name.value.trim());
    name.value = '';
    emit('submit');
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
  <Modal :is-open="isOpen" title="新建分类" :close-on-backdrop="false" @close="handleClose">
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
          创建
        </Button>
      </div>
    </div>
  </Modal>
</template>