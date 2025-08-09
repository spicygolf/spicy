import { GhinClient, type GolfersSearchRequest } from "ghin";

const { GHIN_BASE_URL, GHIN_USERNAME, GHIN_PASSWORD } = process.env;

export function playerSearch(body: GolfersSearchRequest) {
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
    first_name: body.first_name,
    last_name: body.last_name,
    state: body.state,
    country: body.country,
    status: body.status,
    page: body.page,
    per_page: body.per_page,
    sorting_criteria: body.sorting_criteria || "last_name_first_name",
    order: body.order || "asc",
  });
}
