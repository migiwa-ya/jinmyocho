import { createRoute } from "honox/factory";
import ShrineDetail from "../../islands/shrineDetail";

export default createRoute((c) => {
  const slug = c.req.param("slug");
  if (!slug) {
    return c.notFound();
  }

  return c.render(
    <div>
      <title>神社詳細</title>
      <ShrineDetail slug={slug} />
    </div>
  );
});
