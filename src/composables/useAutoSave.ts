import { ref, onUnmounted } from 'vue';

export function useAutoSave(
  getValue: () => string,
  save: (value: string) => Promise<void>,
  delay: number = 500
) {
  const status = ref<'saved' | 'saving' | 'modified'>('saved');
  let timeout: ReturnType<typeof setTimeout> | null = null;

  function triggerSave(value: string) {
    status.value = 'modified';

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(async () => {
      status.value = 'saving';
      try {
        await save(value);
        status.value = 'saved';
      } catch (error) {
        console.error('Auto-save failed:', error);
        status.value = 'modified';
      }
    }, delay);
  }

  function flush() {
    if (timeout) {
      clearTimeout(timeout);
      if (status.value === 'modified') {
        const value = getValue();
        save(value);
      }
    }
  }

  onUnmounted(() => {
    if (timeout) {
      clearTimeout(timeout);
    }
  });

  return {
    status,
    triggerSave,
    flush,
  };
}