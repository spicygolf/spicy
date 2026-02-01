#!/usr/bin/env bun
/**
 * Generate Maestro flows from E2E fixtures
 *
 * This script reads JSON fixture files and generates Maestro YAML flows.
 * It supports filtering by category and individual fixtures.
 *
 * Usage:
 *   bun generate-flows.ts                         # Generate all fixtures
 *   bun generate-flows.ts --category smoke        # Generate only smoke tests
 *   bun generate-flows.ts --fixture basic_game    # Generate specific fixture
 *   bun generate-flows.ts --dry-run               # Preview without writing
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import {
  type E2EFixture,
  generateFullFlow,
} from "../helpers/fixture-to-maestro";
import { loadFixture } from "../../lib/test-helpers";

const FIXTURES_BASE = join(__dirname, "../../e2e/fixtures");
const FLOWS_BASE = join(__dirname, "../flows");

interface GenerateOptions {
  category?: string;
  fixture?: string;
  dryRun?: boolean;
  verbose?: boolean;
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
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Generate Maestro flows from E2E fixtures

Usage:
  bun generate-flows.ts [options]

Options:
  --category <name>   Generate only fixtures in this category (smoke, core, edge)
  --fixture <name>    Generate only this specific fixture (without .json extension)
  --dry-run           Preview what would be generated without writing files
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

Examples:
  bun generate-flows.ts                         # Generate all
  bun generate-flows.ts --category smoke        # Generate smoke tests only
  bun generate-flows.ts --fixture basic_game    # Generate specific fixture
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

function generateFlow(
  fixturePath: string,
  options: GenerateOptions,
): { success: boolean; outputPath?: string; error?: string } {
  try {
    // Load the fixture
    const fixture = loadFixture(`${fixturePath}.json`) as E2EFixture;

    // Generate the flow
    const { yaml, meta } = generateFullFlow(fixture);

    // Determine output path
    // Input: five_points/smoke/basic_game
    // Output: flows/five_points/smoke/basic_game.yaml
    const outputPath = join(FLOWS_BASE, `${fixturePath}.yaml`);
    const outputDir = dirname(outputPath);

    if (options.dryRun) {
      console.log(`Would generate: ${outputPath}`);
      if (options.verbose) {
        console.log(`  Holes: ${meta.holeCount}, Players: ${meta.playerCount}`);
        console.log(`  Has junk: ${meta.hasJunk}, Has multipliers: ${meta.hasMultipliers}`);
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

  console.log("Generating Maestro flows from fixtures...\n");

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
    console.log("  tests/e2e/fixtures/five_points/smoke/basic_game.json");
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
      const result = generateFlow(fixturePath, options);

      if (result.success) {
        totalGenerated++;
      } else {
        totalFailed++;
        console.error(`  FAILED: ${fixturePath}`);
        console.error(`    ${result.error}`);
      }
    }
  }

  console.log(`\n${options.dryRun ? "Would generate" : "Generated"}: ${totalGenerated} flows`);
  if (totalFailed > 0) {
    console.error(`Failed: ${totalFailed} flows`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
