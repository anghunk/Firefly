/**
 * 正则表达式常量
 */

// 任务列表：- [ ] 或 - [x]
export const TASK_LIST_REGEX = /^(\s*)([-*+])\s+\[([ x])\]\s+(.*)$/;

// 标题：# 到 ######
export const HEADING_REGEX = /^(#{1,6})\s+(.*)$/;

// 代码块：```lang ... ```
export const CODE_BLOCK_REGEX = /^```(\w*)\n([\s\S]*?)^```$/gm;

// 引用块：> ...
export const BLOCKQUOTE_REGEX = /^>\s+(.*)$/;

// 有序列表：1. 2. ...
export const ORDERED_LIST_REGEX = /^(\s*)(\d+)\.\s+(.*)$/;

// 无序列表：- * +
export const UNORDERED_LIST_REGEX = /^(\s*)([-*+])\s+(.*)$/;

// 行内代码：`code`
export const INLINE_CODE_REGEX = /`([^`]+)`/g;

// 链接：[text](url)
export const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

// 图片：![alt](url)
export const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

// 空行
export const EMPTY_LINE_REGEX = /^\s*$/;

// 空白字符
export const WHITESPACE_REGEX = /^\s+$/;

// 水平线：--- 或 *** 或 ___
export const HORIZONTAL_RULE_REGEX = /^(\s*)(-{3,}|\*{3,}|_{3,})\s*$/;