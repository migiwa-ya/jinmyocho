import { jsxRenderer } from "hono/jsx-renderer";
import { Link, Script } from "honox/server";
import SearchBox from "../islands/searchBox";

const ogImage = "https://jinmyocho.com/web-app-manifest-192x192.png";
const title = "神名帳 (β版)";

export default jsxRenderer(({ children }, c) => {
  return (
    <html lang="ja">
      <head>
        <title>{title}</title>

        <meta charset="utf-8" />
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
        <meta name="apple-mobile-web-app-title" content={title} />
        <link rel="manifest" href="/site.webmanifest" />

        <meta property="og:title" content={title} />
        <meta property="og:image" content={ogImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={ogImage} />

        <Link href="/app/style.css" rel="stylesheet" />
        <Script src="/app/client.ts" async />

        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossorigin=""
        />
        <script
          src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
          integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
          crossorigin=""
          defer
        ></script>
      </head>
      <body>
        {
          <header class="h-[60px]">
            <SearchBox />
          </header>
        }
        {children}
      </body>
    </html>
  );
});
