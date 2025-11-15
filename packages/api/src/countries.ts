import { GhinClient } from "@spicygolf/ghin";

const { GHIN_BASE_URL, GHIN_USERNAME, GHIN_PASSWORD } = process.env;

export async function getCountries() {
  if (!GHIN_USERNAME || !GHIN_PASSWORD) {
    throw new Error("GHIN_USERNAME or GHIN_PASSWORD not set");
  }

  try {
    const ghin = new GhinClient({
      username: GHIN_USERNAME,
      password: GHIN_PASSWORD,
      apiAccess: true,
      baseUrl: GHIN_BASE_URL,
    });
    const data = await ghin.courses.getCountries();
    if (!data || data.length === 0) {
      throw new Error("Failed to get GHIN countries and states");
    }
    return data;
  } catch (error) {
    console.error("Error fetching countries and states:", error);
    throw error;
  }
}
