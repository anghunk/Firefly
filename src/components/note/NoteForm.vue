<script setup lang="ts">
import { ref } from 'vue';
import { useNoteStore } from '../../stores';
import { Modal, Button, Input } from '../common';

const props = defineProps<{
  isOpen: boolean;
  categoryId: string;
}>();

const emit = defineEmits<{
  close: [];
  submit: [];
}>();

const noteStore = useNoteStore();

const title = ref('');
const isLoading = ref(false);
const error = ref('');

async function handleSubmit() {
  if (!title.value.trim()) {
    error.value = '请输入笔记标题';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const note = await noteStore.createNote(props.categoryId, title.value.trim());
    noteStore.selectNote(note.id);
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
  <Modal :is-open="isOpen" title="新建笔记" @close="handleClose">
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
          创建
        </Button>
      </div>
    </div>
  </Modal>
</template>