#!/usr/bin/env bun
/**
 * Jazz Pattern Validator Hook
 *
 * PostToolUse hook that validates edited TypeScript/TSX files
 * against Jazz patterns to catch common mistakes.
 *
 * Checks for:
 * - useMemo/useCallback/useEffect with Jazz CoValues as dependencies
 * - useState storing Jazz objects
 */

import { readFileSync, existsSync } from "fs";

interface ValidationIssue {
  file: string;
  line: number;
  rule: string;
  message: string;
  suggestion: string;
}

const JAZZ_COVALUE_PATTERNS = [
  /\bgame\b/,
  /\bplayer\b/,
  /\bround\b/,
  /\bme\b/,
  /\broot\b/,
  /\baccount\b/,
];

function isJazzCoValue(varName: string): boolean {
  const lower = varName.toLowerCase();
  return JAZZ_COVALUE_PATTERNS.some((p) => p.test(lower));
}

function validateFile(filePath: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!existsSync(filePath)) {
    return issues;
  }

  // Only check TypeScript/TSX files in packages/app
  if (!filePath.includes("packages/app")) {
    return issues;
  }
  if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) {
    return issues;
  }

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Check for useMemo with Jazz dependencies
    // Pattern: useMemo(() => ..., [game, me, player, etc])
    const useMemoMatch = line.match(/useMemo\s*\(/);
    if (useMemoMatch) {
      // Look for the dependency array (might be on same line or next few lines)
      const contextLines = lines
        .slice(i, Math.min(i + 10, lines.length))
        .join("\n");
      // Match }, [deps]) or ), [deps]) pattern
      const depsMatch = contextLines.match(/[}\)]\s*,\s*\[([^\]]+)\]/);
      if (depsMatch) {
        const deps = depsMatch[1].split(",").map((d) => d.trim());
        const jazzDeps = deps.filter((d) => isJazzCoValue(d));
        if (jazzDeps.length > 0) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: "no-usememo-with-jazz",
            message: `useMemo has Jazz CoValue dependencies: ${jazzDeps.join(", ")}`,
            suggestion:
              "Jazz objects are reactive proxies - dependencies won't trigger updates. Compute directly instead.",
          });
        }
      }
    }

    // Check for useCallback with Jazz dependencies
    const useCallbackMatch = line.match(/useCallback\s*\(\s*(?:async\s*)?\(\)/);
    if (useCallbackMatch) {
      const contextLines = lines
        .slice(i, Math.min(i + 20, lines.length))
        .join("\n");
      const depsMatch = contextLines.match(/\},\s*\[([^\]]+)\]/);
      if (depsMatch) {
        const deps = depsMatch[1].split(",").map((d) => d.trim());
        const jazzDeps = deps.filter((d) => isJazzCoValue(d));
        if (jazzDeps.length > 0) {
          issues.push({
            file: filePath,
            line: lineNum,
            rule: "no-usecallback-with-jazz",
            message: `useCallback has Jazz CoValue dependencies: ${jazzDeps.join(", ")}`,
            suggestion:
              "Jazz objects are reactive proxies - dependencies won't trigger updates. Define as regular function instead.",
          });
        }
      }
    }

    // Check for useState with Jazz types
    // Pattern: useState<Game | Player | etc>
    const useStateMatch = line.match(/useState<([^>]+)>/);
    if (useStateMatch) {
      const typeArg = useStateMatch[1];
      if (
        /\b(Game|Player|Round|Hole|Team|Course|Tee|PlayerAccount|Handicap)\b/.test(
          typeArg,
        )
      ) {
        issues.push({
          file: filePath,
          line: lineNum,
          rule: "no-usestate-with-jazz",
          message: `useState stores Jazz CoValue type: ${typeArg}`,
          suggestion:
            "Store IDs (strings) instead of Jazz objects. Use useCoState to access the object.",
        });
      }
    }
  }

  return issues;
}

function main(): void {
  // Get file paths from environment
  const filePaths = process.env.CLAUDE_FILE_PATHS || "";

  if (!filePaths.trim()) {
    process.exit(0);
  }

  const files = filePaths.split(" ").filter((f) => f.trim());
  const allIssues: ValidationIssue[] = [];

  for (const file of files) {
    const issues = validateFile(file);
    allIssues.push(...issues);
  }

  if (allIssues.length === 0) {
    process.exit(0);
  }

  // Output warnings to Claude
  console.log("\n⚠️ Jazz Pattern Violations Detected:\n");

  for (const issue of allIssues) {
    console.log(`📍 ${issue.file}:${issue.line}`);
    console.log(`   Rule: ${issue.rule}`);
    console.log(`   Issue: ${issue.message}`);
    console.log(`   Fix: ${issue.suggestion}`);
    console.log("");
  }

  console.log(
    "See .claude/skills/jazz-patterns/README.md for full documentation.\n",
  );

  // Exit 0 to allow the edit but show the warning
  // Use exit 2 to block the edit if you want stricter enforcement
  process.exit(0);
}

main();
