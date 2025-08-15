import type { co } from "jazz-tools";
import { useEffect, useState } from "react";
import { type ListOfCountries, PlayerAccount } from "spicylib/schema";
import { useJazzWorker } from "./useJazzWorker";

type Countries = co.loaded<typeof ListOfCountries>;

export function useGetCountriesAndStates() {
  const [countries, setCountries] = useState<Countries | null>(null);
  const { id } = useJazzWorker();
  const account = PlayerAccount.load(id);

  useEffect(() => {
    account.then((account) => {
      setCountries(account?.profile?.countries ?? null);
    });
  }, [account]);

  return { countries };
}
