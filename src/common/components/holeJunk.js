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
import { sortBy } from 'lodash';

import { GameContext } from 'features/game/gameContext';
import { blue } from 'common/colors';
import { UPDATE_GAME_HOLES_MUTATION } from 'features/game/graphql';
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
  omitTypename,
  setTeamJunk,
} from 'common/utils/game';



const HoleJunk = props => {
  const { hole, score, pkey } = props;
  const par = (hole && hole.par) ? parseFloat(hole.par) : 0.0;

  const { game } = useContext(GameContext);
  const { _key: gkey } = game;

  const { gamespecs } = game;
  const alljunk = getJunkFromGamespecs(gamespecs);
  const sorted_junk = sortBy(alljunk, ['seq']);
  if( sorted_junk.length == 0 ) return null;

  const [ updateGameHoles ] = useMutation(UPDATE_GAME_HOLES_MUTATION);


  const setJunk = async (junk, newValue) => {
    // only set in DB if junk is based on user input
    if( !junk || !junk.based_on || junk.based_on != 'user') return;
    if( !game || !game.holes ) return;

    let newHoles = game.holes.map(h => {
      let newHole = {...h,};
      if( h.hole == hole.hole ) {
        let newTeams = newHole.teams.map(t => {
          return setTeamJunk({...t,}, junk, newValue.toString(), pkey);
        });
        newHole.teams = newTeams;
      }
      return newHole;
    });
    const newHolesWithoutTypes = omitTypename(newHoles);

    const { loading, error, data } = await updateGameHoles({
      variables: {
        gkey: gkey,
        holes: newHolesWithoutTypes,
      },
      optimisticResponse: {
        __typename: 'Mutation',
        updateGameHoles: {
          __typename: 'Game',
          _key: gkey,
          holes: newHoles,
        },
      }
    });

    if( error ) console.log('Error updating game - holeJunk', error);

  };


  const renderJunk = junk => {

    if( junk.show_in == 'none' ) return null;

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
        //console.log(`Invalid game setup.  Junk '${junk.name}' doesn't have
        //'score_to_par' set properly.`);
        return null;
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
        title={junk.disp}
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
        onPress={() => setJunk(junk, !selected)}
        onLongPress={() => setJunk(junk, !selected)}
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
