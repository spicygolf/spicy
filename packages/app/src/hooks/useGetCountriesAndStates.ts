import type { co } from "jazz-tools";
import { useEffect, useState } from "react";
import type { ListOfCountries } from "spicylib/schema";
import { useJazzWorker } from "./useJazzWorker";

type Countries = co.loaded<typeof ListOfCountries>;

export function useGetCountriesAndStates() {
  const [countries, setCountries] = useState<Countries | null>(null);
  const worker = useJazzWorker({
    profile: {
      countries: {
        $each: {
          states: {
            $each: true,
          },
        },
      },
    },
  });

  useEffect(() => {
    if (!worker?.account) {
      return;
    }

    setCountries(worker.account.profile?.countries ?? null);
  }, [worker?.account]);

  return { countries };
}
