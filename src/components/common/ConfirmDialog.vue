<script setup lang="ts">
import Modal from './Modal.vue';
import Button from './Button.vue';

defineProps<{
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>

<template>
  <Modal :is-open="isOpen" :title="title" @close="emit('cancel')">
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">{{ message }}</p>
    <div class="flex justify-end gap-2">
      <Button variant="secondary" @click="emit('cancel')">
        {{ cancelText || '取消' }}
      </Button>
      <Button :variant="variant || 'primary'" @click="emit('confirm')">
        {{ confirmText || '确定' }}
      </Button>
    </div>
  </Modal>
</template>