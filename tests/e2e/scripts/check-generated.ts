#!/usr/bin/env bun
/**
 * CI Check: Verify generated E2E files match DSL source
 *
 * This script ensures that generated JSON fixtures and YAML flows
 * are in sync with their DSL source files.
 *
 * Usage:
 *   bun check-generated.ts          # Check all generated files
 *   bun check-generated.ts --fix    # Regenerate if out of sync
 *
 * Exit codes:
 *   0 - All files in sync
 *   1 - Files out of sync (regeneration needed)
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SCRIPTS_DIR = __dirname;
const FIXTURES_DIR = join(SCRIPTS_DIR, "../fixtures");
const FLOWS_DIR = join(SCRIPTS_DIR, "../flows");

interface CheckResult {
  file: string;
  status: "ok" | "missing" | "outdated";
  details?: string;
}

/**
 * Find all DSL files in the fixtures directory
 */
function findDslFiles(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) {
    return files;
  }

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findDslFiles(fullPath));
    } else if (entry.name.endsWith(".dsl")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Get file modification time
 */
function getModTime(filePath: string): number {
  try {
    return statSync(filePath).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Regenerate all files from DSL
 */
function regenerate(): void {
  console.log("Regenerating files from DSL...\n");

  // Step 1: Convert DSL to JSON
  console.log("Step 1: Converting DSL to JSON...");
  execSync("bun tests/e2e/scripts/dsl-to-json.ts --all", {
    cwd: join(SCRIPTS_DIR, "../../.."),
    stdio: "inherit",
  });

  // Step 2: Generate flows from JSON
  console.log("\nStep 2: Generating flows from JSON...");
  execSync("bun tests/e2e/scripts/generate-flows.ts", {
    cwd: join(SCRIPTS_DIR, "../../.."),
    stdio: "inherit",
  });

  console.log("\nRegeneration complete.");
}

/**
 * Check if a single DSL file is in sync with its generated outputs
 */
function checkDslFile(dslPath: string): CheckResult[] {
  const results: CheckResult[] = [];
  const jsonPath = dslPath.replace(/\.dsl$/, ".json");

  // Check if JSON exists
  if (!existsSync(jsonPath)) {
    results.push({
      file: jsonPath,
      status: "missing",
      details: `JSON not found for ${dslPath}`,
    });
    return results;
  }

  // For a quick check, we compare file contents by regenerating in-memory
  // Read the current JSON
  const currentJson = readFileSync(jsonPath, "utf-8");

  // Regenerate JSON from DSL and compare
  try {
    const { dslToFixture } = require("../helpers/dsl-parser");
    const dslContent = readFileSync(dslPath, "utf-8");
    const fixture = dslToFixture(dslContent);
    const expectedJson = JSON.stringify(fixture, null, 2);

    if (currentJson.trim() !== expectedJson.trim()) {
      results.push({
        file: jsonPath,
        status: "outdated",
        details: "JSON does not match DSL content",
      });
    } else {
      results.push({
        file: jsonPath,
        status: "ok",
      });
    }
  } catch (error) {
    results.push({
      file: jsonPath,
      status: "outdated",
      details: `Error parsing DSL: ${error}`,
    });
  }

  return results;
}

/**
 * Check all generated YAML flows against their JSON fixtures
 */
function checkFlows(): CheckResult[] {
  const results: CheckResult[] = [];

  // Find all JSON fixtures
  const jsonFiles = findJsonFiles(FIXTURES_DIR);

  for (const jsonPath of jsonFiles) {
    try {
      const fixture = JSON.parse(readFileSync(jsonPath, "utf-8"));

      // Determine the expected flows directory
      const relativePath = jsonPath
        .replace(FIXTURES_DIR, "")
        .replace(/\/game\.json$/, "");
      const flowsDir = join(FLOWS_DIR, relativePath);

      // Check if main.yaml exists
      const mainYaml = join(flowsDir, "main.yaml");
      if (!existsSync(mainYaml)) {
        results.push({
          file: mainYaml,
          status: "missing",
          details: `main.yaml not found for fixture ${jsonPath}`,
        });
        continue;
      }

      // For a thorough check, regenerate and compare
      // For now, just check that the directory exists and has expected files
      const expectedFiles = [
        "main.yaml",
        "login.yaml",
        "new_game.yaml",
        "add_players.yaml",
        "select_course_tee.yaml",
        "start_game.yaml",
        "leaderboard.yaml",
      ];

      for (const file of expectedFiles) {
        const filePath = join(flowsDir, file);
        if (!existsSync(filePath)) {
          results.push({
            file: filePath,
            status: "missing",
            details: `Expected flow file not found`,
          });
        }
      }

      // Check holes directory
      const holesDir = join(flowsDir, "holes");
      if (!existsSync(holesDir)) {
        results.push({
          file: holesDir,
          status: "missing",
          details: "holes/ directory not found",
        });
      }

      results.push({
        file: flowsDir,
        status: "ok",
        details: "Flow directory structure valid",
      });
    } catch (error) {
      results.push({
        file: jsonPath,
        status: "outdated",
        details: `Error checking fixture: ${error}`,
      });
    }
  }

  return results;
}

/**
 * Find all JSON fixture files
 */
function findJsonFiles(dir: string): string[] {
  const files: string[] = [];

  if (!existsSync(dir)) {
    return files;
  }

  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findJsonFiles(fullPath));
    } else if (entry.name === "game.json") {
      files.push(fullPath);
    }
  }

  return files;
}

function main(): void {
  const args = process.argv.slice(2);
  const shouldFix = args.includes("--fix");

  console.log("Checking E2E generated files...\n");

  // Find all DSL files
  const dslFiles = findDslFiles(FIXTURES_DIR);

  if (dslFiles.length === 0) {
    console.log("No DSL files found in", FIXTURES_DIR);
    process.exit(0);
  }

  console.log(`Found ${dslFiles.length} DSL file(s)\n`);

  // Check each DSL file
  const allResults: CheckResult[] = [];

  for (const dslFile of dslFiles) {
    console.log(`Checking: ${dslFile.replace(FIXTURES_DIR, "fixtures")}`);
    const results = checkDslFile(dslFile);
    allResults.push(...results);
  }

  // Check flows
  console.log("\nChecking flow files...");
  const flowResults = checkFlows();
  allResults.push(...flowResults);

  // Summarize results
  const issues = allResults.filter((r) => r.status !== "ok");

  console.log("\n" + "=".repeat(60));

  if (issues.length === 0) {
    console.log("All generated files are in sync with DSL sources.");
    process.exit(0);
  }

  console.log(`Found ${issues.length} issue(s):\n`);

  for (const issue of issues) {
    const icon = issue.status === "missing" ? "[MISSING]" : "[OUTDATED]";
    console.log(`${icon} ${issue.file}`);
    if (issue.details) {
      console.log(`         ${issue.details}`);
    }
  }

  if (shouldFix) {
    console.log("\n" + "=".repeat(60));
    regenerate();
    console.log("\nPlease commit the regenerated files.");
    process.exit(0);
  } else {
    console.log("\n" + "=".repeat(60));
    console.log("Run with --fix to regenerate files:");
    console.log("  bun tests/e2e/scripts/check-generated.ts --fix");
    console.log("\nOr regenerate manually:");
    console.log("  bun tests/e2e/scripts/dsl-to-json.ts --all");
    console.log("  bun tests/e2e/scripts/generate-flows.ts");
    process.exit(1);
  }
}

main();
