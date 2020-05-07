import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
} from 'react-native';
import { gql, useMutation } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { reduce } from 'lodash';

import { GameContext } from 'features/game/gameContext';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { ADD_LINK_MUTATION } from 'common/graphql/link'
import { ADD_ROUND_MUTATION } from 'features/rounds/graphql';
import {
  linkPlayerToGame,
  linkRoundToGameAndPlayer,
} from 'common/utils/links';
import {
  getGamespecKVs,
  getHolesToUpdate,
  getNewGameForUpdate,
  updateGameHolesCache,
} from 'common/utils/game';



const LinkRound = props => {

  const { route } = props;
  const { player, round } = route.params;
  //console.log('LinkRound', player, round);

  const { currentPlayerKey } = useContext(CurrentPlayerContext);

  const { game } = useContext(GameContext);
  const { _key: gkey, start: game_start } = game;
  const { _key: pkey } = player;
  const teamGame = getGamespecKVs(game, 'teams').includes(true);

  const navigation = useNavigation();
  const [ addRound ] = useMutation(ADD_ROUND_MUTATION);
  const [ link ] = useMutation(ADD_LINK_MUTATION);
  const [ updateGame ] = useMutation(UPDATE_GAME_MUTATION);
  const [ linkRoundToGame ] = useMutation(ADD_LINK_MUTATION);
  const [ linkRoundToPlayer ] = useMutation(ADD_LINK_MUTATION);

  const UPDATE_GAME_MUTATION = gql`
    mutation UpdateGame($gkey: String!, $game: GameInput!) {
      updateGame(gkey: $gkey, game: $game) {
        holes {
          hole
          teams {
            team
            players
            junk {
              name
              player
              value
            }
          }
        }
      }
    }
  `;

  const addPlayerToOwnTeam = async ({pkey, game}) => {

    console.log('game', game);
    let newGame = getNewGameForUpdate(game);

    const holesToUpdate = getHolesToUpdate(newGame.scope.teams_rotate, game);
    if( !newGame.holes ) {
      newGame.holes = [];
    }
    console.log('holesToUpdate', holesToUpdate);
    holesToUpdate.map(h => {
      const holeIndex = findIndex(newGame.holes, {hole: h});
      if( holeIndex < 0 ) {
        // if hole data doesn't exist, create it with the single player team
        newGame.holes.push({
          hole: h,
          teams: [{
            team: '1', players: [pkey], junk: [],
          }],
          multipliers: [],
        });
      } else {
        // hole exists, so just add a new team with this player only
        if( newGame.holes[holeIndex].teams ) {
          const maxTeam = reduce(newGame.holes[holeIndex].teams, (max, t) => {
            const teamNum = parseInt(t.team);
            if( !teamNum ) return max;
            return (teamNum > max) ? teamNum : max;
          }, 0);
          console.log('maxTeam', maxTeam);
          newGame.holes[holeIndex].teams.push({
            team: (++maxTeam).toString(), players: [pkey], junk: [],
          });
        } else {
          newGame.holes[holeIndex].teams = [{
            team: '1', players: [pkey], junk: [],
          }];
        }
      }
    });
    console.log('addPlayerToOwnTeam newGame', newGame);
    const { loading, error, data } = updateGame({
      variables: {
        gkey: gkey,
        game: newGame,
      },
      update: (cache, { data: { updateGame } }) => {
        //console.log('cache data', cache.data);
        updateGameHolesCache({
          cache,
          gkey,
          holes: newGame.holes,
        });
      },
    });

    if( error ) console.log('Error updating game - linkRound', error);

  };

  const createNewRound = async () => {
    //console.log('createNewRound');
    // add round
    const { loading, error, data } = await addRound({
      variables: {
        round: {
          date: game_start,
          seq: 1,
          scores: []
        }
      },
    });
    if( error ) {
      console.log('Error creating new round', error);
      return null;
    }
    return data.addRound;
  };

  const linkRound = async r => {
    //console.log('linkRound');
    await linkRoundToGameAndPlayer({
      round: r,
      game: game,
      player: player,
      isNew: true,
      linkRoundToGame: linkRoundToGame,
      linkRoundToPlayer: linkRoundToPlayer,
    });
  };

  useEffect(
    () => {
      const init = async () => {
        // link player to game
        await linkPlayerToGame({
          pkey: pkey,
          gkey: gkey,
          link: link,
          currentPlayerKey: currentPlayerKey,
        });

        // if not a team game, add player to her own team and update game
        if( !teamGame ) {
          console.log('firing add player to own team');
          await addPlayerToOwnTeam({pkey, game});
        }

        // link round
        let r = round ? round : await createNewRound();
        await linkRound(r);

        navigation.navigate('GameSetup');
      };
      init();
    }, []
  );

  return (<ActivityIndicator />);

};

export default LinkRound;

