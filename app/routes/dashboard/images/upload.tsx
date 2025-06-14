import { createRoute } from "honox/factory";
import ImageUploader from "../../../islands/dashboard/imageUploader";

export default createRoute((c) => {
  return c.render(
    <>
      <ImageUploader />
    </>
  );
});
