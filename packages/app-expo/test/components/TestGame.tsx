import React, { useEffect, useState } from "react";
import { View, Text, Button, SafeAreaView, ScrollView } from "react-native";
import { useFireproof } from "@fireproof/react-native";

import { clearDb, writeDoc } from "../data/utils";
// @ts-ignore FIXME
import type { Doc } from "@fireproof/core";
import {
  game,
  game_holes,
  gamespecs,
  players,
  round,
  rounds_gross,
} from "../data/big_game";
import { ID, ScoreKV } from "spicylib/types";
import TestRound from "./TestRound";

const gameDbName = "game_test";

const TestGame = () => {
  const { database: gameDb } = useFireproof(gameDbName, { public: true });
  const [docs, setDocs] = useState<Doc[]>([]);

  const fetchData = async () => {
    let { rows: gameRows } = await gameDb.allDocs();
    setDocs([...gameRows]);
  };

  // TODO: const gamespec_ids = gamespecs.map(async (gs) => await db.put(gs));

  const createTest = async () => {
    await createGame();
  };

  const createGame = async () => {
    clearDb(gameDbName);
    await writeDoc(game, gameDb);
    const gsPromises = gamespecs.map(async (gs) => writeDoc(gs, gameDb));
    await Promise.all(gsPromises);
    const ghPromises = game_holes.map(async (gh) => writeDoc(gh, gameDb));
    await Promise.all(ghPromises);
    const pPromises = players.map(async (p) => {
      await writeDoc(p, gameDb);
      await createRound(p.round_id);
    });
    await Promise.all(pPromises);

    await fetchData();
  };

  const createRound = async (roundId?: ID) => {
    if (!roundId) return;
    const roundDbName = `round_${roundId}`;
    clearDb(roundDbName);
    const { database: roundDb } = useFireproof(roundDbName, { public: true });
    await writeDoc(round, roundDb);
    // @ts-ignore FIXME
    const gross = rounds_gross[`${roundId}_gross`] as number[];
    gross.map(async (v) => {
      const score: ScoreKV = {
        _type: "score_kv",
        k: "gross",
        v,
        ts: "2024-08-01T19:00:00Z",
      };
      await writeDoc(score, roundDb);
    });
  };

  useEffect(() => {
    if (docs.length === 0) {
      createTest();
    }
  }, []);

  return (
    <SafeAreaView>
      <ScrollView>
        <Text>Test Game</Text>
        {docs?.map((doc, i) => {
          const v = doc.value;
          let roundContent = null;
          if (v._type === "player") {
            roundContent = <TestRound roundId={v.round_id} />;
          }
          return (
            <View key={i}>
              <Text>
                {v._type} - {v.name}
              </Text>
              {roundContent}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TestGame;
