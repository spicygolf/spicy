import { useCoState } from "jazz-tools/react-core";
import { PlayerAccount } from "spicylib/schema";
import { useJazzWorker } from "./useJazzWorker";

export function useGetCountriesAndStates() {
  const { id } = useJazzWorker();

  const workerAccount = useCoState(PlayerAccount, id, {
    resolve: {
      profile: {
        countries: true,
      },
    },
  });

  return { countries: workerAccount?.profile?.countries ?? [] };
}
