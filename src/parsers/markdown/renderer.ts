/**
 * Markdown HTML 渲染器
 */

import { ASTNode } from './types';
import { PluginManager } from './plugins';

/**
 * Markdown HTML 渲染器类
 */
export class MarkdownRenderer {
  constructor(private pluginManager: PluginManager) {
    // pluginManager is now a private property
  }

  /**
   * 将 AST 渲染为 HTML 字符串
   */
  render(ast: ASTNode): string {
    return this.renderChildren(ast.children);
  }

  /**
   * 渲染行内内容
   */
  renderInline(ast: ASTNode): string {
    return this.renderChildren(ast.children);
  }

  /**
   * 渲染子节点列表
   */
  private renderChildren(children: ASTNode[]): string {
    return children.map(node => this.renderNode(node)).join('\n');
  }

  /**
   * 渲染单个节点
   */
  private renderNode(node: ASTNode): string {
    // 检查是否有自定义渲染器
    const customRenderer = this.pluginManager.getCustomRenderer(node.type);
    if (customRenderer) {
      return customRenderer(node);
    }

    switch (node.type) {
      case 'heading':
        return this.renderHeading(node);
      case 'paragraph':
        return this.renderParagraph(node);
      case 'list':
        return this.renderList(node);
      case 'task_list_container':
        return this.renderTaskListContainer(node);
      case 'task_list_item':
        return this.renderTaskListItem(node);
      case 'code_block':
        return this.renderCodeBlock(node);
      case 'blockquote':
        return this.renderBlockquote(node);
      case 'horizontal_rule':
        return this.renderHorizontalRule(node);
      case 'link':
        return this.renderLink(node);
      case 'image':
        return this.renderImage(node);
      case 'inline_code':
        return this.renderInlineCode(node);
      case 'text':
        return this.renderText(node);
      default:
        return '';
    }
  }

  /**
   * 渲染标题
   */
  private renderHeading(node: ASTNode): string {
    const level = node.level || 1;
    const className = `md-heading-${level}`;
    const childrenHtml = this.renderChildren(node.children);
    return `<h${level} class="${className}">${childrenHtml}</h${level}>`;
  }

  /**
   * 渲染段落
   */
  private renderParagraph(node: ASTNode): string {
    const childrenHtml = this.renderChildren(node.children);
    return `<p class="md-paragraph">${childrenHtml}</p>`;
  }

  /**
   * 渲染列表（有序或无序）
   */
  private renderList(node: ASTNode): string {
    const listType = node.attributes?.listType || 'unordered';
    const tagName = listType === 'ordered' ? 'ol' : 'ul';
    const className = listType === 'ordered'
      ? 'md-list-ordered'
      : 'md-list-unordered';

    const childrenHtml = node.children.map(child => {
      const content = this.renderChildren(child.children);
      return `<li class="md-list-item">${content}</li>`;
    }).join('\n');

    return `<${tagName} class="${className}">\n${childrenHtml}\n</${tagName}>`;
  }

  /**
   * 渲染任务列表容器
   */
  private renderTaskListContainer(node: ASTNode): string {
    const childrenHtml = node.children.map(child => this.renderTaskListItem(child)).join('\n');
    return `<ul class="md-list-task contains-task-list">\n${childrenHtml}\n</ul>`;
  }

  /**
   * 渲染任务列表项
   */
  private renderTaskListItem(node: ASTNode): string {
    const checked = node.checked || false;
    const checkboxIndex = node.checkboxIndex || 0;
    const checkedAttr = checked ? 'checked' : '';

    const checkboxHtml = `<input type="checkbox" class="md-checkbox task-list-item" data-checkbox-index="${checkboxIndex}" ${checkedAttr}>`;
    const childrenHtml = this.renderChildren(node.children);

    // 同时添加旧类名 task-list-item 保持兼容性
    return `<li class="md-list-item md-task-item task-list-item">
      ${checkboxHtml}
      <span>${childrenHtml}</span>
    </li>`;
  }

  /**
   * 渲染代码块
   */
  private renderCodeBlock(node: ASTNode): string {
    const lang = node.attributes?.lang || '';
    const content = this.escapeHtml(node.content || '');
    return `<pre class="md-code-block"><code class="language-${lang}">${content}</code></pre>`;
  }

  /**
   * 渲染引用块
   */
  private renderBlockquote(node: ASTNode): string {
    const childrenHtml = this.renderChildren(node.children);
    return `<blockquote class="md-blockquote">${childrenHtml}</blockquote>`;
  }

  /**
   * 渲染水平线
   */
  private renderHorizontalRule(_node: ASTNode): string {
    return `<hr class="md-horizontal-rule">`;
  }

  /**
   * 渲染链接
   */
  private renderLink(node: ASTNode): string {
    const url = node.attributes?.url || '#';
    const content = node.content || '';
    return `<a href="${this.escapeHtml(url)}" class="md-link">${this.escapeHtml(content)}</a>`;
  }

  /**
   * 渲染图片
   */
  private renderImage(node: ASTNode): string {
    const url = node.attributes?.url || '';
    const alt = node.content || '';
    return `<img src="${this.escapeHtml(url)}" alt="${this.escapeHtml(alt)}" class="md-image">`;
  }

  /**
   * 渲染行内代码
   */
  private renderInlineCode(node: ASTNode): string {
    const content = this.escapeHtml(node.content || '');
    return `<code class="md-code-inline">${content}</code>`;
  }

  /**
   * 渲染纯文本
   */
  private renderText(node: ASTNode): string {
    return this.escapeHtml(node.content || '');
  }

  /**
   * HTML 转义
   */
  private escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return text.replace(/[&<>"']/g, char => htmlEntities[char]);
  }
}