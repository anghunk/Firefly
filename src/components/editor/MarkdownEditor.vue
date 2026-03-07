<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef, computed } from 'vue';
import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { useMarkdown } from '../../composables/useMarkdown';
import 'github-markdown-css/github-markdown.css';

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

// Preview mode
const isPreviewMode = ref(false);
const { render: renderMarkdown } = useMarkdown();

// Store current content for preview (reactive)
const currentDocContent = ref(props.content);

const renderedContent = computed(() => {
  return renderMarkdown(currentDocContent.value);
});

function togglePreviewMode() {
  isPreviewMode.value = !isPreviewMode.value;
}

// Create editor theme based on props
function createTheme(fontSize: number, lineHeight: number) {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: `${fontSize}px`,
    },
    '.cm-content': {
      fontFamily: '"Noto Sans SC", ui-sans-serif, system-ui, -apple-system, sans-serif',
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
      currentDocContent.value = newContent; // Update immediately for preview
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
  currentDocContent.value = newContent; // Update for preview
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
    <div class="flex items-center justify-between px-4 h-8 border-b border-gray-200 dark:border-gray-800">
      <button
        @click="togglePreviewMode"
        class="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        :title="isPreviewMode ? '切换到编辑模式' : '切换到预览模式'"
      >
        <PhEye v-if="isPreviewMode" :size="16" />
        <PhPencilSimple v-else :size="16" />
        <span>{{ isPreviewMode ? '编辑' : '预览' }}</span>
      </button>
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
    <div v-show="!isPreviewMode" ref="editorContainer" class="flex-1 overflow-hidden" />

    <!-- Preview -->
    <div v-show="isPreviewMode" class="flex-1 overflow-auto p-4">
      <article class="markdown-body max-w-none" v-html="renderedContent" />
    </div>
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

/* Markdown preview container */
.markdown-body {
  font-family: "Noto Sans SC", ui-sans-serif, system-ui, -apple-system, sans-serif;
}

/* Dark mode support for github-markdown-css */
.dark .markdown-body {
  color-scheme: dark;
  --color-fg-default: #e6edf3;
  --color-fg-muted: #8d96a0;
  --color-fg-subtle: #6e7681;
  --color-canvas-default: #0d1117;
  --color-canvas-subtle: #161b22;
  --color-border-default: #30363d;
  --color-border-muted: #21262d;
  --color-neutral-muted: rgba(110,118,129,0.4);
  --color-accent-fg: #58a6ff;
  --color-accent-emphasis: #1f6feb;
  --color-success-fg: #3fb950;
  --color-attention-fg: #d29922;
  --color-danger-fg: #f85149;
  --color-done-fg: #a371f7;
}
</style>