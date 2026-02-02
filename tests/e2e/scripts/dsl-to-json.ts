#!/usr/bin/env bun
/**
 * Convert DSL files to JSON fixtures
 *
 * Usage:
 *   bun dsl-to-json.ts <input.dsl> [output.json]
 *   bun dsl-to-json.ts --all  # Convert all .dsl files in fixtures/
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { dslToFixture } from "../helpers/dsl-parser";

const FIXTURES_BASE = join(__dirname, "../fixtures");

function convertFile(inputPath: string, outputPath?: string): void {
  const dslContent = readFileSync(inputPath, "utf-8");
  const fixture = dslToFixture(dslContent);

  const outPath = outputPath || inputPath.replace(/\.dsl$/, ".json");
  const outDir = dirname(outPath);

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  writeFileSync(outPath, JSON.stringify(fixture, null, 2));
  console.log(`Converted: ${inputPath} -> ${outPath}`);
}

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

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log("  bun dsl-to-json.ts <input.dsl> [output.json]");
    console.log("  bun dsl-to-json.ts --all  # Convert all .dsl files");
    process.exit(1);
  }

  if (args[0] === "--all") {
    const dslFiles = findDslFiles(FIXTURES_BASE);
    if (dslFiles.length === 0) {
      console.log("No .dsl files found in", FIXTURES_BASE);
      return;
    }

    for (const dslFile of dslFiles) {
      try {
        convertFile(dslFile);
      } catch (error) {
        console.error(`Error converting ${dslFile}:`, error);
      }
    }

    console.log(`\nConverted ${dslFiles.length} files`);
  } else {
    const inputPath = args[0];
    const outputPath = args[1];

    if (!existsSync(inputPath)) {
      console.error(`File not found: ${inputPath}`);
      process.exit(1);
    }

    convertFile(inputPath, outputPath);
  }
}

main();
