import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useApi } from "./useApi";

interface State {
  name: string;
  code: string;
  course_code: string;
}

interface Country {
  name: string;
  code: string;
  crs_code: string;
  states: State[];
}

async function fetchCountries(apiUrl: string): Promise<Country[]> {
  const response = await axios.get(`${apiUrl}/ghin/countries`);
  return response.data || [];
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function useGetCountriesAndStates() {
  const api = useApi();

  const { data: countries } = useQuery({
    queryKey: ["ghin-countries"],
    queryFn: () => fetchCountries(api),
    staleTime: ONE_MONTH_MS,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
    retryDelay: 1000,
    networkMode: "offlineFirst",
  });

  return { countries: countries ?? null };
}
