import { createRoute } from "honox/factory";
import { setCookie } from "hono/cookie";

export default createRoute((c) => {
  const state = crypto.randomUUID();
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
  });

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", c.env.GITHUB_CLIENT_ID);
  url.searchParams.set("scope", "public_repo");
  url.searchParams.set("redirect_uri", c.env.GITHUB_REDIRECT_URI);
  url.searchParams.set("state", state);

  return c.redirect(url.toString());
});
