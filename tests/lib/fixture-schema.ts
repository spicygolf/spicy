/**
 * Fixture Zod Schema
 *
 * Runtime validation for test fixtures.
 */

import { z } from "zod";

// =============================================================================
// Input Schemas
// =============================================================================

export const FixtureHoleSchema = z.object({
  hole: z.number().int().min(1).max(18),
  par: z.number().int().min(3).max(6),
  handicap: z.number().int().min(1).max(18),
  yards: z.number().int().min(0),
});

export const FixtureCourseSchema = z.object({
  name: z.string().min(1),
  tee: z.string().min(1),
  holes: z.array(FixtureHoleSchema).min(1),
  rating: z.number().optional(),
  slope: z.number().int().min(55).max(155).optional(),
});

export const FixturePlayerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  handicapIndex: z.number(),
  short: z.string().optional(),
});

export const FixtureTeamsSchema = z.record(z.string(), z.array(z.string()));

export const FixtureOptionsSchema = z.record(
  z.string(),
  z.union([z.number(), z.string(), z.boolean()]),
);

export const FixturePlayerScoreSchema = z.object({
  gross: z.number().int().min(1),
});

export const FixtureHoleJunkSchema = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string())]),
);

export const FixtureHoleMultipliersSchema = z.record(
  z.string(),
  z.array(z.string()),
);

export const FixtureHoleDataSchema = z.object({
  scores: z.record(z.string(), FixturePlayerScoreSchema),
  junk: FixtureHoleJunkSchema.optional(),
  multipliers: FixtureHoleMultipliersSchema.optional(),
});

// =============================================================================
// Expected Output Schemas
// =============================================================================

export const ExpectedTeamHoleResultSchema = z.object({
  lowBall: z.number().optional(),
  total: z.number().optional(),
  points: z.number().optional(),
  rank: z.number().int().optional(),
});

export const ExpectedPlayerHoleResultSchema = z.object({
  gross: z.number().optional(),
  net: z.number().optional(),
  pops: z.number().optional(),
  junk: z.array(z.string()).optional(),
  points: z.number().optional(),
  rank: z.number().int().optional(),
});

export const ExpectedHoleResultSchema = z.object({
  teams: z.record(z.string(), ExpectedTeamHoleResultSchema).optional(),
  players: z.record(z.string(), ExpectedPlayerHoleResultSchema).optional(),
  holeMultiplier: z.number().optional(),
});

export const ExpectedTeamCumulativeSchema = z.object({
  pointsTotal: z.number().optional(),
  scoreTotal: z.number().optional(),
  rank: z.number().int().optional(),
});

export const ExpectedPlayerCumulativeSchema = z.object({
  grossTotal: z.number().optional(),
  netTotal: z.number().optional(),
  pointsTotal: z.number().optional(),
  rank: z.number().int().optional(),
});

export const ExpectedCumulativeSchema = z.object({
  teams: z.record(z.string(), ExpectedTeamCumulativeSchema).optional(),
  players: z.record(z.string(), ExpectedPlayerCumulativeSchema).optional(),
});

export const ExpectedResultsSchema = z.object({
  holes: z.record(z.string(), ExpectedHoleResultSchema).optional(),
  cumulative: ExpectedCumulativeSchema.optional(),
});

// =============================================================================
// Main Fixture Schema
// =============================================================================

export const FixtureSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  spec: z.string().min(1),
  course: FixtureCourseSchema,
  players: z.array(FixturePlayerSchema).min(1),
  teams: FixtureTeamsSchema.optional(),
  options: FixtureOptionsSchema.optional(),
  holes: z.record(z.string(), FixtureHoleDataSchema),
  expected: ExpectedResultsSchema,
});

export type ValidatedFixture = z.infer<typeof FixtureSchema>;

/**
 * Validate a fixture object
 * @throws ZodError if validation fails
 */
export function validateFixture(data: unknown): ValidatedFixture {
  return FixtureSchema.parse(data);
}

/**
 * Safely validate a fixture, returning result with error info
 */
export function safeValidateFixture(
  data: unknown,
): z.SafeParseReturnType<unknown, ValidatedFixture> {
  return FixtureSchema.safeParse(data);
}
