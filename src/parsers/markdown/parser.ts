/**
 * Markdown 语法分析器
 */

import { Token, ASTNode } from './types';
import { PluginManager } from './plugins';

/**
 * Markdown 语法分析器类
 */
export class SyntaxParser {
  private checkboxMap: Map<number, { line: number; checked: boolean }> = new Map();
  private checkboxIndex: number = 0;

  constructor(_pluginManager: PluginManager) {
    // pluginManager is stored for future use, marked with underscore to suppress warning
  }

  /**
   * 将 Token 流转换为抽象语法树（AST）
   */
  parse(tokens: Token[]): ASTNode {
    this.checkboxMap.clear();
    this.checkboxIndex = 0;

    const children = this.parseBlock(tokens);

    return {
      type: 'root',
      children,
    };
  }

  /**
   * 解析行内内容
   */
  parseInline(tokens: Token[]): ASTNode {
    const children: ASTNode[] = [];

    for (const token of tokens) {
      const node = this.tokenToNode(token);
      if (node) {
        children.push(node);
      }
    }

    return {
      type: 'inline',
      children,
    };
  }

  /**
   * 解析块级元素
   */
  private parseBlock(tokens: Token[]): ASTNode[] {
    const nodes: ASTNode[] = [];
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      // 处理连续的任务列表，组合成一个容器
      if (token.type === 'task_list') {
        const taskListNode = this.parseTaskListContainer(tokens, i);
        nodes.push(taskListNode);
        i = taskListNode.nextIndex;
        continue;
      }

      const node = this.tokenToNode(token);
      if (node) {
        nodes.push(node);
      }
      i++;
    }

    return nodes;
  }

  /**
   * 解析任务列表容器（组合连续的任务列表项）
   */
  private parseTaskListContainer(tokens: Token[], startIndex: number): ASTNode & { nextIndex: number } {
    const items: ASTNode[] = [];
    let i = startIndex;

    while (i < tokens.length && tokens[i].type === 'task_list') {
      const token = tokens[i];
      const currentIndex = this.checkboxIndex;

      // 记录复选框位置
      this.checkboxMap.set(currentIndex, {
        line: token.start,
        checked: token.checked || false,
      });
      this.checkboxIndex++;

      const inlineTokens = this.tokenizeInline(token.content);

      items.push({
        type: 'task_list_item',
        level: token.level,
        checked: token.checked,
        checkboxIndex: currentIndex,
        content: token.content,
        children: inlineTokens.map(t => this.inlineTokenToNode(t)),
      });

      i++;
    }

    return {
      type: 'task_list_container',
      children: items,
      nextIndex: i,
    };
  }

  /**
   * 将 Token 转换为 AST 节点
   */
  private tokenToNode(token: Token): ASTNode | null {
    switch (token.type) {
      case 'heading':
        return this.parseHeading(token);
      case 'paragraph':
        return this.parseParagraph(token);
      case 'list':
        return this.parseList(token);
      case 'code_block':
        return this.parseCodeBlock(token);
      case 'blockquote':
        return this.parseBlockquote(token);
      case 'horizontal_rule':
        return this.parseHorizontalRule(token);
      default:
        return null;
    }
  }

  /**
   * 解析标题
   */
  private parseHeading(token: Token): ASTNode {
    const inlineTokens = this.tokenizeInline(token.content);
    return {
      type: 'heading',
      level: token.level,
      content: token.content,
      children: inlineTokens.map(t => this.inlineTokenToNode(t)),
    };
  }

  /**
   * 解析段落
   */
  private parseParagraph(token: Token): ASTNode {
    const inlineTokens = this.tokenizeInline(token.content);
    return {
      type: 'paragraph',
      content: token.content,
      children: inlineTokens.map(t => this.inlineTokenToNode(t)),
    };
  }

  /**
   * 解析列表（有序或无序）
   */
  private parseList(token: Token): ASTNode {
    const children: ASTNode[] = [];

    if (token.children) {
      for (const childToken of token.children) {
        const inlineTokens = this.tokenizeInline(childToken.content);
        children.push({
          type: 'list',
          level: childToken.level,
          content: childToken.content,
          children: inlineTokens.map(t => this.inlineTokenToNode(t)),
        });
      }
    }

    return {
      type: 'list',
      level: 0,
      attributes: token.attributes,
      children,
    };
  }

  /**
   * 解析代码块
   */
  private parseCodeBlock(token: Token): ASTNode {
    return {
      type: 'code_block',
      attributes: token.attributes,
      content: token.content,
      children: [],
    };
  }

  /**
   * 解析引用块
   */
  private parseBlockquote(token: Token): ASTNode {
    const inlineTokens = this.tokenizeInline(token.content);
    return {
      type: 'blockquote',
      content: token.content,
      children: inlineTokens.map(t => this.inlineTokenToNode(t)),
    };
  }

  /**
   * 解析水平线
   */
  private parseHorizontalRule(_token: Token): ASTNode {
    return {
      type: 'horizontal_rule',
      content: '',
      children: [],
    };
  }

  /**
   * 词法分析行内内容
   */
  private tokenizeInline(content: string): Token[] {
    const tokens: Token[] = [];
    let pos = 0;

    while (pos < content.length) {
      // 跳过普通文本
      if (!this.isInlineCodeStart(content, pos) &&
          !this.isLinkStart(content, pos) &&
          !this.isImageStart(content, pos)) {
        let textEnd = pos;
        while (textEnd < content.length &&
               !this.isInlineCodeStart(content, textEnd) &&
               !this.isLinkStart(content, textEnd) &&
               !this.isImageStart(content, textEnd)) {
          textEnd++;
        }
        if (textEnd > pos) {
          tokens.push({
            type: 'text',
            content: content.slice(pos, textEnd),
            start: pos,
            end: textEnd,
          });
        }
        pos = textEnd;
        continue;
      }

      // 行内代码
      if (this.isInlineCodeStart(content, pos)) {
        const codeResult = this.tokenizeInlineCode(content, pos);
        tokens.push(codeResult.token);
        pos = codeResult.nextPos;
        continue;
      }

      // 链接
      if (this.isLinkStart(content, pos)) {
        const linkResult = this.tokenizeLink(content, pos);
        tokens.push(linkResult.token);
        pos = linkResult.nextPos;
        continue;
      }

      // 图片
      if (this.isImageStart(content, pos)) {
        const imageResult = this.tokenizeImage(content, pos);
        tokens.push(imageResult.token);
        pos = imageResult.nextPos;
        continue;
      }
    }

    return tokens;
  }

  /**
   * 将行内 Token 转换为 AST 节点
   */
  private inlineTokenToNode(token: Token): ASTNode {
    switch (token.type) {
      case 'text':
        return {
          type: 'text',
          content: token.content,
          children: [],
        };
      case 'inline_code':
        return {
          type: 'inline_code',
          content: token.content,
          children: [],
        };
      case 'link':
        return {
          type: 'link',
          content: token.content,
          attributes: token.attributes,
          children: [],
        };
      case 'image':
        return {
          type: 'image',
          content: token.content,
          attributes: token.attributes,
          children: [],
        };
      default:
        return {
          type: 'text',
          content: token.content || '',
          children: [],
        };
    }
  }

  /**
   * 检查是否是行内代码开始
   */
  private isInlineCodeStart(content: string, pos: number): boolean {
    return content[pos] === '`' && (pos === 0 || content[pos - 1] !== '\\');
  }

  /**
   * 解析行内代码
   */
  private tokenizeInlineCode(content: string, pos: number): { token: Token; nextPos: number } {
    const start = pos;
    pos++; // 跳过开头的 `
    let codeContent = '';

    while (pos < content.length && content[pos] !== '`') {
      if (content[pos] === '\\' && pos + 1 < content.length) {
        pos++; // 跳过转义字符
      }
      codeContent += content[pos];
      pos++;
    }

    return {
      token: {
        type: 'inline_code',
        content: codeContent,
        start,
        end: pos,
      },
      nextPos: pos + 1, // 跳过结尾的 `
    };
  }

  /**
   * 检查是否是链接开始
   */
  private isLinkStart(content: string, pos: number): boolean {
    return content[pos] === '[' && (pos === 0 || content[pos - 1] !== '\\');
  }

  /**
   * 解析链接
   */
  private tokenizeLink(content: string, pos: number): { token: Token; nextPos: number } {
    const start = pos;
    pos++; // 跳过 [

    // 获取文本
    let linkText = '';
    while (pos < content.length && content[pos] !== ']') {
      if (content[pos] === '\\' && pos + 1 < content.length) {
        pos++;
      }
      linkText += content[pos];
      pos++;
    }

    pos++; // 跳过 ]
    pos++; // 跳过 (

    // 获取 URL
    let url = '';
    while (pos < content.length && content[pos] !== ')') {
      url += content[pos];
      pos++;
    }

    return {
      token: {
        type: 'link',
        content: linkText,
        attributes: { url },
        start,
        end: pos,
      },
      nextPos: pos + 1, // 跳过 )
    };
  }

  /**
   * 检查是否是图片开始
   */
  private isImageStart(content: string, pos: number): boolean {
    return content[pos] === '!' &&
           pos + 1 < content.length &&
           content[pos + 1] === '[' &&
           (pos === 0 || content[pos - 1] !== '\\');
  }

  /**
   * 解析图片
   */
  private tokenizeImage(content: string, pos: number): { token: Token; nextPos: number } {
    const start = pos;
    pos += 2; // 跳过 ! [

    // 获取 Alt 文本
    let altText = '';
    while (pos < content.length && content[pos] !== ']') {
      if (content[pos] === '\\' && pos + 1 < content.length) {
        pos++;
      }
      altText += content[pos];
      pos++;
    }

    pos++; // 跳过 ]
    pos++; // 跳过 (

    // 获取 URL
    let url = '';
    while (pos < content.length && content[pos] !== ')') {
      url += content[pos];
      pos++;
    }

    return {
      token: {
        type: 'image',
        content: altText,
        attributes: { url },
        start,
        end: pos,
      },
      nextPos: pos + 1, // 跳过 )
    };
  }

  /**
   * 获取复选框映射表
   */
  getCheckboxMap(): Map<number, { line: number; checked: boolean }> {
    return this.checkboxMap;
  }
}