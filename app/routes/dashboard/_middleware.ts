import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import { createRoute } from "honox/factory";

const authMiddleware = createMiddleware(async (c, next) => {
  const token = getCookie(c, "gh_token");
  if (!token) {
    return c.redirect("/");
  }

  try {
    const res = await fetch("https://api.github.com/user", {
      headers: { Authorization: `token ${token}`, Accept: "application/json" },
    });
    if (!res.ok) {
      setCookie(c, "gh_token", "", { path: "/", maxAge: 0 });
      return c.redirect("/");
    }
  } catch {
    setCookie(c, "gh_token", "", { path: "/", maxAge: 0 });
    return c.redirect("/");
  }

  await next();
});

export default createRoute(authMiddleware);
