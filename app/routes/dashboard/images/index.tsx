import { createRoute } from "honox/factory";
import ImageList from "../../../islands/dashboard/imageList";

export default createRoute((c) => {
  return c.render(
    <>
      <ImageList />
    </>
  );
});
