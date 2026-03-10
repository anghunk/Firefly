/**
 * 自定义 Markdown 解析器
 */

import { MarkdownParserConfig, MarkdownPlugin } from './types';
import { MarkdownTokenizer } from './tokenizer';
import { SyntaxParser } from './parser';
import { MarkdownRenderer } from './renderer';
import { PluginManager } from './plugins';

/**
 * Markdown 解析器主类
 */
export class MarkdownParser {
  private tokenizer: MarkdownTokenizer;
  private parser: SyntaxParser;
  private renderer: MarkdownRenderer;
  private pluginManager: PluginManager;

  constructor(config: MarkdownParserConfig = {}) {
    this.pluginManager = new PluginManager();
    this.tokenizer = new MarkdownTokenizer(config);
    this.parser = new SyntaxParser(this.pluginManager);
    this.renderer = new MarkdownRenderer(this.pluginManager);
  }

  /**
   * 渲染 Markdown 为 HTML
   */
  render(markdown: string): string {
    // 应用插件预处理
    const preprocessed = this.pluginManager.applyPreprocess(markdown);

    // 词法分析
    const tokens = this.tokenizer.tokenize(preprocessed);

    // 应用插件 Tokenizer 扩展
    const extendedTokens = this.pluginManager.applyTokenizer(preprocessed, tokens);

    // 语法分析
    const ast = this.parser.parse(extendedTokens);

    // 应用插件 Parser 扩展
    const extendedAST = this.pluginManager.applyParser(extendedTokens, ast);

    // HTML 渲染
    return this.renderer.render(extendedAST);
  }

  /**
   * 渲染行内 Markdown（用于段落内的文本）
   */
  renderInline(markdown: string): string {
    const tokens = this.tokenizer.tokenizeInline(markdown);
    const ast = this.parser.parseInline(tokens);
    return this.renderer.renderInline(ast);
  }

  /**
   * 注册插件
   */
  use(plugin: MarkdownPlugin): void {
    this.pluginManager.register(plugin);
  }

  /**
   * 取消注册插件
   */
  unuse(pluginName: string): void {
    this.pluginManager.unregister(pluginName);
  }

  /**
   * 获取复选框映射表（用于任务列表交互）
   */
  getCheckboxMap(): Map<number, { line: number; checked: boolean }> {
    return this.parser.getCheckboxMap();
  }
}