export interface Note {
  id: string;
  title: string;
  path: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface NoteContent {
  id: string;
  title: string;
  content: string;
  frontMatter: FrontMatter;
}

export interface FrontMatter {
  title?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNoteRequest {
  categoryId: string;
  title: string;
}

export interface SaveNoteRequest {
  path: string;
  content: string;
}

// ================== Tree Node Types ==================

export type TreeNodeType = 'folder' | 'file';

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  type: TreeNodeType;
  depth: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  isEmpty?: boolean;
}

export interface CreateFolderRequest {
  parentPath: string;
  name: string;
}

export interface CreateNoteInFolderRequest {
  parentPath: string;
  title: string;
}