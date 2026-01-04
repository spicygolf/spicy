/**
 * Seed Data Logic Validator
 *
 * Validates all JSON logic expressions in seed data files.
 * Run during build/CI to catch typos and syntax errors early.
 *
 * Usage:
 *   bun run packages/lib/scoring/validate-seed-logic.ts
 *
 * Exit codes:
 *   0 - All expressions valid
 *   1 - Validation errors found
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Known custom operators that are valid in our logic expressions
const KNOWN_OPERATORS = new Set([
  // Standard json-logic operators
  "var",
  "and",
  "or",
  "not",
  "==",
  "===",
  "!=",
  "!==",
  ">",
  ">=",
  "<",
  "<=",
  "+",
  "-",
  "*",
  "/",
  "%",
  "if",
  "?:",
  "!",
  "!!",
  "log",
  "in",
  "cat",
  "substr",
  "merge",
  "missing",
  "missing_some",
  "some",
  "all",
  "none",
  "filter",
  "map",
  "reduce",
  "min",
  "max",

  // Custom operators from logic-engine.ts
  "team",
  "countJunk",
  "rankWithTies",
  "team_down_the_most",
  "team_second_to_last",
  "other_team_multiplied_with",
  "getPrevHole",
  "getCurrHole",
  "playersOnTeam",
  "isWolfPlayer",
  "parOrBetter",
  "holePar",
  "existingPreMultiplierTotal",
]);

interface ValidationError {
  file: string;
  field: string;
  expression: string;
  error: string;
}

interface ValidationResult {
  valid: number;
  errors: ValidationError[];
}

/**
 * Convert single-quoted JSON to double-quoted and parse
 */
function parseLogicExpression(expression: string): unknown {
  // Handle both single-quoted (legacy) and double-quoted JSON
  const jsonStr = expression.replace(/'/g, '"');
  return JSON.parse(jsonStr);
}

/**
 * Recursively find all operators used in a logic expression
 */
function findOperators(obj: unknown): string[] {
  const operators: string[] = [];

  if (obj === null || typeof obj !== "object") {
    return operators;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      operators.push(...findOperators(item));
    }
    return operators;
  }

  // Object with operator keys
  for (const [key, value] of Object.entries(obj)) {
    operators.push(key);
    operators.push(...findOperators(value));
  }

  return operators;
}

/**
 * Validate a single logic expression
 */
function validateExpression(
  expression: string,
  file: string,
  field: string,
): ValidationError | null {
  try {
    // Parse the expression
    const parsed = parseLogicExpression(expression);

    // Find all operators used
    const operators = findOperators(parsed);

    // Check for unknown operators
    const unknownOperators = operators.filter((op) => !KNOWN_OPERATORS.has(op));

    if (unknownOperators.length > 0) {
      return {
        file,
        field,
        expression,
        error: `Unknown operator(s): ${unknownOperators.join(", ")}`,
      };
    }

    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      file,
      field,
      expression,
      error: `JSON parse error: ${message}`,
    };
  }
}

/**
 * Validate all option files in a directory
 */
function validateOptionsDirectory(optionsDir: string): ValidationResult {
  const result: ValidationResult = { valid: 0, errors: [] };

  let files: string[];
  try {
    files = readdirSync(optionsDir).filter((f) => f.endsWith(".json"));
  } catch {
    console.error(`Could not read directory: ${optionsDir}`);
    return result;
  }

  for (const file of files) {
    const filePath = join(optionsDir, file);
    let content: string;

    try {
      content = readFileSync(filePath, "utf-8");
    } catch {
      result.errors.push({
        file,
        field: "file",
        expression: "",
        error: "Could not read file",
      });
      continue;
    }

    let option: Record<string, unknown>;
    try {
      option = JSON.parse(content);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      result.errors.push({
        file,
        field: "file",
        expression: "",
        error: `Invalid JSON: ${message}`,
      });
      continue;
    }

    // Check logic field
    if (typeof option.logic === "string" && option.logic.trim()) {
      const error = validateExpression(option.logic, file, "logic");
      if (error) {
        result.errors.push(error);
      } else {
        result.valid++;
      }
    }

    // Check availability field
    if (typeof option.availability === "string" && option.availability.trim()) {
      const error = validateExpression(
        option.availability,
        file,
        "availability",
      );
      if (error) {
        result.errors.push(error);
      } else {
        result.valid++;
      }
    }
  }

  return result;
}

/**
 * Main validation function
 */
export function validateSeedData(seedPath: string): ValidationResult {
  const optionsDir = join(seedPath, "options");
  return validateOptionsDirectory(optionsDir);
}

/**
 * Find the project root by looking for package.json with workspaces
 */
function findProjectRoot(startDir: string): string {
  let dir = startDir;
  const maxDepth = 10;

  for (let i = 0; i < maxDepth; i++) {
    const pkgPath = join(dir, "package.json");
    try {
      const content = readFileSync(pkgPath, "utf-8");
      const pkg = JSON.parse(content);
      if (pkg.workspaces) {
        return dir;
      }
    } catch {
      // Continue searching
    }
    const parentDir = join(dir, "..");
    if (parentDir === dir) break;
    dir = parentDir;
  }

  throw new Error("Could not find project root");
}

/**
 * CLI entry point
 */
function main(): void {
  // Find project root and seed data directory
  const projectRoot = findProjectRoot(process.cwd());
  const seedPath = join(projectRoot, "data/seed");

  console.log("Validating seed data logic expressions...");
  console.log(`Seed path: ${seedPath}\n`);

  const result = validateSeedData(seedPath);

  if (result.errors.length === 0) {
    console.log(`All ${result.valid} logic expressions are valid.`);
    process.exit(0);
  }

  console.error("Validation errors found:\n");

  for (const error of result.errors) {
    console.error(`File: ${error.file}`);
    console.error(`Field: ${error.field}`);
    if (error.expression) {
      console.error(`Expression: ${error.expression}`);
    }
    console.error(`Error: ${error.error}`);
    console.error("");
  }

  console.error(
    `\nFound ${result.errors.length} error(s), ${result.valid} valid expression(s).`,
  );
  process.exit(1);
}

// Run if executed directly
if (import.meta.main) {
  main();
}
