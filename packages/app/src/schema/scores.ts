import { co, z } from 'jazz-tools';
import { Player } from './players';

// per-score value object (holding current)
export const Value = co.map({
  k: z.string(),
  v: z.string(),
  by: Player,
  at: z.date(),
});
export type Value = co.loaded<typeof Value>;

// history of score updates
export const ScoreUpdate = co.map({
  by: Player,
  at: z.date(),
  old: Value,
});
export type ScoreUpdate = co.loaded<typeof ScoreUpdate>;

export const ListOfValues = co.list(Value);
export type ListOfValues = co.loaded<typeof ListOfValues>;

export const ListOfScoreUpdate = co.list(ScoreUpdate);
export type ListOfScoreUpdate = co.loaded<typeof ListOfScoreUpdate>;

// per-hole score object
export const Score = co.map({
  seq: z.number(),
  values: ListOfValues,
  history: ListOfScoreUpdate,
});
export type Score = co.loaded<typeof Score>;

export const ListOfScores = co.list(Score);
export type ListOfScores = co.loaded<typeof ListOfScores>;
