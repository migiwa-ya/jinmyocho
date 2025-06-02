import { createRoute } from "honox/factory";
import Map from "../../islands/map";
import { decodeGeohash } from "../../utils/geohash";
import { ShrineList } from "../../islands/shrineList";

export default createRoute((c) => {
  const shrineName = c.req.query("sn");

  if (shrineName) {
    return c.render(
      <div>
        <title>神社一覧</title>
        <ShrineList name={shrineName} />
      </div>
    );
  }

  const geohash = c.req.query("g");
  let lat: number | undefined;
  let lng: number | undefined;
  if (geohash) {
    try {
      const [dlat, dlng] = decodeGeohash(geohash);
      lat = dlat;
      lng = dlng;
    } catch {
      c.status(400);
      return c.render("Invalid geohash");
    }
    return c.render(
      <div>
        <title>地図</title>
        <Map lat={lat} lng={lng} />
      </div>
    );
  }

  return c.notFound();
});
