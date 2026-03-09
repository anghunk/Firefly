<script setup lang="ts">
import { ref, watch } from "vue";
import {
  PhFolderSimple,
  PhGear,
  PhTextAa,
  PhHardDrive,
  PhInfo,
} from "@phosphor-icons/vue";
import { useSettingsStore } from "../../stores";
import { Modal, Button, Input } from "../common";
import * as pkg from "../../../package.json";

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const settingsStore = useSettingsStore();

const localConfig = ref({ ...settingsStore.config });
const isLoading = ref(false);
const activeTab = ref("storage");

// 设置分类
const tabs = [
  { id: "storage", label: "存储", icon: PhHardDrive },
  { id: "general", label: "通用", icon: PhGear },
  { id: "editor", label: "编辑器", icon: PhTextAa },
  { id: "about", label: "关于", icon: PhInfo },
];

watch(
  () => props.isOpen,
  () => {
    localConfig.value = { ...settingsStore.config };
  }
);

async function handleSelectDirectory() {
  await settingsStore.selectNotesDirectory();
  localConfig.value.notesDirectory = settingsStore.config.notesDirectory;
}

async function handleSave() {
  isLoading.value = true;
  try {
    settingsStore.config.notesDirectory = localConfig.value.notesDirectory;
    settingsStore.config.showLineNumbers = localConfig.value.showLineNumbers;
    settingsStore.config.minimizeToTray = localConfig.value.minimizeToTray;
    await settingsStore.saveConfig();
    emit("close");
  } finally {
    isLoading.value = false;
  }
}

function setTheme(theme: "light" | "dark" | "system") {
  localConfig.value.theme = theme;
  settingsStore.setTheme(theme);
}
</script>

<template>
  <Modal :is-open="isOpen" title="设置" size="lg" @close="emit('close')">
    <div class="flex h-[480px] -m-4">
      <!-- 左侧导航 -->
      <nav
        class="w-44 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-l-lg"
      >
        <ul class="py-2">
          <li v-for="tab in tabs" :key="tab.id">
            <button
              :class="[
                'w-full flex items-center gap-2 px-4 py-2 text-base text-left transition-colors',
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-[var(--color-yellow-600)] border-r-2 border-[var(--color-yellow-500)]'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50',
              ]"
              @click="activeTab = tab.id"
            >
              <component :is="tab.icon" :size="18" />
              {{ tab.label }}
            </button>
          </li>
        </ul>
      </nav>

      <!-- 右侧内容 -->
      <div class="flex-1 flex flex-col">
        <div class="flex-1 overflow-y-auto p-5">

          <!-- 存储设置 -->
          <div v-show="activeTab === 'storage'" class="space-y-5">
            <div>
              <label
                class="block text-base font-medium text-gray-900 dark:text-gray-100 mb-2"
              >
                笔记目录
              </label>
              <div class="flex gap-2 max-w-[300px]">
                <Input
                  v-model="localConfig.notesDirectory"
                  placeholder="选择笔记存储目录"
                  class="flex-1"
                  readonly
                />
                <Button variant="secondary" @click="handleSelectDirectory">
                  <PhFolderSimple :size="16" />
                </Button>
              </div>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
                请选择你想要使用的笔记目录
              </p>
            </div>
          </div>

          <!-- 通用设置 -->
          <div v-show="activeTab === 'general'" class="space-y-6">
            <h4 class="text-base font-medium text-gray-900 dark:text-gray-100">主题</h4>
            <div class="flex gap-3">
              <Button
                :variant="localConfig.theme === 'light' ? 'primary' : 'secondary'"
                @click="setTheme('light')"
              >
                浅色
              </Button>
              <Button
                :variant="localConfig.theme === 'dark' ? 'primary' : 'secondary'"
                @click="setTheme('dark')"
              >
                深色
              </Button>
              <Button
                :variant="localConfig.theme === 'system' ? 'primary' : 'secondary'"
                @click="setTheme('system')"
              >
                跟随系统
              </Button>
            </div>

            <div class="flex items-center justify-between">
              <label class="text-base font-medium text-gray-900 dark:text-gray-100"
                >关闭时最小化到托盘</label
              >
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="localConfig.minimizeToTray"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-yellow-300)] dark:peer-focus:ring-[var(--color-yellow-800)] rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-[var(--color-yellow-500)]"
                ></div>
              </label>
            </div>
          </div>

          <!-- 编辑器设置 -->
          <div v-show="activeTab === 'editor'" class="space-y-6">
            <div class="flex items-center justify-between">
              <label class="text-base font-medium text-gray-900 dark:text-gray-100"
                >显示行号</label
              >
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  v-model="localConfig.showLineNumbers"
                  type="checkbox"
                  class="sr-only peer"
                />
                <div
                  class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--color-yellow-300)] dark:peer-focus:ring-[var(--color-yellow-800)] rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-[var(--color-yellow-500)]"
                ></div>
              </label>
            </div>
          </div>

          <!-- 关于 -->
          <div v-show="activeTab === 'about'" class="space-y-4">
            <div>
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
                萤火笔记 - Firefly
              </h3>
              <a
                href="https://github.com/anghunk/Firefly"
                target="_blank"
                class="text-sm text-gray-500 dark:text-gray-400 mt-1 hover:underline"
                >v {{ pkg.version }}</a
              >
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
                捕捉思维的微光。
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">
                基于 Tauri
                构建的一款轻量、本地优先的笔记工具。无需联网，无需账号，让灵感如萤火般在本地静谧发光。在最私密的安全感中，汇聚你的知识森林。
              </p>
            </div>
          </div>

        </div>

        <!-- 底部按钮 -->
        <div
          class="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 dark:border-gray-700"
        >
          <Button variant="secondary" @click="emit('close')">取消</Button>
          <Button variant="primary" :loading="isLoading" @click="handleSave">
            保存
          </Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
