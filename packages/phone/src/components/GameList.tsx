import React, { useEffect, useState } from 'react';
import { Button, FlatList, ListRenderItemInfo, Text, View } from 'react-native';
// @ts-ignore FIXME
import { Doc } from '@fireproof/core';
import { useFireproof } from '@fireproof/react-native';

import { getUTCNowISO, i18n } from 'spicylib/utils';
import type { Game, GameSpec } from 'spicylib/types';

export type GameFromAllDocs = { key: string; value: Doc<Game>; };

const GameList = () => {
  const {database : db, useLiveQuery} = useFireproof('spicy', {public: true});
  const defaultGame: Game = {
    _type: 'game',
    name: '',
    start: '',
  };

  const [game, setGame] = useState<Game>(defaultGame);

  // ============
  // db.allDocs()
  // ============

  const [games, setGames] = useState<GameFromAllDocs[]>([])
  const getGames = async () => {
    const { rows } = await db.allDocs<Game>();
    setGames(rows);
  }

  useEffect(() => {
    getGames()
  }, []);

  const returnChangeData = false;
  db.subscribe((changes) => {
    if (changes.length > 0) {
      console.log({changes});
      // This is a bit brute-strength, to get all docs upon one change.
      // It's one subscription though, vs. one subscription per doc.
      getGames();
    }
  }, returnChangeData);

  // ============
  // useLiveQuery
  // ============
  // const games = useLiveQuery<Game>('start').docs;


  const gamespecs: GameSpec[] = [
    {_type: 'gamespec', name: 'Five Points', version: 1, status: 'prod', type: 'points', min_players: 2, location_type: 'local', teams: true},
    {_type: 'gamespec', name: 'Match Play', version: 1, status: 'prod', type: 'match', min_players: 2, location_type: 'local', teams: true},
  ];

  const renderGameSpecs = ({item, index}: ListRenderItemInfo<GameSpec>) => {
    return (
      <View key={index}>
        <Text
          onPress={() => setGame({...game, ...item})}
        >{item.name}</Text>
      </View>
    )
  };

  const createGame = async () => {
    const newGame = {
      ...game,
      start: getUTCNowISO()
    };
    const res = await db.put(newGame);
    console.log('createGame', res);
  };

  return (
    <View>
      <FlatList
        data={gamespecs}
        renderItem={renderGameSpecs}
      />
      <Text>{JSON.stringify(game, null, 2)}</Text>
      <Button
        title={i18n('create_game')}
        onPress={createGame}
      />
      {games.map(g => (
        g && !g.value._deleted &&
        <View key={g.value._id}>
          <Text>{g.value.name as string}</Text>
          <Text>{g.value.start as string}</Text>
          <Text>{g.value.gamespec as number}</Text>
        </View>
      ))}
    </View>
  );
};

export default GameList;
