import { PlayerAccount } from "spicylib/schema";

// TODO: get from api or better yet Jazz somewhere, maybe in user's account profile
const JAZZ_WORKER_ACCOUNT = "co_zEGutjQVsanzKS2wawLZcZkZPDL";

/**
 * Load Jazz worker account with optional resolve query
 * @param resolve - Jazz resolve query object with structure:
 *   { resolve: { root?: { player?: true, games?: { $each: true }, specs?: { $each: true } }, profile?: { countries?: { $each: true } } } }
 */
export async function useJazzWorker(
  resolve?: Parameters<typeof PlayerAccount.load>[1],
) {
  const account = await PlayerAccount.load(JAZZ_WORKER_ACCOUNT, resolve);
  return {
    id: JAZZ_WORKER_ACCOUNT,
    account,
  };
}
