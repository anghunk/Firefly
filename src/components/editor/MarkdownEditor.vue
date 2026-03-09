<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef, computed, nextTick } from 'vue';
import { EditorView, keymap, lineNumbers, drawSelection, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { defaultHighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { invoke } from '@tauri-apps/api/core';
import { useMarkdown } from '../../composables/useMarkdown';
import 'github-markdown-css/github-markdown.css';

const props = defineProps<{
  content: string;
  showLineNumbers?: boolean;
  notePath: string;
}>();

const emit = defineEmits<{
  save: [content: string];
  renamed: [newTitle: string];
}>();

const editorContainer = ref<HTMLElement | null>(null);
const previewContainer = ref<HTMLElement | null>(null);
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

// Character counts
const charCount = computed(() => currentDocContent.value.length);

// Current filename (without extension)
const currentFilename = computed(() => {
  if (!props.notePath) return '';
  const filename = props.notePath.split(/[/\\]/).pop() || '';
  return filename.replace(/\.md$/, '');
});

// Rename state
const isRenaming = ref(false);
const newName = ref('');
const filenameInput = ref<HTMLInputElement | null>(null);

// Start renaming
function startRename() {
  if (!props.notePath) return;
  newName.value = currentFilename.value;
  isRenaming.value = true;
  nextTick(() => {
    filenameInput.value?.focus();
    filenameInput.value?.select();
  });
}

// Cancel renaming
function cancelRename() {
  isRenaming.value = false;
  newName.value = '';
}

// Confirm rename
async function confirmRename() {
  if (!newName.value.trim() || !props.notePath) {
    cancelRename();
    return;
  }

  if (newName.value.trim() === currentFilename.value) {
    cancelRename();
    return;
  }

  try {
    await invoke('rename_note', {
      notePath: props.notePath,
      newTitle: newName.value.trim(),
    });
    emit('renamed', newName.value.trim());
    isRenaming.value = false;
    newName.value = '';
  } catch (e) {
    console.error('重命名失败:', e);
    cancelRename();
  }
}

// Preview rendered content with debouncing
const debouncedRenderContent = ref('');
const isRenderingPreview = ref(false);
let renderTimeout: ReturnType<typeof setTimeout> | null = null;

const renderedContent = computed(() => {
  // Only render when actually in preview mode
  if (!isPreviewMode.value) {
    return '';
  }

  // Use debounced value during editing, direct value when switching modes
  return isRenderingPreview.value ? renderMarkdown(currentDocContent.value) : debouncedRenderContent.value;
});

// Debounced preview render
function schedulePreviewRender() {
  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }

  renderTimeout = setTimeout(() => {
    debouncedRenderContent.value = renderMarkdown(currentDocContent.value);
    isRenderingPreview.value = false;
    nextTick(() => {
      // Attach checkbox listeners after rendering
      attachCheckboxListeners();
    });
  }, 150); // Debounce preview rendering by 150ms
}

// Handle checkbox change in preview mode
function handleCheckboxChange(event: Event) {
  const checkbox = event.target as HTMLInputElement;
  const li = checkbox.closest('li.task-list-item') as HTMLLIElement | null;
  if (!li) return;

  const ul = li.parentElement;
  if (!ul) return;

  // Find the index of this checkbox in the list
  const lis = Array.from(ul.children).filter(
    (child): child is HTMLLIElement => child.tagName === 'LI'
  );
  const checkboxIndex = lis.indexOf(li);

  // Find all checkboxes in the current document
  const lines = currentDocContent.value.split('\n');
  let checkboxCount = 0;
  const newChecked = checkbox.checked ? '[x]' : '[ ]';

  // Find and update the matching checkbox line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*[-*+]\s+\[([ x])\]/.test(line)) {
      if (checkboxCount === checkboxIndex) {
        // Found the matching checkbox line
        lines[i] = line.replace(/^\s*([-*+]\s+)\[([ x])\]/, `$1${newChecked}`);
        break;
      }
      checkboxCount++;
    }
  }

  const newContent = lines.join('\n');
  currentDocContent.value = newContent;

  // Update editor
  if (editorView.value) {
    editorView.value.dispatch({
      changes: {
        from: 0,
        to: editorView.value.state.doc.length,
        insert: newContent,
      },
    });
  }

  // Save and re-render
  debouncedSave(newContent);
  debouncedRenderContent.value = renderMarkdown(newContent);
  nextTick(() => {
    // Re-attach listeners after re-rendering
    attachCheckboxListeners();
  });
}

// Attach checkbox listeners to preview content
function attachCheckboxListeners() {
  if (!previewContainer.value) return;
  const checkboxes = previewContainer.value.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', handleCheckboxChange);
  });
}

function togglePreviewMode() {
  const wasPreview = isPreviewMode.value;
  isPreviewMode.value = !isPreviewMode.value;

  // When switching to preview mode, render immediately
  if (!wasPreview && isPreviewMode.value) {
    debouncedRenderContent.value = renderMarkdown(currentDocContent.value);
    nextTick(() => {
      // Attach checkbox listeners after rendering
      attachCheckboxListeners();
    });
  } else if (wasPreview && !isPreviewMode.value) {
    // Clear preview when switching back to edit mode to free memory
    debouncedRenderContent.value = '';
  }
}

// Create editor theme with default values
function createTheme() {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '14px',
    },
    '.cm-content': {
      fontFamily: '"Noto Sans SC", ui-sans-serif, system-ui, -apple-system, sans-serif',
      lineHeight: 1.6,
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
  }, 500);
}

// Initialize editor
onMounted(() => {
  if (!editorContainer.value) return;

  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      const newContent = update.state.doc.toString();
      currentDocContent.value = newContent;
      debouncedSave(newContent);
      // Only schedule preview render if in preview mode
      if (isPreviewMode.value) {
        isRenderingPreview.value = true;
        schedulePreviewRender();
      }
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
      themeCompartment.of(createTheme()),
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
  currentDocContent.value = newContent;
  if (editorView.value && editorView.value.state.doc.toString() !== newContent) {
    editorView.value.dispatch({
      changes: {
        from: 0,
        to: editorView.value.state.doc.length,
        insert: newContent,
      },
    });
  }
  // Update preview if in preview mode
  if (isPreviewMode.value) {
    debouncedRenderContent.value = renderMarkdown(newContent);
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

// Cleanup
onUnmounted(() => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  if (renderTimeout) {
    clearTimeout(renderTimeout);
  }
  if (editorView.value) {
    editorView.value.destroy();
  }
});
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Status bar -->
    <div class="flex items-center justify-between px-4 h-10 border-b border-gray-200 dark:border-gray-800">
      <div class="flex flex-1 min-w-0">
        <!-- Display mode -->
        <span
          v-if="!isRenaming"
          @click="startRename"
          class="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-500 dark:hover:text-blue-400 transition-colors inline-block truncate max-w-full"
          :title="currentFilename || '点击重命名'"
        >
          {{ currentFilename || '未命名' }}
        </span>
        <!-- Edit mode -->
        <input
          v-else
          ref="filenameInput"
          v-model="newName"
          @blur="confirmRename"
          @keydown.enter="confirmRename"
          @keydown.esc="cancelRename"
          class="flex-1 text-sm font-medium bg-transparent border-none! shadow-none! outline-none! text-gray-700 dark:text-gray-300 w-full"
          placeholder="文件名"
        />
      </div>
      <button
        @click="togglePreviewMode"
        class="flex items-center gap-1 text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        :title="isPreviewMode ? '切换到编辑模式' : '切换到预览模式'"
      >
        <!-- <PhEye v-if="isPreviewMode" :size="16" />
        <PhPencilSimple v-else :size="16" /> -->
        <span>{{ isPreviewMode ? '编辑' : '预览' }}</span>
      </button>
      <!-- <span
        :class="[
          'text-xs',
          saveStatus === 'saved' && 'text-gray-400',
          saveStatus === 'saving' && 'text-blue-500',
          saveStatus === 'modified' && 'text-amber-500',
        ]"
      >
        {{ saveStatus === 'saved' ? '已保存' : saveStatus === 'saving' ? '保存中...' : '已修改' }}
      </span> -->
    </div>

    <!-- Editor -->
    <div v-show="!isPreviewMode" ref="editorContainer" class="flex-1 overflow-hidden" />

    <!-- Preview -->
    <div v-show="isPreviewMode" ref="previewContainer" class="flex-1 overflow-auto p-4">
      <article class="markdown-body max-w-none" v-html="renderedContent" />
    </div>

    <!-- Bottom status bar -->
    <div class="flex items-center justify-end gap-4 px-4 h-8 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
      <span>{{ charCount }} 字符</span>
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

/* Checkbox list styling - remove bullets */
.markdown-body li.task-list-item {
  list-style-type: none;
  display: flex;
  align-items: flex-start;
}

.markdown-body li.task-list-item::marker {
  content: '';
  display: none;
}
</style>