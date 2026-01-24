/**
 * Mock Jazz Object Factories
 *
 * Creates lightweight mock objects that satisfy the Jazz `$isLoaded` checks
 * used by the scoring pipeline, without requiring real Jazz connections.
 */

import type {
  Fixture,
  FixtureCourse,
  FixtureHoleData,
  FixturePlayer,
} from "./fixture-types";

// =============================================================================
// Mock Jazz Base
// =============================================================================

/**
 * Creates the base Jazz metadata that all CoMaps need
 */
function createMockJazzMeta(id: string): MockJazzMeta {
  return {
    id,
    has: () => true,
    set: () => {},
  };
}

interface MockJazzMeta {
  id: string;
  has: (key: string) => boolean;
  set: (key: string, value: unknown) => void;
}

interface MockJazzBase {
  $isLoaded: true;
  $jazz: MockJazzMeta;
}

function withJazzBase<T>(id: string, obj: T): T & MockJazzBase {
  return {
    ...obj,
    $isLoaded: true as const,
    $jazz: createMockJazzMeta(id),
  };
}

// =============================================================================
// Mock CoList (Array-like)
// =============================================================================

/**
 * Creates a mock CoList that behaves like an array with Jazz metadata
 */
function createMockList<T>(
  id: string,
  items: T[],
): T[] & MockJazzBase & { length: number } {
  const list = [...items] as T[] & MockJazzBase & { length: number };
  Object.defineProperty(list, "$isLoaded", { value: true, enumerable: false });
  Object.defineProperty(list, "$jazz", {
    value: createMockJazzMeta(id),
    enumerable: false,
  });
  return list;
}

// =============================================================================
// Mock CoRecord (Object-like)
// =============================================================================

/**
 * Creates a mock CoRecord (key-value store) with Jazz metadata
 */
function createMockRecord<V>(
  id: string,
  entries: Record<string, V>,
): Record<string, V> & MockJazzBase {
  const record = { ...entries } as Record<string, V> & MockJazzBase;
  Object.defineProperty(record, "$isLoaded", {
    value: true,
    enumerable: false,
  });
  Object.defineProperty(record, "$jazz", {
    value: createMockJazzMeta(id),
    enumerable: false,
  });
  return record;
}

// =============================================================================
// Score Types
// =============================================================================

export interface MockHoleScores extends MockJazzBase {
  [key: string]: string | boolean | MockJazzMeta;
}

export interface MockRoundScores extends MockJazzBase {
  [holeNum: string]: MockHoleScores | boolean | MockJazzMeta;
}

// =============================================================================
// Tee and Course Types
// =============================================================================

export interface MockTeeHole extends MockJazzBase {
  hole: number;
  par: number;
  yards: number;
  handicap: number;
}

export interface MockTee extends MockJazzBase {
  name: string;
  holes: (MockTeeHole[] & MockJazzBase) | undefined;
}

export interface MockCourse extends MockJazzBase {
  name: string;
}

// =============================================================================
// Round Types
// =============================================================================

export interface MockRound extends MockJazzBase {
  createdAt: Date;
  playerId: string;
  handicapIndex: string;
  course: MockCourse | undefined;
  tee: MockTee | undefined;
  scores: MockRoundScores;
}

export interface MockRoundToGame extends MockJazzBase {
  round: MockRound;
  handicapIndex: string;
  courseHandicap: number | undefined;
  gameHandicap: number | undefined;
}

// =============================================================================
// Team Types
// =============================================================================

export interface MockTeamOption extends MockJazzBase {
  optionName: string;
  value: string;
  playerId?: string;
  firstHole?: string;
}

export interface MockRoundToTeam extends MockJazzBase {
  roundToGame: MockRoundToGame;
}

export interface MockTeam extends MockJazzBase {
  team: string;
  rounds: (MockRoundToTeam[] & MockJazzBase) | undefined;
  options: (MockTeamOption[] & MockJazzBase) | undefined;
}

// =============================================================================
// GameHole Types
// =============================================================================

export interface MockGameHole extends MockJazzBase {
  hole: string;
  seq: number;
  teams: (MockTeam[] & MockJazzBase) | undefined;
  options: (Record<string, MockOption> & MockJazzBase) | undefined;
}

// =============================================================================
// Option Types
// =============================================================================

export interface MockGameOption extends MockJazzBase {
  name: string;
  disp: string;
  type: "game";
  valueType: "bool" | "num" | "menu" | "text";
  defaultValue: string;
  value?: string;
  seq?: number;
}

export interface MockJunkOption extends MockJazzBase {
  name: string;
  disp: string;
  type: "junk";
  value: number;
  scope?: string;
  based_on?: string;
  score_to_par?: string;
  calculation?: string;
  logic?: string;
}

export interface MockMultiplierOption extends MockJazzBase {
  name: string;
  disp: string;
  type: "multiplier";
  value: number;
  sub_type?: string;
  scope?: string;
  based_on?: string;
  availability?: string;
}

export type MockOption = MockGameOption | MockJunkOption | MockMultiplierOption;

export type MockMapOfOptions = Record<string, MockOption> & MockJazzBase;

// =============================================================================
// GameSpec Types
// =============================================================================

export interface MockGameSpec extends MockJazzBase {
  name: string;
  short: string;
  version: number;
  status: string;
  spec_type: string;
  min_players: number;
  location_type: string;
  options: MockMapOfOptions | undefined;
}

// =============================================================================
// GameScope Types
// =============================================================================

export interface MockTeamsConfig extends MockJazzBase {
  rotateEvery: number;
  teamCount: number;
}

export interface MockGameScope extends MockJazzBase {
  holes: "all18" | "front9" | "back9";
  teamsConfig: MockTeamsConfig | undefined;
}

// =============================================================================
// Game Types
// =============================================================================

export interface MockGame extends MockJazzBase {
  start: Date;
  name: string;
  scope: MockGameScope;
  /**
   * Working copy of the spec's options for this game.
   * This is what scoring and display code should read from.
   */
  spec: MockMapOfOptions | undefined;
  /**
   * Reference to the original catalog spec.
   * Used for display and "reset to defaults" functionality.
   */
  specRef: MockGameSpec | undefined;
  holes: (MockGameHole[] & MockJazzBase) | undefined;
  players: (unknown[] & MockJazzBase) | undefined;
  rounds: (MockRoundToGame[] & MockJazzBase) | undefined;
}

// =============================================================================
// Factory Functions
// =============================================================================

let mockIdCounter = 0;
function nextMockId(prefix: string): string {
  mockIdCounter += 1;
  return `mock_${prefix}_${mockIdCounter}`;
}

/**
 * Reset the mock ID counter (useful between tests)
 */
export function resetMockIds(): void {
  mockIdCounter = 0;
}

/**
 * Create mock tee holes from fixture course data
 */
export function createMockTeeHoles(
  course: FixtureCourse,
): MockTeeHole[] & MockJazzBase {
  const holes = course.holes.map((h) =>
    withJazzBase(nextMockId("teehole"), {
      hole: h.hole,
      par: h.par,
      yards: h.yards,
      handicap: h.handicap,
    }),
  );
  return createMockList(nextMockId("teeholes"), holes);
}

/**
 * Create a mock tee from fixture course data
 */
export function createMockTee(course: FixtureCourse): MockTee {
  return withJazzBase(nextMockId("tee"), {
    name: course.tee,
    holes: createMockTeeHoles(course),
  });
}

/**
 * Create a mock course from fixture course data
 */
export function createMockCourse(course: FixtureCourse): MockCourse {
  return withJazzBase(nextMockId("course"), {
    name: course.name,
  });
}

/**
 * Create mock hole scores from fixture data
 */
export function createMockHoleScores(
  holeData: FixtureHoleData,
  playerId: string,
  junkForPlayer: string[],
): MockHoleScores {
  const scores: Record<string, string> = {};
  const playerScore = holeData.scores[playerId];

  if (playerScore) {
    scores.gross = String(playerScore.gross);
  }

  // Add junk that this player earned
  for (const junkName of junkForPlayer) {
    scores[junkName] = "true";
  }

  return createMockRecord(nextMockId("holescores"), scores) as MockHoleScores;
}

/**
 * Create mock round scores from fixture data
 */
export function createMockRoundScores(
  fixture: Fixture,
  playerId: string,
): MockRoundScores {
  const scores: Record<string, MockHoleScores> = {};

  for (const [holeNum, holeData] of Object.entries(fixture.holes)) {
    // Find junk this player earned on this hole
    const junkForPlayer: string[] = [];
    if (holeData.junk) {
      for (const [junkName, recipients] of Object.entries(holeData.junk)) {
        if (typeof recipients === "string") {
          if (recipients === playerId) {
            junkForPlayer.push(junkName);
          }
        } else if (Array.isArray(recipients)) {
          if (recipients.includes(playerId)) {
            junkForPlayer.push(junkName);
          }
        }
      }
    }

    scores[holeNum] = createMockHoleScores(holeData, playerId, junkForPlayer);
  }

  return createMockRecord(nextMockId("roundscores"), scores) as MockRoundScores;
}

/**
 * Create a mock round from fixture data
 */
export function createMockRound(
  fixture: Fixture,
  player: FixturePlayer,
): MockRound {
  return withJazzBase(nextMockId("round"), {
    createdAt: new Date(),
    playerId: player.id,
    handicapIndex: String(player.handicapIndex),
    course: createMockCourse(fixture.course),
    tee: createMockTee(fixture.course),
    scores: createMockRoundScores(fixture, player.id),
  });
}

/**
 * Create a mock RoundToGame edge from fixture data
 */
export function createMockRoundToGame(
  fixture: Fixture,
  player: FixturePlayer,
  courseHandicap: number,
): MockRoundToGame {
  return withJazzBase(nextMockId("roundtogame"), {
    round: createMockRound(fixture, player),
    handicapIndex: String(player.handicapIndex),
    courseHandicap,
    gameHandicap: undefined,
  });
}

/**
 * Create mock team options from fixture hole data for a SPECIFIC hole
 */
export function createMockTeamOptionsForHole(
  fixture: Fixture,
  teamId: string,
  holeNum: string,
): (MockTeamOption[] & MockJazzBase) | undefined {
  const options: MockTeamOption[] = [];
  const holeData = fixture.holes[holeNum];

  if (!holeData) {
    return undefined;
  }

  // Add multipliers for this team on this specific hole
  if (holeData.multipliers?.[teamId]) {
    for (const multName of holeData.multipliers[teamId]) {
      options.push(
        withJazzBase(nextMockId("teamoption"), {
          optionName: multName,
          value: "2", // Default multiplier value
          firstHole: holeNum,
        }),
      );
    }
  }

  // Add junk for players on this team for this specific hole
  const teamPlayerIds = fixture.teams?.[teamId] ?? [];
  if (holeData.junk) {
    for (const [junkName, recipients] of Object.entries(holeData.junk)) {
      const recipientList =
        typeof recipients === "string" ? [recipients] : recipients;
      for (const playerId of recipientList) {
        if (teamPlayerIds.includes(playerId)) {
          options.push(
            withJazzBase(nextMockId("teamoption"), {
              optionName: junkName,
              value: "true",
              playerId,
              firstHole: holeNum,
            }),
          );
        }
      }
    }
  }

  if (options.length === 0) {
    return undefined;
  }

  return createMockList(nextMockId("teamoptions"), options);
}

/**
 * Create a mock team from fixture data for a specific hole
 */
export function createMockTeamForHole(
  fixture: Fixture,
  teamId: string,
  holeNum: string,
  roundToGames: Map<string, MockRoundToGame>,
): MockTeam {
  const playerIds = fixture.teams?.[teamId] ?? [];

  const roundToTeams: MockRoundToTeam[] = playerIds
    .map((playerId) => {
      const rtg = roundToGames.get(playerId);
      if (!rtg) return null;
      return withJazzBase(nextMockId("roundtoteam"), {
        roundToGame: rtg,
      });
    })
    .filter((r): r is MockRoundToTeam => r !== null);

  return withJazzBase(nextMockId("team"), {
    team: teamId,
    rounds: createMockList(nextMockId("teamrounds"), roundToTeams),
    options: createMockTeamOptionsForHole(fixture, teamId, holeNum),
  });
}

/**
 * Create mock game holes from fixture data
 */
export function createMockGameHoles(
  fixture: Fixture,
  roundToGames: Map<string, MockRoundToGame>,
): MockGameHole[] & MockJazzBase {
  const gameHoles: MockGameHole[] = [];

  // Get all hole numbers from fixture
  const holeNums = Object.keys(fixture.holes)
    .map((h) => Number.parseInt(h, 10))
    .sort((a, b) => a - b);

  for (let i = 0; i < holeNums.length; i++) {
    const holeNum = holeNums[i];
    const holeStr = String(holeNum);

    // Create teams for THIS SPECIFIC hole (with hole-specific options)
    const teams: MockTeam[] = [];
    if (fixture.teams) {
      for (const teamId of Object.keys(fixture.teams)) {
        teams.push(
          createMockTeamForHole(fixture, teamId, holeStr, roundToGames),
        );
      }
    }

    gameHoles.push(
      withJazzBase(nextMockId("gamehole"), {
        hole: holeStr,
        seq: i + 1,
        teams: createMockList(nextMockId("holeteams"), teams),
        options: undefined,
      }),
    );
  }

  return createMockList(nextMockId("gameholes"), gameHoles);
}

/**
 * Create a mock GameSpec from loaded spec data
 */
export function createMockGameSpec(
  specData: LoadedSpec,
  options: MockMapOfOptions | undefined,
): MockGameSpec {
  return withJazzBase(nextMockId("gamespec"), {
    name: specData.name,
    short: specData.disp,
    version: specData.version,
    status: specData.status,
    spec_type: specData.type,
    min_players: specData.min_players,
    location_type: specData.location_type,
    options,
  });
}

/**
 * Create a mock GameScope
 */
export function createMockGameScope(
  holesScope: "all18" | "front9" | "back9",
  hasTeams: boolean,
  teamCount: number,
): MockGameScope {
  return withJazzBase(nextMockId("gamescope"), {
    holes: holesScope,
    teamsConfig: hasTeams
      ? withJazzBase(nextMockId("teamsconfig"), {
          rotateEvery: 0,
          teamCount,
        })
      : undefined,
  });
}

/**
 * Create a mock Game from fixture data
 *
 * This is the main entry point for creating mock games.
 * It builds the complete object graph needed by the scoring pipeline.
 */
export function createMockGame(
  fixture: Fixture,
  spec: MockGameSpec,
  options: MockMapOfOptions | undefined,
  courseHandicaps: Map<string, number>,
): MockGame {
  // Create RoundToGame edges for each player
  const roundToGames = new Map<string, MockRoundToGame>();
  for (const player of fixture.players) {
    const courseHandicap = courseHandicaps.get(player.id) ?? 0;
    roundToGames.set(
      player.id,
      createMockRoundToGame(fixture, player, courseHandicap),
    );
  }

  // Determine holes scope from fixture
  const holeNums = Object.keys(fixture.holes).map((h) =>
    Number.parseInt(h, 10),
  );
  const minHole = Math.min(...holeNums);
  const maxHole = Math.max(...holeNums);
  let holesScope: "all18" | "front9" | "back9" = "all18";
  if (maxHole <= 9) {
    holesScope = "front9";
  } else if (minHole >= 10) {
    holesScope = "back9";
  }

  const hasTeams = fixture.teams !== undefined;
  const teamCount = hasTeams ? Object.keys(fixture.teams!).length : 0;

  return withJazzBase(nextMockId("game"), {
    start: new Date(),
    name: fixture.name,
    scope: createMockGameScope(holesScope, hasTeams, teamCount),
    spec: options, // Working copy of options for scoring
    specRef: spec, // Reference to catalog spec
    holes: createMockGameHoles(fixture, roundToGames),
    players: createMockList(nextMockId("players"), []),
    rounds: createMockList(
      nextMockId("rounds"),
      Array.from(roundToGames.values()),
    ),
  });
}

// =============================================================================
// Spec Data Types (imported from spec-loader)
// =============================================================================

/**
 * Loaded spec data from seed files
 * This interface matches the structure in data/seed/specs/*.json
 */
export interface LoadedSpec {
  name: string;
  disp: string;
  version: number;
  status: string;
  type: string;
  min_players: number;
  max_players?: number;
  location_type: string;
  teams?: boolean;
  team_size?: number;
  team_change_every?: number;
  options?: string[];
  junk?: Array<string | { name: string; value: number }>;
  multipliers?: string[];
}

/**
 * Loaded option data from seed files
 */
export interface LoadedOption {
  name: string;
  disp: string;
  type: "game" | "junk" | "multiplier";
  // Game option fields
  valueType?: "bool" | "num" | "menu" | "text";
  defaultValue?: string;
  // Junk option fields
  value?: number;
  scope?: string;
  based_on?: string;
  score_to_par?: string;
  calculation?: string;
  logic?: string;
  // Multiplier option fields
  sub_type?: string;
  availability?: string;
}

/**
 * Create a mock option from loaded option data
 */
export function createMockOption(
  optionData: LoadedOption,
  valueOverride?: number | string | boolean,
): MockOption {
  const base = {
    name: optionData.name,
    disp: optionData.disp,
  };

  if (optionData.type === "game") {
    const opt: MockGameOption = withJazzBase(nextMockId("option"), {
      ...base,
      type: "game" as const,
      valueType: optionData.valueType ?? "bool",
      defaultValue: optionData.defaultValue ?? "false",
      value: valueOverride !== undefined ? String(valueOverride) : undefined,
    });
    return opt;
  }

  if (optionData.type === "junk") {
    const opt: MockJunkOption = withJazzBase(nextMockId("option"), {
      ...base,
      type: "junk" as const,
      value:
        typeof valueOverride === "number"
          ? valueOverride
          : (optionData.value ?? 1),
      scope: optionData.scope,
      based_on: optionData.based_on,
      score_to_par: optionData.score_to_par,
      calculation: optionData.calculation,
      logic: optionData.logic,
    });
    return opt;
  }

  // multiplier
  const opt: MockMultiplierOption = withJazzBase(nextMockId("option"), {
    ...base,
    type: "multiplier" as const,
    value:
      typeof valueOverride === "number"
        ? valueOverride
        : (optionData.value ?? 2),
    sub_type: optionData.sub_type,
    scope: optionData.scope,
    based_on: optionData.based_on,
    availability: optionData.availability,
  });
  return opt;
}

/**
 * Create a mock MapOfOptions from loaded options with fixture overrides
 */
export function createMockMapOfOptions(
  loadedOptions: Map<string, LoadedOption>,
  fixtureOverrides?: Record<string, number | string | boolean>,
): MockMapOfOptions {
  const options: Record<string, MockOption> = {};

  for (const [name, optionData] of loadedOptions) {
    const override = fixtureOverrides?.[name];
    options[name] = createMockOption(optionData, override);
  }

  return createMockRecord(
    nextMockId("mapofoptions"),
    options,
  ) as MockMapOfOptions;
}
