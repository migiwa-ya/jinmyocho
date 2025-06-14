import { Hono } from "hono";
import { getCookie } from "hono/cookie";

const app = new Hono();

app.get("/:action", (c) => {
  const action = c.req.param("action");

  if (action === "getToken") {
    const token = getCookie(c, "gh_token");

    return c.json({ token });
  }

  return c.json({ error: "not found" });
});

export default app;
