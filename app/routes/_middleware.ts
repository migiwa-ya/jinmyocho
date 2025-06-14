import type { MiddlewareHandler } from "hono";
import { createRoute } from "honox/factory";

export const injectPublicEnv: MiddlewareHandler = async (c, next) => {
  await next();

  if (!c.res.headers.get("Content-Type")?.includes("text/html")) return;

  const html = await c.res.clone().text();

  const envs = {
    GITHUB_CLIENT_ID: c.env.GITHUB_CLIENT_ID,
    GITHUB_REDIRECT_URI: c.env.GITHUB_REDIRECT_URI,
    IMAGE_REPOSITORY_NAME: c.env.IMAGE_REPOSITORY_NAME,
  };

  const scriptTag = `<script>
      window.__ENV__ = ${JSON.stringify(envs)};
    </script>`;

  c.res = new Response(html.replace("<head>", "<head>" + scriptTag), {
    status: c.res.status,
    headers: c.res.headers,
  });
};

export default createRoute(injectPublicEnv);
