import { jsxRenderer } from "hono/jsx-renderer";
import { Link, Script } from "honox/server";
import SearchBox from "../../islands/searchBox";

const defaultTitle = "神名帳";
const defaultOgImage = "https://jinmyocho.com/web-app-manifest-192x192.png";

export default jsxRenderer(({ children }, c) => {
  // Context から動的 OGP/Twitter Card 情報を取得
  const headTitle = c.get("title") || defaultTitle;
  const ogTitle = c.get("og:title") || defaultTitle;
  const ogSiteName = c.get("og:site_name") || defaultTitle;
  const ogType = c.get("og:type") || "website";
  const ogUrl = c.get("og:url") || c.req.url;
  const ogDescription = c.get("og:description") || "";
  const ogImage = c.get("og:image") || defaultOgImage;
  const twitterCard = c.get("twitter:card") || "summary_large_image";
  const twitterImage = c.get("twitter:image") || ogImage;

  return (
    <html lang="ja">
      <head>
        <title>{headTitle}</title>

        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content={headTitle} />
        <link rel="manifest" href="/site.webmanifest" />

        <meta property="og:title" content={ogTitle} />
        <meta property="og:site_name" content={ogSiteName} />
        <meta property="og:type" content={ogType} />
        <meta property="og:url" content={ogUrl} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content={twitterCard} />
        <meta name="twitter:image" content={twitterImage} />

        <Link href="/app/style.css" rel="stylesheet" />
        <Script src="/app/client.ts" async />

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossOrigin=""
          defer
        ></script>
      </head>
      <body>
        <header class="h-[60px]">
          <SearchBox />
        </header>
        {children}
      </body>
    </html>
  );
});