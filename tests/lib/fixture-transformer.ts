/**
 * Fixture Transformer
 *
 * Transforms human-readable fixture JSON into ScoringContext objects
 * that can be passed to the scoring pipeline.
 */

import type { Fixture } from "./fixture-types";
import {
  createMockGame,
  createMockGameSpec,
  createMockMapOfOptions,
  type MockGame,
  type MockGameSpec,
  type MockMapOfOptions,
  resetMockIds,
} from "./mock-jazz";
import { type LoadedOption, type LoadedSpec, loadSpec } from "./spec-loader";

// =============================================================================
// Types
// =============================================================================

/**
 * Result of transforming a fixture
 */
export interface TransformedFixture {
  /** Mock game object ready for scoring pipeline */
  game: MockGame;
  /** Mock game spec */
  gameSpec: MockGameSpec;
  /** Mock options map */
  options: MockMapOfOptions;
  /** Calculated course handicaps per player */
  courseHandicaps: Map<string, number>;
  /** Loaded spec data */
  loadedSpec: LoadedSpec;
}

// =============================================================================
// Handicap Calculation
// =============================================================================

/**
 * Calculate course handicap from handicap index and slope
 *
 * Formula: Course Handicap = Handicap Index × (Slope Rating / 113)
 */
function calculateCourseHandicap(handicapIndex: number, slope: number): number {
  return Math.round(handicapIndex * (slope / 113));
}

/**
 * Calculate course handicaps for all players in a fixture
 */
function calculateCourseHandicaps(fixture: Fixture): Map<string, number> {
  const handicaps = new Map<string, number>();

  // Use slope from fixture course, default to 113 (neutral)
  const slope = fixture.course.slope ?? 113;

  for (const player of fixture.players) {
    const courseHandicap = calculateCourseHandicap(player.handicapIndex, slope);
    handicaps.set(player.id, courseHandicap);
  }

  return handicaps;
}

// =============================================================================
// Options Processing
// =============================================================================

/**
 * Build options map from loaded spec and fixture overrides
 */
function buildOptionsMap(
  loadedSpec: LoadedSpec,
  fixtureOptions?: Record<string, number | string | boolean>,
): MockMapOfOptions {
  // Convert LoadedOption map to the format expected by createMockMapOfOptions
  const loadedOptions = new Map<string, LoadedOption>();
  for (const [name, option] of loadedSpec.options) {
    loadedOptions.set(name, option);
  }

  return createMockMapOfOptions(loadedOptions, fixtureOptions);
}

// =============================================================================
// Main Transformer
// =============================================================================

/**
 * Transform a fixture into objects ready for the scoring pipeline
 *
 * This is the main entry point for the transformer.
 * It:
 * 1. Loads the game spec from seed data
 * 2. Merges fixture options with spec defaults
 * 3. Calculates course handicaps
 * 4. Creates mock Jazz objects for the entire game graph
 */
export function transformFixture(fixture: Fixture): TransformedFixture {
  // Reset mock IDs for consistent test output
  resetMockIds();

  // Load the spec from seed data
  const loadedSpec = loadSpec(fixture.spec);

  // Calculate course handicaps
  const courseHandicaps = calculateCourseHandicaps(fixture);

  // Build options map with fixture overrides
  const options = buildOptionsMap(loadedSpec, fixture.options);

  // Create the mock game spec
  const gameSpec = createMockGameSpec(
    {
      name: loadedSpec.name,
      disp: loadedSpec.disp,
      version: loadedSpec.version,
      status: loadedSpec.status,
      type: loadedSpec.type,
      min_players: loadedSpec.min_players,
      max_players: loadedSpec.max_players,
      location_type: loadedSpec.location_type,
      teams: loadedSpec.teams,
      team_size: loadedSpec.team_size,
      team_change_every: loadedSpec.team_change_every,
    },
    options,
  );

  // Create the mock game with all nested objects
  const game = createMockGame(fixture, gameSpec, options, courseHandicaps);

  return {
    game,
    gameSpec,
    options,
    courseHandicaps,
    loadedSpec,
  };
}

/**
 * Transform a fixture and return just the game object
 *
 * Convenience wrapper for tests that only need the game.
 */
export function transformFixtureToGame(fixture: Fixture): MockGame {
  return transformFixture(fixture).game;
}
