import { GhinClient, type Golfer, type GolfersSearchRequest } from "ghin";
import { Player } from "spicylib/schema";
import { getJazzWorker } from "./jazz_worker";

const { GHIN_BASE_URL, GHIN_USERNAME, GHIN_PASSWORD } = process.env;

export interface GolferWithJazzId extends Golfer {
  jazz_id?: string;
}

async function findPlayerByGhinId(ghinId: string): Promise<string | undefined> {
  try {
    const { id } = await getJazzWorker();
    const player = await Player.loadUnique(ghinId, id);
    return player?.$jazz.id || undefined;
  } catch (error) {
    console.error(`Error finding Jazz Player for GHIN ${ghinId}:`, error);
    return undefined;
  }
}

export async function playerSearch(
  body: GolfersSearchRequest,
): Promise<GolferWithJazzId[]> {
  if (!GHIN_USERNAME || !GHIN_PASSWORD) {
    throw new Error("GHIN_USERNAME or GHIN_PASSWORD not set");
  }

  const ghin = new GhinClient({
    username: GHIN_USERNAME,
    password: GHIN_PASSWORD,
    apiAccess: true,
    baseUrl: GHIN_BASE_URL,
  });

  const batch = await ghin.golfers.search({
    page: body.page,
    per_page: body.per_page,
    first_name: body.first_name,
    last_name: body.last_name,
    state: body.state,
    country: body.country,
    status: body.status,
    sorting_criteria: body.sorting_criteria || "last_name_first_name",
    order: body.order || "asc",
  });

  if (!batch || !Array.isArray(batch)) {
    return [];
  }

  // Process each golfer to find matching Jazz Player records
  const golfersWithJazzIds: GolferWithJazzId[] = await Promise.all(
    batch.map(async (golfer: Golfer) => {
      let jazz_id: string | undefined;

      if (golfer.ghin) {
        jazz_id = await findPlayerByGhinId(golfer.ghin.toString());
        console.log("ghin_id", golfer.ghin, "jazz_id", jazz_id);
      }

      return {
        ...golfer,
        jazz_id,
      };
    }),
  );

  return golfersWithJazzIds;
}
