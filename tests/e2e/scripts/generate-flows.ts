#!/usr/bin/env bun
/**
 * Generate Maestro flows from E2E fixtures
 *
 * This script reads JSON fixture files and generates Maestro YAML flows.
 * It supports filtering by category and individual fixtures.
 *
 * Output modes:
 * - --subflows (default): Generate separate YAML files for each phase (login, new_game, holes, etc.)
 * - --single: Generate a single monolithic YAML file (legacy mode)
 *
 * Usage:
 *   bun generate-flows.ts                         # Generate all fixtures with sub-flows
 *   bun generate-flows.ts --single                # Generate single-file flows (legacy)
 *   bun generate-flows.ts --category game_0       # Generate only game_0 tests
 *   bun generate-flows.ts --fixture game          # Generate specific fixture
 *   bun generate-flows.ts --dry-run               # Preview without writing
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import {
  type E2EFixture,
  generateFullFlow,
  generateSubFlows,
} from "../helpers/fixture-to-maestro";

const FIXTURES_BASE = join(__dirname, "../fixtures");
const FLOWS_BASE = join(__dirname, "../flows");

interface GenerateOptions {
  category?: string;
  fixture?: string;
  dryRun?: boolean;
  verbose?: boolean;
  single?: boolean; // Use single-file mode instead of sub-flows
}

function parseArgs(): GenerateOptions {
  const args = process.argv.slice(2);
  const options: GenerateOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--category" && args[i + 1]) {
      options.category = args[++i];
    } else if (arg === "--fixture" && args[i + 1]) {
      options.fixture = args[++i];
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--single") {
      options.single = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Generate Maestro flows from E2E fixtures

Usage:
  bun generate-flows.ts [options]

Options:
  --category <name>   Generate only fixtures in this category (game_0, game_1, etc.)
  --fixture <name>    Generate only this specific fixture (without .json extension)
  --single            Generate single-file flows instead of sub-flows (legacy mode)
  --dry-run           Preview what would be generated without writing files
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

Examples:
  bun generate-flows.ts                         # Generate all with sub-flows
  bun generate-flows.ts --single                # Generate single-file flows
  bun generate-flows.ts --category game_0       # Generate game_0 tests only
  bun generate-flows.ts --fixture game          # Generate specific fixture
`);
      process.exit(0);
    }
  }

  return options;
}

function findFixtures(gameType: string, options: GenerateOptions): string[] {
  const fixturesDir = join(FIXTURES_BASE, gameType);
  if (!existsSync(fixturesDir)) {
    return [];
  }

  const fixtures: string[] = [];

  // Get categories (subdirectories)
  const categories = options.category
    ? [options.category]
    : readdirSync(fixturesDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

  for (const category of categories) {
    const categoryDir = join(fixturesDir, category);
    if (!existsSync(categoryDir)) {
      continue;
    }

    const files = readdirSync(categoryDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const fixtureName = basename(file, ".json");

      // Filter by specific fixture if requested
      if (options.fixture && fixtureName !== options.fixture) {
        continue;
      }

      fixtures.push(`${gameType}/${category}/${fixtureName}`);
    }
  }

  return fixtures;
}

/**
 * Load a fixture from the e2e fixtures directory
 */
function loadE2EFixture(fixturePath: string): E2EFixture {
  const fullPath = join(FIXTURES_BASE, `${fixturePath}.json`);
  if (!existsSync(fullPath)) {
    throw new Error(
      `Fixture not found: ${fixturePath}.json (expected at ${fullPath})`,
    );
  }
  const content = readFileSync(fullPath, "utf-8");
  return JSON.parse(content) as E2EFixture;
}

/**
 * Generate sub-flows for a fixture (new multi-file mode)
 */
function generateSubFlowFiles(
  fixturePath: string,
  options: GenerateOptions,
): {
  success: boolean;
  outputPath?: string;
  error?: string;
  fileCount?: number;
} {
  try {
    const fixture = loadE2EFixture(fixturePath);
    const flows = generateSubFlows(fixture);

    // Determine output directory
    // Input: five_points/game_0/game
    // Output: flows/five_points/game_0/
    const outputDir = join(FLOWS_BASE, dirname(fixturePath));
    const holesDir = join(outputDir, "holes");

    if (options.dryRun) {
      console.log(`Would generate sub-flows in: ${outputDir}`);
      if (options.verbose) {
        console.log(`  - game.yaml (main orchestration)`);
        console.log(`  - login.yaml`);
        console.log(`  - cleanup.yaml`);
        console.log(`  - new_game.yaml`);
        console.log(`  - add_players.yaml`);
        console.log(`  - start_game.yaml`);
        console.log(`  - leaderboard.yaml`);
        console.log(`  - holes/ (${Object.keys(flows.holes).length} files)`);
      }
      return {
        success: true,
        outputPath: outputDir,
        fileCount: 7 + Object.keys(flows.holes).length,
      };
    }

    // Create output directories if needed
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    if (!existsSync(holesDir)) {
      mkdirSync(holesDir, { recursive: true });
    }

    // Write main flow
    writeFileSync(join(outputDir, "game.yaml"), flows.main);

    // Write sub-flows
    writeFileSync(join(outputDir, "login.yaml"), flows.login);
    writeFileSync(join(outputDir, "cleanup.yaml"), flows.cleanup);
    writeFileSync(join(outputDir, "new_game.yaml"), flows.newGame);
    writeFileSync(join(outputDir, "add_players.yaml"), flows.addPlayers);
    writeFileSync(join(outputDir, "start_game.yaml"), flows.startGame);
    writeFileSync(join(outputDir, "leaderboard.yaml"), flows.leaderboard);

    // Write hole flows
    for (const [holeNum, yaml] of Object.entries(flows.holes)) {
      writeFileSync(join(holesDir, `hole_${holeNum}.yaml`), yaml);
    }

    const fileCount = 7 + Object.keys(flows.holes).length;

    if (options.verbose) {
      console.log(`Generated ${fileCount} files in: ${outputDir}`);
      console.log(
        `  Holes: ${flows.meta.holeCount}, Players: ${flows.meta.playerCount}`,
      );
      console.log(
        `  Has junk: ${flows.meta.hasJunk}, Has multipliers: ${flows.meta.hasMultipliers}`,
      );
    } else {
      console.log(`Generated ${fileCount} files in: ${outputDir}`);
    }

    return { success: true, outputPath: outputDir, fileCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

/**
 * Generate a single flow file (legacy mode)
 */
function generateSingleFlowFile(
  fixturePath: string,
  options: GenerateOptions,
): { success: boolean; outputPath?: string; error?: string } {
  try {
    // Load the fixture from e2e fixtures directory
    const fixture = loadE2EFixture(fixturePath);

    // Generate the flow
    const { yaml, meta } = generateFullFlow(fixture);

    // Determine output path
    // Input: five_points/game_0/game
    // Output: flows/five_points/game_0/game.yaml
    const outputPath = join(FLOWS_BASE, `${fixturePath}.yaml`);
    const outputDir = dirname(outputPath);

    if (options.dryRun) {
      console.log(`Would generate: ${outputPath}`);
      if (options.verbose) {
        console.log(`  Holes: ${meta.holeCount}, Players: ${meta.playerCount}`);
        console.log(
          `  Has junk: ${meta.hasJunk}, Has multipliers: ${meta.hasMultipliers}`,
        );
      }
      return { success: true, outputPath };
    }

    // Create output directory if needed
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Write the YAML file
    writeFileSync(outputPath, yaml);

    if (options.verbose) {
      console.log(`Generated: ${outputPath}`);
      console.log(`  Holes: ${meta.holeCount}, Players: ${meta.playerCount}`);
    } else {
      console.log(`Generated: ${outputPath}`);
    }

    return { success: true, outputPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

async function main() {
  const options = parseArgs();

  const mode = options.single ? "single-file" : "sub-flows";
  console.log(`Generating Maestro flows from fixtures (${mode} mode)...\n`);

  // Find all game types with fixtures
  const gameTypes = existsSync(FIXTURES_BASE)
    ? readdirSync(FIXTURES_BASE, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];

  if (gameTypes.length === 0) {
    console.log("No fixture directories found.");
    console.log(`Expected fixtures in: ${FIXTURES_BASE}`);
    console.log("\nCreate fixtures like:");
    console.log("  tests/e2e/fixtures/five_points/game_0/game.json");
    process.exit(0);
  }

  let totalGenerated = 0;
  let totalFailed = 0;

  for (const gameType of gameTypes) {
    const fixtures = findFixtures(gameType, options);

    if (fixtures.length === 0) {
      continue;
    }

    console.log(`\n${gameType.toUpperCase()}:`);

    for (const fixturePath of fixtures) {
      const result = options.single
        ? generateSingleFlowFile(fixturePath, options)
        : generateSubFlowFiles(fixturePath, options);

      if (result.success) {
        totalGenerated++;
      } else {
        totalFailed++;
        console.error(`  FAILED: ${fixturePath}`);
        console.error(`    ${result.error}`);
      }
    }
  }

  console.log(
    `\n${options.dryRun ? "Would generate" : "Generated"}: ${totalGenerated} fixture(s)`,
  );
  if (totalFailed > 0) {
    console.error(`Failed: ${totalFailed} fixture(s)`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
