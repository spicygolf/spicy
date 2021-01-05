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
import { cloneDeep, filter, find, findIndex, orderBy } from 'lodash';
import { useMutation } from '@apollo/client';

import { UPDATE_GAME_HOLES_MUTATION } from 'features/game/graphql';
import { GameContext } from 'features/game/gameContext';
import ScoringWrapper from 'common/utils/ScoringWrapper';
import {
  getHolesToUpdate,
  omitTypename,
  teamsRotate,
} from 'common/utils/game';
import { getMultipliersFromGamespecs } from 'common/utils/score';
import { red } from 'common/colors';



const TeamMultipliers = props => {

  const [ updateGameHoles ] = useMutation(UPDATE_GAME_HOLES_MUTATION);

  const { team: teamNum, scoring, currentHole } = props;
  const { game } = useContext(GameContext);
  const { gamespecs } = game;
  const allmultipliers = getMultipliersFromGamespecs(gamespecs);

  const scoringWrapper = new ScoringWrapper(game, scoring, currentHole);

  const { _key: gkey } = game;
  const h = ( game && game.holes ) ?
    find(game.holes, {hole: currentHole}) : {hole: currentHole, teams: []};
  //console.log('h', h);

  const setMultiplier = async (mult, newValue) => {
    // only set in DB if junk is based on user input
    if( mult.based_on != 'user' ) return;
    // achieved so no press action
    if( mult.existing ) return;

    if( !game || !game.holes ) return;

    let holesToUpdate = getHolesToUpdate(mult.scope, game, currentHole);

    let newHoles = cloneDeep(game.holes);
    holesToUpdate.map(h => {
      const holeIndex = findIndex(newHoles, {hole: h});
      if( holeIndex < 0 ) console.log('setMultiplier hole does not exist');
      //console.log('holeIndex', holeIndex);

      // if multipliers doesn't exist, create blank
      if( !newHoles[holeIndex].multipliers ) {
        newHoles[holeIndex].multipliers = [];
      }
      const mults = newHoles[holeIndex].multipliers;
      if( newValue && !find(mults, {
        __typename: 'Multiplier',
        name: mult.name,
        team: teamNum,
        first_hole: currentHole,
      }) ) {
        mults.push({
          __typename: 'Multiplier',
          name: mult.name,
          team: teamNum,
          first_hole: currentHole,
        });
      }
      if( !newValue && find(mults, {name: mult.name}) ) {
        const newMults = filter(mults, m => (
          !(m.name == mult.name && m.team == teamNum && m.first_hole == currentHole)
        ));
        //console.log('newMults', newMults);
        newHoles[holeIndex].multipliers = newMults;
      }

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

    if( error ) console.log('Error updating game - teamMultipliers', error);


  };

  const renderMultiplier = mult => {

    //console.log('renderMultiplier', mult);

    // TODO: mult.name needs l10n, i18n - use mult.name as slug
    let type = 'outline';
    let color = red;
    let bgColor = null;

    let selected = false;
    let disabled = false;
    if(
      h &&
      h.multipliers &&
      find(h.multipliers, {
        name: mult.name,
        team: teamNum,
        first_hole: currentHole
      })
      ||
      mult.existing
      || mult.based_on != 'user' // show selected, because this one was achieved
    ) {
      selected = true;
      type = 'solid';
      color = 'white';
      bgColor = red;
      if(mult.existing) disabled=true;
    }

    return (
      <Button
        title={mult.disp}
        icon={
          <Icon
            style={styles.icon}
            name={mult.icon}
            size={20}
            color={color}
          />}
        type={type}
        buttonStyle={[styles.button, {backgroundColor: bgColor}]}
        titleStyle={[styles.buttonTitle, {color: color}]}
        disabled={disabled}
        onPress={() => setMultiplier(mult, !selected)}
        onLongPress={() => setMultiplier(mult, !selected)}
      />
    );

  };

  // no pressing if teams rotate - rethink this? There are degenerates out there
  if( teamsRotate(game) ) return null;

  const hole = find(scoring.holes, { hole: currentHole });
  if( !hole ) return null;

  const team = find(hole.teams, {team: teamNum});
  if( !team ) return null;

  const team_mults = [];
  // see if we have any mults already working from previous holes
  if( h && h.multipliers ) {
    h.multipliers.map(hMult => {
      if( hMult.first_hole != currentHole && hMult.team == teamNum ) {
        const existingMult = find(allmultipliers, {name: hMult.name});
        team_mults.push({
          ...existingMult,
          existing: true,
        });
      }
    });
  }

  // add in the user mults for this particular hole
  allmultipliers.map(gsMult => {
    // only give options for multipliers based_on == 'user' or if they were
    // achieved via scoring or logic
    if( gsMult.based_on != 'user' ) {
      hole.multipliers.map(hMult => {
        if( hMult.name == gsMult.name && hMult.team == teamNum ) {
          team_mults.push(gsMult);
        }
      });
      return;
    }

    try {
      const replaced = gsMult.availability.replace(/'/g, '"');
      const availability = JSON.parse(replaced);
      if( scoringWrapper.logic(availability, {team: team}) ) {
        team_mults.push(gsMult);
      }
    } catch( e ) {
      console.log('logic error', e);
    }

  });
  //console.log('team mults', teamNum, team_mults);
  const sorted_mults = orderBy(team_mults, ['seq'], ['asc']);
  //console.log('sorted_mults', sorted_mults);
  if( sorted_mults.length == 0 ) return null;

  return (
    <View style={styles.container}>
      <FlatList
        horizontal={true}
        data={sorted_mults}
        renderItem={({item}) => renderMultiplier(item)}
        keyExtractor={_ => Math.random().toString()}
      />
    </View>
  );
};

export default TeamMultipliers;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 5,
    paddingBottom: 5,
    paddingHorizontal: 5,
  },
  icon: {
    padding: 5,
  },
  button: {
    padding: 2,
    marginLeft: 5,
    borderColor: red,
  },
  buttonTitle: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingRight: 10,
    fontSize: 13,
  },
});