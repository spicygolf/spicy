import { course_handicap } from 'common/utils/handicap';
import { GET_GAME_QUERY } from 'features/game/graphql';
import { ACTIVE_GAMES_FOR_PLAYER_QUERY } from 'features/games/graphql';

export const linkPlayerToGame = async ({
  pkey,
  gkey,
  playerToGame,
  currentPlayerKey,
}) => {
  //console.log('linkPlayerToGame', pkey, gkey, currentPlayerKey);
  //return;
  // link player to game
  try {
    const { error } = await playerToGame({
      variables: {
        from: { type: 'player', value: pkey },
        to: { type: 'game', value: gkey },
      },
      refetchQueries: () => [
        {
          query: GET_GAME_QUERY,
          variables: { gkey },
        },
        {
          query: ACTIVE_GAMES_FOR_PLAYER_QUERY,
          variables: {
            pkey: currentPlayerKey,
          },
          fetchPolicy: 'cache-and-network',
        },
      ],
      awaitRefetchQueries: true,
    });
    if (error) {
      throw error;
    }
  } catch (e) {
    console.log('error adding player to game', e);
  }
};

export const linkRoundToGameAndPlayer = async (props) => {
  const { round, game, player, isNew, roundToGame, roundToPlayer } = props;

  //console.log('linking round to game and player');
  const { _key: rkey, tee } = round;
  const {
    _key: gkey,
    scope: { holes },
  } = game;
  const { _key: pkey, handicap } = player;

  // first see if we can calc a course_handicap
  let other = [];
  try {
    const hi = handicap?.index;
    if (hi) {
      other.push({ key: 'handicap_index', value: hi.toString() });
    }
    const ch = course_handicap(hi, tee, holes);
    //console.log('links ch', ch, hi, tee, holes);
    if (ch) {
      other.push({ key: 'course_handicap', value: ch.toString() });
    }
    //console.log('LinkRound other', other);
  } catch (e) {
    console.log('Could not calc a course handicap for ', round);
    console.log('error', e);
  }

  // link round to game
  await roundToGame({
    variables: {
      from: { type: 'round', value: rkey },
      to: { type: 'game', value: gkey },
      other: other,
    },
    refetchQueries: () => [
      {
        query: GET_GAME_QUERY,
        variables: { gkey },
      },
    ],
    awaitRefetchQueries: true,
  });

  if (isNew) {
    // link round to player
    await roundToPlayer({
      variables: {
        from: { type: 'round', value: rkey },
        to: { type: 'player', value: pkey },
      },
      refetchQueries: () => [
        {
          query: GET_GAME_QUERY,
          variables: { gkey },
        },
      ],
      awaitRefetchQueries: true,
    });
  }
};

export const rmlink = async (fromType, fromKey, toType, toKey, unlink) => {
  const { error, data } = await unlink({
    variables: {
      from: { type: fromType, value: fromKey },
      to: { type: toType, value: toKey },
    },
  });
  if (error) {
    console.log('error removing link', error);
    console.log('rmlink', fromType, fromKey, toType, toKey);
    return null;
  }
  //console.log('rm data', data, fromType, fromKey, toType, toKey);
  return data;
};
