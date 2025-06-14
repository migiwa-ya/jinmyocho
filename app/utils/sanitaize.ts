/**
 * Very small sanitizer for browser / Edge runtime.
 * - Removes <script>, <style>, <iframe>, <object>, <embed>, <link>, <meta>
 * - Strips "on*" event attributes
 * - Strips href/src starting with javascript:, data:, vbscript:
 */
export function sanitizeHtml(unsafeHtml: string): string {
  // 1. HTML をパース
  const tpl = document.createElement("template");
  tpl.innerHTML = unsafeHtml;

  // 危険タグは全部まとめて削除
  const bannedTags = [
    "script",
    "style",
    "iframe",
    "object",
    "embed",
    "link",
    "meta",
  ];

  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      // 2. 危険タグなら削除
      if (bannedTags.includes(tag)) {
        el.remove();
        return; // 子孫もまとめて消えるので return
      }

      // 3. 危険属性を削除
      for (const attr of Array.from(el.attributes)) {
        const { name, value } = attr;

        // onload, onclick, … など
        if (name.startsWith("on")) {
          el.removeAttribute(name);
          continue;
        }

        // javascript:, data:, vbscript: が始まる URL
        if (
          (name === "href" || name === "src") &&
          /^(javascript:|data:|vbscript:)/i.test(value.trim())
        ) {
          el.removeAttribute(name);
        }
      }
    }

    // 4. 子ノードを再帰
    for (const child of Array.from(node.childNodes)) walk(child);
  };

  walk(tpl.content);
  return tpl.innerHTML;
}
