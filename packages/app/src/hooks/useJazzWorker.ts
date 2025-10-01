import { useCoState } from "jazz-tools/react-native";
import { PlayerAccount } from "spicylib/schema";

// TODO: get from api or better yet Jazz somewhere, maybe in user's account profile
const JAZZ_WORKER_ACCOUNT = "co_zEGutjQVsanzKS2wawLZcZkZPDL";

export function useJazzWorker(resolve?: object) {
  const account = useCoState(PlayerAccount, JAZZ_WORKER_ACCOUNT, {
    resolve: resolve || {
      profile: true,
    },
  });

  return {
    id: JAZZ_WORKER_ACCOUNT,
    account,
  };
}
