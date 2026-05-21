// Central model registry. The database schema is owned by the migrations
// in `migrations/` and applied with `npm run db:migrate` — models are never
// synced at runtime.
import Url from "./url";
import Log from "./log";

const models = {
  Url,
  Log,
};

export { Url, Log };
export default models;
