import { ref } from 'vue';

// 全局菜单状态，用于确保只有一个菜单打开
const currentMenuId = ref<string | null>(null);

export function useContextMenu() {
  function openMenu(id: string) {
    // 先关闭其他菜单
    if (currentMenuId.value && currentMenuId.value !== id) {
      window.dispatchEvent(new CustomEvent('close-context-menu'));
    }
    currentMenuId.value = id;
  }

  function closeMenu() {
    currentMenuId.value = null;
  }

  function isAnyMenuOpen(): boolean {
    return currentMenuId.value !== null;
  }

  return {
    currentMenuId,
    openMenu,
    closeMenu,
    isAnyMenuOpen,
  };
}