import React, { useContext } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Icon,
} from 'react-native-elements';
import { useMutation } from '@apollo/client';
import { cloneDeep, findIndex, sortBy } from 'lodash';
import { gql } from '@apollo/client';

import { GameContext } from 'features/game/gameContext';
import { GET_GAME_QUERY } from 'features/game/graphql';
import { blue } from 'common/colors';
import {
  get_net_score,
  get_score_value,
} from 'common/utils/rounds';
import {
  getJunkFromGamespecs,
  isScoreToParJunk,
} from 'common/utils/score';
import {
  getJunk,
  getNewGameForUpdate,
  setTeamJunk,
} from 'common/utils/game';



const HoleJunk = props => {

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

  const { hole, score, pkey } = props;
  const par = (hole && hole.par) ? parseFloat(hole.par) : 0.0;

  const { game } = useContext(GameContext);
  const { _key: gkey } = game;

  const { gamespecs } = game;
  const alljunk = getJunkFromGamespecs(gamespecs);
  const sorted_junk = sortBy(alljunk, ['seq']);
  if( sorted_junk.length == 0 ) return null;

  const [ updateGame ] = useMutation(UPDATE_GAME_MUTATION);


  const setJunk = async (junk, newValue) => {

    let newGame = getNewGameForUpdate(game);
    if( !newGame || !newGame.holes ) return;

    const gHoleIndex = findIndex(newGame.holes, {hole: hole.hole});
    if( gHoleIndex < 0 ) return;
    let newHole = Object.assign({}, newGame.holes[gHoleIndex]);

    const newTeams = newHole.teams.map(t => {
      return setTeamJunk(t, junk, newValue.toString(), pkey);
    });
    newHole = {
      ...newHole,
      teams: newTeams,
    };

    newGame.holes[gHoleIndex] = newHole;

    const { loading, error, data } = await updateGame({
      variables: {
        gkey: gkey,
        game: newGame,
      },
      update: (cache, { data: { updateGame } }) => {
        console.log('cache data', cache.data);
/*
        updateGameTeamsCache({
          cache,
          gkey,
          holes: newGame.holes,
        });
*/
        // read game from cache
        const { getGame } = cache.readQuery({
          query: GET_GAME_QUERY,
          variables: {
            gkey: gkey,
          },
        });
        // create new game to write back
        const newG = cloneDeep(getGame);
        const h = findIndex(newGame.holes, {hole: hole.hole});
        newG.holes[h] = newHole;
        //write back to cache
        cache.writeQuery({
          query: GET_GAME_QUERY,
          variables: {
            gkey: gkey,
          },
          data: {
            getGame: newG
          },
        });
      },
    });

    if( error ) console.log('Error updating game - holeJunk', error);

  };


  const renderJunk = junk => {

    // TODO: junk.name needs l10n, i18n - use junk.name as slug
    let type = 'outline';
    let color = blue;

    // don't show team junk here
    if( junk.show_in == 'team' ) return null;

    // TODO: are all junk true/false?
    const val = getJunk(junk.name, pkey, game, hole.hole);
    let selected = (val && (val == true || val == 'true')) ? true : false;

    // if junk shouldn't be rendered except if a condition is achieved, then
    // return null
    if( junk.show_in == 'score' ) {

      const based_on = junk.based_on || 'gross';
      let s = get_score_value('gross', score);
      if( based_on == 'net' ) {
        s = get_net_score(s, score);
      }

      if( !junk.score_to_par ) {
        console.log(`Invalid game setup.  Junk '${junk.name}' doesn't have
        'score_to_par' set properly.`);
      }

      const j = isScoreToParJunk(junk, s, par);
      if( j ) {
        selected = true;
      } else {
        // condition not achieved, so return null;
        return null;
      }


    }


    if( selected ) {
      type = 'solid';
      color = 'white';
    }

    return (
      <Button
        title={junk.name}
        icon={
          <Icon
            style={styles.icon}
            name={junk.icon}
            size={20}
            color={color}
          />}
        type={type}
        buttonStyle={styles.button}
        titleStyle={styles.buttonTitle}
        onPress={() => {
          // only set in DB if junk is based on user input
          if( junk.based_on == 'user') setJunk(junk, !selected);
        }}
      />
    );

  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal={true}
        data={sorted_junk}
        renderItem={({item}) => renderJunk(item)}
      />
    </View>
  );
};

export default HoleJunk;


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  icon: {
    padding: 5,
  },
  button: {
    padding: 2,
    marginRight: 5,
    borderColor: blue,
  },
  buttonTitle: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 13,
  },
});
