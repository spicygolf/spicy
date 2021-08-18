import { gql, useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { UPSERT_LINK_MUTATION } from 'common/graphql/link';
import { addPlayerToOwnTeam, getGamespecKVs } from 'common/utils/game';
import { linkPlayerToGame, linkRoundToGameAndPlayer } from 'common/utils/links';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { ADD_ROUND_MUTATION } from 'features/rounds/graphql';
import React, { useContext, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';

const LinkRound = (props) => {
  const UPDATE_GAME_MUTATION = gql`
    mutation UpdateGame($gkey: String!, $game: GameInput!) {
      updateGame(gkey: $gkey, game: $game) {
        holes {
          hole
          teams {
            team
            players
          }
        }
      }
    }
  `;

  const { game, player, round, isNew } = props;
  //console.log('LinkRound props', game, player, round, isNew);

  const { currentPlayerKey } = useContext(CurrentPlayerContext);

  const { _key: gkey, start: game_start } = game;
  const { _key: pkey } = player;
  const teamGame = getGamespecKVs(game, 'teams').includes(true);

  const navigation = useNavigation();

  const [addRound] = useMutation(ADD_ROUND_MUTATION);
  const [updateGame] = useMutation(UPDATE_GAME_MUTATION);
  const [playerToGame] = useMutation(UPSERT_LINK_MUTATION);
  const [roundToGame] = useMutation(UPSERT_LINK_MUTATION);
  const [roundToPlayer] = useMutation(UPSERT_LINK_MUTATION);

  const createNewRound = async () => {
    //console.log('createNewRound');
    // add round
    const { loading, error, data } = await addRound({
      variables: {
        round: {
          date: game_start,
          seq: 1,
          scores: [],
        },
      },
    });
    if (error) {
      console.log('Error creating new round', error);
      return null;
    }
    return data.addRound;
  };

  const linkRound = async (r) => {
    //console.log('linkRound');
    await linkRoundToGameAndPlayer({
      round: r,
      game,
      player,
      isNew,
      roundToGame,
      roundToPlayer,
    });
  };

  useEffect(() => {
    const init = async () => {
      // link player to game
      await linkPlayerToGame({
        pkey,
        gkey,
        playerToGame,
        currentPlayerKey,
      });

      // if not a team game, add player to her own team and update game
      if (!teamGame) {
        //console.log('firing add player to own team');
        await addPlayerToOwnTeam({ pkey, game, updateGame });
      }
      // link round
      let r = round && !isNew ? round : await createNewRound();
      await linkRound(r);

      //console.log('LinkRound navigating to GameSetup');
      navigation.navigate('Game', {
        currentGameKey: gkey,
        screen: 'Setup',
        params: {
          screen: 'GameSetup',
        },
      });
    };
    init();
  }, []);

  return <ActivityIndicator />;
};

export default LinkRound;
