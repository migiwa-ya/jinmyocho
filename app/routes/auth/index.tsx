import { createRoute } from "honox/factory";
import { getCookie, setCookie } from "hono/cookie";

export type AccessTokenResponse =
  | { access_token: string; token_type: string; scope: string }
  | { error: string; error_description: string; error_uri?: string };

export default createRoute(async (c) => {
  const code = c.req.query("code");
  const returnedState = c.req.query("state");
  if (!code) return c.notFound();

  const savedState = getCookie(c, "oauth_state");
  if (!savedState || savedState !== returnedState) {
    return c.text("Invalid state", 400);
  }
  setCookie(c, "oauth_state", "", { path: "/", maxAge: 0 });

  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new URLSearchParams({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code,
        state: savedState,
      }),
    });

    const data: AccessTokenResponse = await res.json();
    if (!("access_token" in data)) {
      throw new Error("response has error");
    }

    setCookie(c, "gh_token", data.access_token, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    });

    return c.redirect("/dashboard");
  } catch {
    return c.render(<main>error</main>);
  }
});
