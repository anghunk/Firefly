export interface Category {
  id: string;
  name: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  noteCount: number;
}

export interface CreateCategoryRequest {
  name: string;
}

export interface RenameCategoryRequest {
  id: string;
  newName: string;
}

export interface CategoryOrderConfig {
  categoryIds: string[];
}