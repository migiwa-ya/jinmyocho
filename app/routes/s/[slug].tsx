import { createRoute } from "honox/factory";
import type { ShrinesRecord } from "../../staticql/staticql-types";
import { loadStaticQL } from "../../staticql/client";
import { parseMarkdown, stripFrontmatter } from "../../utils/parse";
import { buildShrineIssueUrl } from "../../utils/github";
import ShrineDetail from "../../islands/shrineDetail";

export default createRoute(async (c) => {
  const cache = caches.default;
  const cacheKey = new Request(c.req.url);
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }

  const slug = c.req.param("slug");
  if (!slug) {
    return c.notFound();
  }

  let shrine: ShrinesRecord | null;
  try {
    const staticql = await loadStaticQL();
    shrine = await staticql.from<ShrinesRecord>("shrines").find(slug);
  } catch {
    shrine = null;
  }
  if (!shrine) {
    return c.notFound();
  }

  const content = parseMarkdown(stripFrontmatter(shrine.raw));
  const issueUrl = buildShrineIssueUrl(shrine, {
    owner: "migiwa-ya",
    repo: "dataset-shrines",
    assignees: ["reviewer"],
  });
  const ogImageUrl =
    shrine.画像 && shrine.画像.length > 0
      ? shrine.画像[0]
      : "/favicon-96x96.png";

  c.set("title", `${shrine.名称}（${shrine.都道府県 + shrine.区域}） - 神名帳`);
  c.set("og:title", shrine.名称);
  c.set("og:site_name", "神名帳");
  c.set("og:type", "website");
  c.set("og:url", c.req.url);
  c.set("og:description", shrine.住所 ?? shrine.別名 ?? shrine.名称);
  c.set("og:image", ogImageUrl);
  c.set("twitter:card", "summary_large_image");
  c.set("twitter:image", ogImageUrl);

  const response = await c.render(
    <div>
      <ShrineDetail
        slug={slug}
        initialShrine={shrine}
        initialContent={content}
        initialIssueUrl={issueUrl}
      />
    </div>
  );
  c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()));

  return response;
});
