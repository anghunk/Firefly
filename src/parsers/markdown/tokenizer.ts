/**
 * Markdown 词法分析器
 */

import { Token, MarkdownParserConfig } from './types';
import {
  TASK_LIST_REGEX,
  HEADING_REGEX,
  BLOCKQUOTE_REGEX,
  ORDERED_LIST_REGEX,
  UNORDERED_LIST_REGEX,
  EMPTY_LINE_REGEX,
  HORIZONTAL_RULE_REGEX,
} from './constants';

/**
 * Markdown 词法分析器类
 */
export class MarkdownTokenizer {
  private config: MarkdownParserConfig;

  constructor(config: MarkdownParserConfig = {}) {
    this.config = {
      enableHtml: true,
      enableTaskLists: true,
      enableLinks: true,
      ...config,
    };
  }

  /**
   * 将 Markdown 文本分解为 Token 流
   */
  tokenize(content: string): Token[] {
    const tokens: Token[] = [];
    const lines = content.split('\n');
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const lineStart = i;

      // 跳过空行
      if (EMPTY_LINE_REGEX.test(line)) {
        i++;
        continue;
      }

      // 水平线：---、***、___
      if (HORIZONTAL_RULE_REGEX.test(line)) {
        tokens.push({
          type: 'horizontal_rule',
          content: '',
          start: lineStart,
          end: lineStart,
        });
        i++;
        continue;
      }

      // 代码块（多行）
      if (this.isCodeBlockStart(line)) {
        const blockResult = this.tokenizeCodeBlock(lines, i);
        tokens.push(blockResult.token);
        i = blockResult.nextIndex;
        continue;
      }

      // 任务列表
      if (this.config.enableTaskLists && TASK_LIST_REGEX.test(line)) {
        const match = line.match(TASK_LIST_REGEX)!;
        tokens.push({
          type: 'task_list',
          content: match[4].trim(),
          level: match[1].length / 2, // 缩进层级
          checked: match[3].trim() === 'x',
          start: lineStart,
          end: lineStart,
        });
        i++;
        continue;
      }

      // 标题
      if (HEADING_REGEX.test(line)) {
        const match = line.match(HEADING_REGEX)!;
        tokens.push({
          type: 'heading',
          content: match[2].trim(),
          level: match[1].length,
          start: lineStart,
          end: lineStart,
        });
        i++;
        continue;
      }

      // 引用块
      if (BLOCKQUOTE_REGEX.test(line)) {
        const blockResult = this.tokenizeBlockquote(lines, i);
        tokens.push(blockResult.token);
        i = blockResult.nextIndex;
        continue;
      }

      // 有序列表
      if (ORDERED_LIST_REGEX.test(line)) {
        const listResult = this.tokenizeList(lines, i, 'ordered');
        tokens.push(listResult.token);
        i = listResult.nextIndex;
        continue;
      }

      // 无序列表
      if (UNORDERED_LIST_REGEX.test(line)) {
        const listResult = this.tokenizeList(lines, i, 'unordered');
        tokens.push(listResult.token);
        i = listResult.nextIndex;
        continue;
      }

      // 普通段落
      const paragraphResult = this.tokenizeParagraph(lines, i);
      tokens.push(paragraphResult.token);
      i = paragraphResult.nextIndex;
    }

    return tokens;
  }

  /**
   * 词法分析行内内容（用于段落内的文本）
   */
  tokenizeInline(content: string): Token[] {
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
        tokens.push({
          type: 'text',
          content: content.slice(pos, textEnd),
          start: pos,
          end: textEnd,
        });
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
   * 检查是否是代码块开始
   */
  private isCodeBlockStart(line: string): boolean {
    return line.trim().startsWith('```');
  }

  /**
   * 解析代码块
   */
  private tokenizeCodeBlock(lines: string[], startIndex: number): { token: Token; nextIndex: number } {
    const firstLine = lines[startIndex];
    const lang = firstLine.trim().slice(3).trim();
    const content: string[] = [];
    let i = startIndex + 1;

    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      content.push(lines[i]);
      i++;
    }

    return {
      token: {
        type: 'code_block',
        content: content.join('\n'),
        attributes: { lang },
        start: startIndex,
        end: i,
      },
      nextIndex: i + 1,
    };
  }

  /**
   * 解析引用块
   */
  private tokenizeBlockquote(lines: string[], startIndex: number): { token: Token; nextIndex: number } {
    const content: string[] = [];
    let i = startIndex;

    while (i < lines.length && BLOCKQUOTE_REGEX.test(lines[i])) {
      const match = lines[i].match(BLOCKQUOTE_REGEX)!;
      content.push(match[1].trim());
      i++;
    }

    return {
      token: {
        type: 'blockquote',
        content: content.join('\n'),
        start: startIndex,
        end: i - 1,
      },
      nextIndex: i,
    };
  }

  /**
   * 解析列表（有序或无序）
   */
  private tokenizeList(
    lines: string[],
    startIndex: number,
    listType: 'ordered' | 'unordered'
  ): { token: Token; nextIndex: number } {
    const items: Token[] = [];
    let i = startIndex;
    const regex = listType === 'ordered' ? ORDERED_LIST_REGEX : UNORDERED_LIST_REGEX;

    while (i < lines.length) {
      const match = lines[i].match(regex);
      if (!match) break;

      items.push({
        type: 'list',
        content: match[3].trim(),
        level: match[1].length / 2,
        start: i,
        end: i,
      });
      i++;
    }

    return {
      token: {
        type: 'list',
        content: '',
        level: 0,
        children: items,
        attributes: { listType },
        start: startIndex,
        end: i - 1,
      },
      nextIndex: i,
    };
  }

  /**
   * 解析段落
   */
  private tokenizeParagraph(lines: string[], startIndex: number): { token: Token; nextIndex: number } {
    const content: string[] = [];
    let i = startIndex;

    while (i < lines.length && !EMPTY_LINE_REGEX.test(lines[i])) {
      // 检查是否遇到块级元素
      if (this.isCodeBlockStart(lines[i]) ||
          HEADING_REGEX.test(lines[i]) ||
          BLOCKQUOTE_REGEX.test(lines[i]) ||
          (this.config.enableTaskLists && TASK_LIST_REGEX.test(lines[i])) ||
          ORDERED_LIST_REGEX.test(lines[i]) ||
          UNORDERED_LIST_REGEX.test(lines[i])) {
        break;
      }
      content.push(lines[i]);
      i++;
    }

    return {
      token: {
        type: 'paragraph',
        content: content.join('\n'),
        start: startIndex,
        end: i - 1,
      },
      nextIndex: i,
    };
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
}