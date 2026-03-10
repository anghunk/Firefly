/**
 * Markdown 渲染 Composable
 */

import { MarkdownParser } from '../parsers/markdown';

// 创建全局解析器实例
const parser = new MarkdownParser({
  enableHtml: true,
  enableTaskLists: true,
  enableLinks: true,
});

export function useMarkdown() {
  function render(content: string): string {
    return parser.render(content);
  }

  function renderInline(content: string): string {
    return parser.renderInline(content);
  }

  function getParser(): MarkdownParser {
    return parser;
  }

  return {
    render,
    renderInline,
    getParser,
  };
}