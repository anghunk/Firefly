/**
 * Token 类型定义
 */

export type TokenType =
  | 'root'
  | 'inline'
  | 'heading'
  | 'paragraph'
  | 'list'
  | 'task_list'
  | 'task_list_container'
  | 'task_list_item'
  | 'checkbox'
  | 'code_block'
  | 'inline_code'
  | 'blockquote'
  | 'link'
  | 'image'
  | 'text'
  | 'newline'
  | 'horizontal_rule';

/**
 * Token 接口
 */
export interface Token {
  type: TokenType;
  content: string;
  level?: number;        // 标题级别、列表缩进层级等
  checked?: boolean;     // 任务列表复选框状态
  start: number;         // 在原始文本中的起始位置
  end: number;           // 在原始文本中的结束位置
  children?: Token[];    // 子 Token（用于列表项、行内元素等）
  attributes?: Record<string, string>;  // 链接 URL、图片 Alt 文本等
}

/**
 * AST 节点接口
 */
export interface ASTNode {
  type: TokenType;
  children: ASTNode[];
  level?: number;
  checked?: boolean;
  content?: string;
  attributes?: Record<string, string>;
  checkboxIndex?: number; // 任务列表复选框在文档中的全局索引
}

/**
 * Markdown 解析器配置
 */
export interface MarkdownParserConfig {
  enableHtml?: boolean;      // 是否允许 HTML 标签
  enableTaskLists?: boolean;  // 是否启用任务列表
  enableLinks?: boolean;      // 是否自动识别链接
}

/**
 * 插件接口
 */
export interface MarkdownPlugin {
  name: string;
  // Tokenizer 阶段扩展
  tokenize?: (content: string, tokens: Token[]) => Token[];
  // Parser 阶段扩展
  parse?: (tokens: Token[], ast: ASTNode) => ASTNode;
  // Renderer 阶段扩展
  render?: (node: ASTNode, html: string) => string;
  // 自定义渲染器
  customRenderers?: {
    [nodeType: string]: (node: ASTNode) => string;
  };
}