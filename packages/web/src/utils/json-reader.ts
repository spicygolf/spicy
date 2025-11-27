import type { GameSpecV03 } from "./arango";

const GAMESPEC_DATA_PATH = "/data/gamespecs";

export async function loadGameSpecFromFile(
  filename: string,
): Promise<GameSpecV03> {
  try {
    const response = await fetch(`${GAMESPEC_DATA_PATH}/${filename}`);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    const data = await response.json();
    return data as GameSpecV03;
  } catch (error) {
    console.error(`Error loading game spec file ${filename}:`, error);
    throw error;
  }
}

export const AVAILABLE_GAMESPECS = [
  "5points-1.json",
  "10points.json",
  "9points.json",
  "birdie-em-all.json",
  "dots.json",
  "individual_matchplay.json",
  "nassau.json",
  "team_matchplay.json",
  "vegas-1.json",
  "wolf.json",
] as const;

export async function loadAllGameSpecs(): Promise<GameSpecV03[]> {
  const results = await Promise.allSettled(
    AVAILABLE_GAMESPECS.map((filename) => loadGameSpecFromFile(filename)),
  );

  const specs: GameSpecV03[] = [];
  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result && result.status === "fulfilled") {
      specs.push(result.value);
    } else if (result && result.status === "rejected") {
      console.warn(
        `Skipping invalid game spec file ${AVAILABLE_GAMESPECS[i]}:`,
        result.reason,
      );
    }
  }

  return specs;
}
