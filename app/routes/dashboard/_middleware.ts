import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { createRoute } from "honox/factory";

const authMiddleware = createMiddleware(async (c, next) => {
  if (!getCookie(c, "gh_token")) {
    return c.redirect("/");
  }

  await next();
});

export default createRoute(authMiddleware);
