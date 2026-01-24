import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { GameSpecV03 } from "spicylib/transform/legacy-types";

// Use api-0.3 package as the source of truth for gamespec JSON files
const GAMESPEC_DATA_PATH = join(process.cwd(), "../api-0.3/data/gamespecs");

export async function loadGameSpecFromFile(
  filepath: string,
): Promise<GameSpecV03> {
  try {
    const content = await readFile(filepath, "utf-8");
    const data = JSON.parse(content);
    return data as GameSpecV03;
  } catch (error) {
    console.error(`Error loading game spec file ${filepath}:`, error);
    throw error;
  }
}

export async function loadAllGameSpecs(): Promise<GameSpecV03[]> {
  try {
    const files = await readdir(GAMESPEC_DATA_PATH);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const results = await Promise.allSettled(
      jsonFiles.map((filename) =>
        loadGameSpecFromFile(join(GAMESPEC_DATA_PATH, filename)),
      ),
    );

    const specs: GameSpecV03[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result && result.status === "fulfilled") {
        specs.push(result.value);
      } else if (result && result.status === "rejected") {
        console.warn(
          `Skipping invalid game spec file ${jsonFiles[i]}:`,
          result.reason,
        );
      }
    }

    console.log(`Loaded ${specs.length} game specs from JSON files`);
    return specs;
  } catch (error) {
    console.error("Error reading gamespec directory:", error);
    return [];
  }
}
