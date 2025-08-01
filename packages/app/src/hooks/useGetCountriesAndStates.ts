import type { CoValue, ID } from "jazz-tools";
import { useCoState } from "jazz-tools/react-core";
import { PlayerAccount } from "spicylib/schema";

export function useGetCountriesAndStates() {
  // TODO: get from server
  const workerAccountId = "co_zEGutjQVsanzKS2wawLZcZkZPDL";

  const workerAccount = useCoState(
    PlayerAccount,
    workerAccountId as unknown as ID<CoValue>,
    {
      resolve: {
        profile: {
          countries: true,
        },
      },
    },
  );

  return { countries: workerAccount?.profile?.countries ?? [] };
}
