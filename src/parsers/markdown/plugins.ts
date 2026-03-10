/**
 * Markdown 插件系统
 */

import { Token, ASTNode, MarkdownPlugin } from './types';

/**
 * 插件管理器类
 */
export class PluginManager {
  private plugins: MarkdownPlugin[] = [];
  private preprocessors: Array<(content: string) => string> = [];

  /**
   * 注册插件
   */
  register(plugin: MarkdownPlugin): void {
    this.plugins.push(plugin);
  }

  /**
   * 取消注册插件
   */
  unregister(pluginName: string): void {
    this.plugins = this.plugins.filter(p => p.name !== pluginName);
  }

  /**
   * 获取所有插件
   */
  getPlugins(): MarkdownPlugin[] {
    return [...this.plugins];
  }

  /**
   * 应用预处理函数
   */
  applyPreprocess(content: string): string {
    let result = content;
    for (const preprocessor of this.preprocessors) {
      result = preprocessor(result);
    }
    return result;
  }

  /**
   * 注册预处理函数
   */
  registerPreprocessor(preprocessor: (content: string) => string): void {
    this.preprocessors.push(preprocessor);
  }

  /**
   * 应用 Tokenizer 插件扩展
   */
  applyTokenizer(content: string, tokens: Token[]): Token[] {
    let result = tokens;
    for (const plugin of this.plugins) {
      if (plugin.tokenize) {
        result = plugin.tokenize(content, result);
      }
    }
    return result;
  }

  /**
   * 应用 Parser 插件扩展
   */
  applyParser(tokens: Token[], ast: ASTNode): ASTNode {
    let result = ast;
    for (const plugin of this.plugins) {
      if (plugin.parse) {
        result = plugin.parse(tokens, result);
      }
    }
    return result;
  }

  /**
   * 应用 Renderer 插件扩展
   */
  applyRenderer(node: ASTNode, html: string): string {
    let result = html;
    for (const plugin of this.plugins) {
      if (plugin.render) {
        result = plugin.render(node, result);
      }
    }
    return result;
  }

  /**
   * 获取自定义渲染器
   */
  getCustomRenderer(nodeType: string): ((node: ASTNode) => string) | undefined {
    for (const plugin of this.plugins) {
      if (plugin.customRenderers && plugin.customRenderers[nodeType]) {
        return plugin.customRenderers[nodeType];
      }
    }
    return undefined;
  }
}