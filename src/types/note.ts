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