import { useCoState } from "jazz-tools/react-native";
import { PlayerAccount } from "spicylib/schema";
import { useJazzCredentials } from "./useJazzCredentials";

export function useJazzWorker(resolve?: object) {
  const { data: credentials } = useJazzCredentials();

  const account = useCoState(PlayerAccount, credentials?.workerAccount || "", {
    resolve: resolve || {
      profile: true,
    },
  });

  return {
    id: credentials?.workerAccount || "",
    account,
  };
}
