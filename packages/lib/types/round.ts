export interface Round {
  _type: "round";
  created: string;
  seq: number;
}

export interface RoundScore {
  seq: number;
  values: ScoreKV[];
}

export interface ScoreKV {
  _type: "score_kv";
  k: string;
  v: number | boolean | string;
  ts: string;
}
