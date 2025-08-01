import { getCountriesAndStates } from "ghin";

export async function getCountries() {
  console.log("getCountries API call");
  try {
    const data = await getCountriesAndStates();
    if (!data || data.length === 0) {
      throw new Error("Failed to get GHIN countries and states");
    }
    return data;
  } catch (error) {
    console.error("Error fetching countries and states:", error);
    throw error;
  }
}
