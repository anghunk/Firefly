<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef } from 'vue';
import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';

const props = defineProps<{
  content: string;
  fontSize?: number;
  lineHeight?: number;
  showLineNumbers?: boolean;
  autoSaveDelay?: number;
  notePath: string;
}>();

const emit = defineEmits<{
  save: [content: string];
}>();

const editorContainer = ref<HTMLElement | null>(null);
const editorView = shallowRef<EditorView | null>(null);
const lineNumbersCompartment = new Compartment();
const themeCompartment = new Compartment();

const saveStatus = ref<'saved' | 'saving' | 'modified'>('saved');
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// Create editor theme based on props
function createTheme(fontSize: number, lineHeight: number) {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: `${fontSize}px`,
    },
    '.cm-content': {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      lineHeight: lineHeight,
      padding: '16px 0',
    },
    '.cm-line': {
      padding: '0 16px',
    },
    '.cm-gutters': {
      backgroundColor: 'transparent',
      border: 'none',
      color: 'rgb(156, 163, 175)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
    },
    '.cm-cursor': {
      borderLeftColor: 'rgb(59, 130, 246)',
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgb(59, 130, 246, 0.2) !important',
    },
  }, { dark: document.documentElement.classList.contains('dark') });
}

// Debounced save
function debouncedSave(content: string) {
  saveStatus.value = 'modified';

  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(async () => {
    saveStatus.value = 'saving';
    emit('save', content);
    saveStatus.value = 'saved';
  }, props.autoSaveDelay || 500);
}

// Initialize editor
onMounted(() => {
  if (!editorContainer.value) return;

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const newContent = update.state.doc.toString();
      debouncedSave(newContent);
    }
  });

  const state = EditorState.create({
    doc: props.content,
    extensions: [
      lineNumbersCompartment.of(props.showLineNumbers !== false ? lineNumbers() : []),
      history(),
      drawSelection(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      markdown({ base: markdownLanguage }),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      keymap.of([...defaultKeymap, ...historyKeymap]),
      themeCompartment.of(createTheme(props.fontSize || 14, props.lineHeight || 1.6)),
      updateListener,
      EditorView.lineWrapping,
    ],
  });

  editorView.value = new EditorView({
    state,
    parent: editorContainer.value,
  });
});

// Update content from outside
watch(() => props.content, (newContent) => {
  if (editorView.value && editorView.value.state.doc.toString() !== newContent) {
    editorView.value.dispatch({
      changes: {
        from: 0,
        to: editorView.value.state.doc.length,
        insert: newContent,
      },
    });
  }
});

// Update line numbers
watch(() => props.showLineNumbers, (show) => {
  if (editorView.value) {
    editorView.value.dispatch({
      effects: lineNumbersCompartment.reconfigure(show !== false ? lineNumbers() : []),
    });
  }
});

// Update font size and line height
watch([() => props.fontSize, () => props.lineHeight], ([fontSize, lineHeight]) => {
  if (editorView.value) {
    editorView.value.dispatch({
      effects: themeCompartment.reconfigure(createTheme(fontSize || 14, lineHeight || 1.6)),
    });
  }
});

// Cleanup
onUnmounted(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  if (editorView.value) {
    editorView.value.destroy();
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Status bar -->
    <div class="flex items-center justify-end px-4 h-8 border-b border-gray-200 dark:border-gray-800">
      <span
        :class="[
          'text-xs',
          saveStatus === 'saved' && 'text-gray-400',
          saveStatus === 'saving' && 'text-blue-500',
          saveStatus === 'modified' && 'text-amber-500',
        ]"
      >
        {{ saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中...' : '已修改' }}
      </span>
    </div>

    <!-- Editor -->
    <div ref="editorContainer" class="flex-1 overflow-hidden" />
  </div>
</template>

<style>
.cm-editor {
  height: 100%;
}

.cm-scroller {
  overflow: auto;
}

/* Dark mode support */
.dark .cm-content {
  caret-color: white;
}

.dark .cm-selectionBackground {
  background-color: rgba(59, 130, 246, 0.3) !important;
}
</style>