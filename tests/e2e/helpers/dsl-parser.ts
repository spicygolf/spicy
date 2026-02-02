/**
 * Compact DSL Parser for E2E Test Fixtures
 *
 * Parses a compact shorthand format into full fixture JSON.
 *
 * Format:
 *   h1: (p1 p2) vs (p3 p4) | 4 4 5 6 | prox:p1 | t1:double
 *
 * Components:
 *   h1:              - Hole number
 *   (p1 p2) vs (p3 p4) - Team assignments (optional, inherits from previous)
 *   4 4 5 6          - Scores in player order (p1 p2 p3 p4)
 *   prox:p1          - Junk awards (junk_name:player_id)
 *   t1:double        - Multipliers (team_id:multiplier_name)
 *
 * Full example:
 *   name: Five Points Smoke Test
 *   players: p1 Brad 10, p2 Scott 12, p3 Tim 8, p4 Eric 14
 *   course: Test Course | Blue | 71.5/128
 *   holes: 1-4-5, 2-5-11, 3-3-15, ...
 *
 *   h1: (p1 p2) vs (p3 p4) | 4 4 5 6 | prox:p1
 *   h2: | 5 5 4 5 | birdie:p3 | t2:double
 *   h3: | 4 6 5 5 | | t1:double t2:double_back
 *
 * IMPORTANT: Player Order Convention
 *   The FIRST player in the players list (p1) is assumed to be the logged-in
 *   test user. When generating Maestro flows, this player is added automatically
 *   by the app, and only subsequent players (p2, p3, p4, etc.) are added as guests.
 *   Ensure your fixture's first player matches the test account's display name.
 */

import type {
  Fixture,
  FixtureCourse,
  FixtureHole,
  FixtureHoleData,
  FixturePlayer,
  FixtureTeams,
} from "../../lib/fixture-types";
import type { E2EMetadata } from "./fixture-to-maestro";

interface ParsedDSL {
  name: string;
  description?: string;
  spec: string;
  e2e?: E2EMetadata;
  course: FixtureCourse;
  players: FixturePlayer[];
  teams: FixtureTeams;
  holes: Record<string, FixtureHoleData>;
}

/**
 * Parse players line: "p1 Brad 10, p2 Scott 12, p3 Tim 8, p4 Eric 14"
 */
function parsePlayers(line: string): FixturePlayer[] {
  const players: FixturePlayer[] = [];
  const parts = line.split(",").map((p) => p.trim());

  for (const part of parts) {
    const match = part.match(/^(\w+)\s+(.+?)\s+(\d+(?:\.\d+)?)$/);
    if (match) {
      const [, id, name, handicap] = match;
      players.push({
        id,
        name,
        short: name.substring(0, 3),
        handicapIndex: Number.parseFloat(handicap),
      });
    }
  }

  return players;
}

/**
 * Parse course line: "Test Course | Blue | 71.5/128"
 */
function parseCourse(line: string): Omit<FixtureCourse, "holes"> {
  const parts = line.split("|").map((p) => p.trim());
  const name = parts[0] || "Test Course";
  const tee = parts[1] || "Blue";

  let rating = 71.5;
  let slope = 128;
  if (parts[2]) {
    const ratingSlope = parts[2].split("/");
    rating = Number.parseFloat(ratingSlope[0]) || 71.5;
    slope = Number.parseInt(ratingSlope[1], 10) || 128;
  }

  return { name, tee, rating, slope };
}

/**
 * Parse holes definition: "1-4-5, 2-5-11, 3-3-15" (hole-par-handicap)
 */
function parseHoleDefinitions(line: string): FixtureHole[] {
  const holes: FixtureHole[] = [];
  const parts = line.split(",").map((p) => p.trim());

  for (const part of parts) {
    const [holeStr, parStr, hdcpStr, yardsStr] = part.split("-");
    holes.push({
      hole: Number.parseInt(holeStr, 10),
      par: Number.parseInt(parStr, 10),
      handicap: Number.parseInt(hdcpStr, 10),
      yards: yardsStr ? Number.parseInt(yardsStr, 10) : 400,
    });
  }

  return holes;
}

/**
 * Parse team assignment: "(p1 p2) vs (p3 p4)"
 */
function parseTeams(segment: string): FixtureTeams | null {
  if (!segment.includes("(")) {
    return null;
  }

  const teams: FixtureTeams = {};
  const teamMatches = segment.matchAll(/\(([^)]+)\)/g);
  let teamNum = 1;

  for (const match of teamMatches) {
    const playerIds = match[1].trim().split(/\s+/);
    teams[String(teamNum)] = playerIds;
    teamNum++;
  }

  return Object.keys(teams).length > 0 ? teams : null;
}

/**
 * Parse scores: "4 4 5 6" (in player order)
 */
function parseScores(
  segment: string,
  players: FixturePlayer[],
): Record<string, { gross: number }> {
  const scores: Record<string, { gross: number }> = {};
  const values = segment.trim().split(/\s+/).map(Number);

  for (let i = 0; i < players.length && i < values.length; i++) {
    scores[players[i].id] = { gross: values[i] };
  }

  return scores;
}

/**
 * Parse junk awards: "prox:p1 birdie:p3" or "birdie:p1 birdie:p3"
 */
function parseJunk(segment: string): Record<string, string | string[]> {
  const junk: Record<string, string | string[]> = {};
  if (!segment.trim()) return junk;

  const parts = segment.trim().split(/\s+/);
  for (const part of parts) {
    const [junkName, playerId] = part.split(":");
    if (junkName && playerId) {
      // Handle multiple players for same junk
      const playerIds = playerId.split(",");

      // Check if this junk type already exists
      if (junk[junkName]) {
        // Convert to array and add new players
        const existing = Array.isArray(junk[junkName])
          ? junk[junkName]
          : [junk[junkName] as string];
        junk[junkName] = [...existing, ...playerIds];
      } else {
        junk[junkName] = playerIds.length === 1 ? playerIds[0] : playerIds;
      }
    }
  }

  return junk;
}

/**
 * Parse multipliers: "t1:double t2:double_back"
 */
function parseMultipliers(segment: string): Record<string, string[]> {
  const multipliers: Record<string, string[]> = {};
  if (!segment.trim()) return multipliers;

  const parts = segment.trim().split(/\s+/);
  for (const part of parts) {
    const [teamId, multiplierName] = part.split(":");
    if (teamId && multiplierName) {
      // Convert t1 -> 1
      const teamKey = teamId.replace(/^t/, "");
      if (!multipliers[teamKey]) {
        multipliers[teamKey] = [];
      }
      multipliers[teamKey].push(multiplierName);
    }
  }

  return multipliers;
}

/**
 * Check if a segment looks like scores (all numbers)
 */
function looksLikeScores(segment: string): boolean {
  if (!segment.trim()) return false;
  const parts = segment.trim().split(/\s+/);
  return parts.every((p) => /^\d+$/.test(p));
}

/**
 * Check if a segment looks like junk (contains : but not t1:, t2:, etc.)
 */
function looksLikeJunk(segment: string): boolean {
  if (!segment.trim()) return false;
  // Junk format: prox:p1 birdie:p3 (not t1:double)
  return segment.includes(":") && !segment.match(/\bt\d+:/);
}

/**
 * Check if a segment looks like multipliers (t1:double format)
 */
function looksLikeMultipliers(segment: string): boolean {
  if (!segment.trim()) return false;
  return /\bt\d+:/.test(segment);
}

/**
 * Parse a hole line: "h1: (p1 p2) vs (p3 p4) | 4 4 5 6 | prox:p1 | t1:double"
 *
 * Format is flexible - segments are identified by content:
 * - Teams: contains parentheses (p1 p2)
 * - Scores: all numbers (4 4 5 6)
 * - Junk: name:player format (prox:p1)
 * - Multipliers: t#:name format (t1:double)
 */
function parseHoleLine(
  line: string,
  players: FixturePlayer[],
  currentTeams: FixtureTeams,
): { holeNum: string; data: FixtureHoleData; teams: FixtureTeams } {
  // Extract hole number
  const holeMatch = line.match(/^h(\d+):\s*/i);
  if (!holeMatch) {
    throw new Error(`Invalid hole line: ${line}`);
  }
  const holeNum = holeMatch[1];
  const rest = line.slice(holeMatch[0].length);

  // Split by | into segments
  const segments = rest.split("|").map((s) => s.trim());

  // Identify each segment by its content
  let teamsSegment = "";
  let scoresSegment = "";
  let junkSegment = "";
  let multipliersSegment = "";

  for (const segment of segments) {
    if (!segment) continue;

    if (segment.includes("(")) {
      teamsSegment = segment;
    } else if (looksLikeScores(segment)) {
      scoresSegment = segment;
    } else if (looksLikeJunk(segment)) {
      junkSegment = segment;
    } else if (looksLikeMultipliers(segment)) {
      multipliersSegment = segment;
    }
  }

  // Parse teams (or use current)
  const newTeams = parseTeams(teamsSegment);
  const teams = newTeams || currentTeams;

  // Parse scores
  const scores = parseScores(scoresSegment, players);

  // Parse junk
  const junk = parseJunk(junkSegment);

  // Parse multipliers
  const multipliers = parseMultipliers(multipliersSegment);

  return {
    holeNum,
    data: {
      scores,
      junk: Object.keys(junk).length > 0 ? junk : undefined,
      multipliers:
        Object.keys(multipliers).length > 0 ? multipliers : undefined,
    },
    teams,
  };
}

/**
 * Parse complete DSL text into a fixture
 */
export function parseDSL(dsl: string): ParsedDSL {
  const lines = dsl
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  let name = "E2E Test";
  let description: string | undefined;
  let spec = "five_points";
  let e2e: E2EMetadata | undefined;
  let courseInfo: Omit<FixtureCourse, "holes"> = {
    name: "Test Course",
    tee: "Blue",
    rating: 71.5,
    slope: 128,
  };
  let holeDefinitions: FixtureHole[] = [];
  let players: FixturePlayer[] = [];
  let currentTeams: FixtureTeams = {};
  const holes: Record<string, FixtureHoleData> = {};

  for (const line of lines) {
    if (line.startsWith("name:")) {
      name = line.slice(5).trim();
    } else if (line.startsWith("desc:")) {
      description = line.slice(5).trim();
    } else if (line.startsWith("spec:")) {
      spec = line.slice(5).trim();
    } else if (line.startsWith("priority:")) {
      const priority = line.slice(9).trim() as "smoke" | "core" | "edge";
      e2e = { ...e2e, priority };
    } else if (line.startsWith("tags:")) {
      const tags = line.slice(5).trim().split(/\s+/);
      e2e = { ...e2e, tags };
    } else if (line.startsWith("players:")) {
      players = parsePlayers(line.slice(8).trim());
    } else if (line.startsWith("course:")) {
      courseInfo = parseCourse(line.slice(7).trim());
    } else if (line.startsWith("holes:")) {
      holeDefinitions = parseHoleDefinitions(line.slice(6).trim());
    } else if (line.match(/^h\d+:/i)) {
      const { holeNum, data, teams } = parseHoleLine(
        line,
        players,
        currentTeams,
      );
      holes[holeNum] = data;
      currentTeams = teams;
    }
  }

  // Build course with hole definitions
  const course: FixtureCourse = {
    ...courseInfo,
    holes: holeDefinitions,
  };

  // Validate hole count: definitions should match hole data entries
  const definedHoleNumbers = new Set(
    holeDefinitions.map((h) => String(h.hole)),
  );
  const dataHoleNumbers = new Set(Object.keys(holes));

  // Check for hole data without definitions
  for (const holeNum of dataHoleNumbers) {
    if (!definedHoleNumbers.has(holeNum)) {
      throw new Error(
        `Hole ${holeNum} has score data but no definition in 'holes:' line`,
      );
    }
  }

  // Check for definitions without data (warning only - might be intentional for partial tests)
  for (const holeNum of definedHoleNumbers) {
    if (!dataHoleNumbers.has(holeNum)) {
      console.warn(`Warning: Hole ${holeNum} is defined but has no score data`);
    }
  }

  return {
    name,
    description,
    spec,
    e2e,
    course,
    players,
    teams: currentTeams,
    holes,
  };
}

/**
 * Convert parsed DSL to full Fixture format
 */
export function dslToFixture(dsl: string): Fixture & { e2e?: E2EMetadata } {
  const parsed = parseDSL(dsl);

  return {
    name: parsed.name,
    description: parsed.description,
    spec: parsed.spec,
    e2e: parsed.e2e,
    course: parsed.course,
    players: parsed.players,
    teams: parsed.teams,
    holes: parsed.holes,
    expected: {
      // Expected values can be added manually or calculated
      holes: {},
      cumulative: {},
    },
  };
}

/**
 * CLI entry point
 */
export async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log("Usage: bun dsl-parser.ts <dsl-file>");
    console.log("Example: bun dsl-parser.ts five_points_smoke.dsl");
    process.exit(1);
  }

  const { readFileSync } = await import("node:fs");
  const dslContent = readFileSync(args[0], "utf-8");
  const fixture = dslToFixture(dslContent);

  console.log(JSON.stringify(fixture, null, 2));
}

if (import.meta.main) {
  main();
}
