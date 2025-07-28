import { t } from "elysia";
import { searchPlayer } from "ghin";

export const PlayerSearchSchema = t.Object({
  q: t.Object({
    country: t.String(),
    state: t.String(),
    first_name: t.String(),
    last_name: t.String(),
    status: t.String(),
  }),
  p: t.Object({
    page: t.Number(),
    per_page: t.Number(),
  }),
});
export type PlayerSearchSchema = typeof PlayerSearchSchema.static;

export function playerSearch(body: PlayerSearchSchema) {
  return searchPlayer(body);
}
