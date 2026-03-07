import matter from 'gray-matter';

export interface ParsedFrontMatter {
  title?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export function parseFrontMatter(content: string): { frontMatter: ParsedFrontMatter; body: string } {
  try {
    const { data, content: body } = matter(content);

    return {
      frontMatter: {
        title: data.title,
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: data.created_at || data.createdAt,
        updatedAt: data.updated_at || data.updatedAt,
      },
      body,
    };
  } catch {
    return {
      frontMatter: {
        tags: [],
      },
      body: content,
    };
  }
}

export function stringifyFrontMatter(frontMatter: ParsedFrontMatter, body: string): string {
  const data: Record<string, unknown> = {};

  if (frontMatter.title) data.title = frontMatter.title;
  if (frontMatter.tags.length > 0) data.tags = frontMatter.tags;
  if (frontMatter.createdAt) data.created_at = frontMatter.createdAt;
  if (frontMatter.updatedAt) data.updated_at = frontMatter.updatedAt;

  return matter.stringify(body, data);
}

export function updateFrontMatterTags(content: string, tags: string[]): string {
  const { frontMatter, body } = parseFrontMatter(content);
  frontMatter.tags = tags;
  return stringifyFrontMatter(frontMatter, body);
}