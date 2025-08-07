import { t } from "elysia";
import { GhinClient } from "ghin";

const { GHIN_BASE_URL, GHIN_USERNAME, GHIN_PASSWORD } = process.env;

export const PlayerSearchSchema = t.Object({
  q: t.Object({
    country: t.String(),
    state: t.String(),
    first_name: t.String(),
    last_name: t.String(),
    status: t.Enum({
      Active: "Active",
      Inactive: "Inactive",
    }),
  }),
  p: t.Object({
    page: t.Number(),
    per_page: t.Number(),
  }),
});
export type PlayerSearchSchema = typeof PlayerSearchSchema.static;

export function playerSearch(body: PlayerSearchSchema) {
  if (!GHIN_USERNAME || !GHIN_PASSWORD) {
    throw new Error("GHIN_USERNAME or GHIN_PASSWORD not set");
  }

  const ghin = new GhinClient({
    username: GHIN_USERNAME,
    password: GHIN_PASSWORD,
    apiAccess: true,
    baseUrl: GHIN_BASE_URL,
  });

  return ghin.golfers.search({
    first_name: body.q.first_name,
    last_name: body.q.last_name,
    state: body.q.state,
    country: body.q.country,
    status: body.q.status,
    page: body.p.page,
    per_page: body.p.per_page,
    sorting_criteria: "last_name_first_name",
    order: "asc",
  });
}
