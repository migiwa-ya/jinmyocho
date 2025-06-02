import { marked } from "marked";

export function parseMarkdown(markdown: string): string {
  const renderer = new marked.Renderer();

  renderer.link = ({ href, title, text }) => {
    const titleAttr = title ? ` title="${title}"` : "";

    return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
  };

  marked.setOptions({ renderer });

  return marked.parse(markdown, { async: false });
}

export function stripFrontmatter(markdown: string): string {
  if (markdown.startsWith("---")) {
    const end = markdown.indexOf("---", 3);
    if (end !== -1) {
      return markdown.slice(end + 3).trimStart();
    }
  }
  return markdown;
}
