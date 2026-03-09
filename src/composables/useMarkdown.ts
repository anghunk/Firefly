import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
}).use(taskLists, {
  enabled: true,
  label: true,
  labelAfter: false,
});

export function useMarkdown() {
  function render(content: string): string {
    return md.render(content);
  }

  function renderInline(content: string): string {
    return md.renderInline(content);
  }

  return {
    render,
    renderInline,
  };
}