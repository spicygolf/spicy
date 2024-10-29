
export type Round = {
  _type: 'round';
  created: string;
  seq: number;
};

export type RoundScore = {
  seq: number;
  values: ScoreKV[];
};

export type ScoreKV = {
  _type: 'score_kv';
  k: string;
  v: number | boolean | string;
  ts: string;
};
