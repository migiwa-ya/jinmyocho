import { jsxRenderer } from "hono/jsx-renderer";
import { Link, Script } from "honox/server";
import SearchBox from "../islands/searchBox";

export default jsxRenderer(({ children }, c) => {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
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
