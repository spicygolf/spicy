import { useJazzWorker } from "./useJazzWorker";

export async function useGetCountriesAndStates() {
  const { account } = await useJazzWorker({
    resolve: {
      profile: {
        countries: true,
      },
    },
  });

  return { countries: account?.profile?.countries ?? [] };
}
