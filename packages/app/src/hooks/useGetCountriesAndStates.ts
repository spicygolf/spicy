import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";

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

async function fetchCountries(): Promise<Country[]> {
  return apiGet<Country[]>("/ghin/countries");
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function useGetCountriesAndStates() {
  const {
    data: countries,
    error,
    isLoading,
  } = useQuery({
    queryKey: ["ghin-countries"],
    queryFn: () => fetchCountries(),
    staleTime: ONE_MONTH_MS,
    gcTime: Number.POSITIVE_INFINITY,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 3,
    retryDelay: 1000,
    networkMode: "offlineFirst",
  });

  return { countries: countries ?? null, error, isLoading };
}
