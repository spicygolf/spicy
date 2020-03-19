import React, { useContext } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Button,
  Icon,
} from 'react-native-elements';
import { cloneDeep, filter, find, findIndex, orderBy } from 'lodash';
import { useMutation } from '@apollo/react-hooks';
import jsonLogic from 'json-logic-js';

import { GET_GAME_QUERY } from 'features/games/graphql';
import { UPDATE_GAME_MUTATION } from 'features/game/graphql';
import { GameContext } from 'features/game/gameContext';
import ScoringWrapper from 'common/utils/ScoringWrapper';
import { isTeamDownTheMost } from 'common/utils/score';
import { getHolesToUpdate } from 'common/utils/teams';
import { red } from 'common/colors';



const TeamMultipliers = props => {

  // add custom operators for logic
  jsonLogic.add_operation('team_down_the_most', isTeamDownTheMost);

  const [ updateGame ] = useMutation(UPDATE_GAME_MUTATION);

  const { team: teamNum, scoring, currentHole } = props;
  const { game, gamespec } = useContext(GameContext);
  const { _key: gkey } = game;
  const h = ( game && game.teams && game.teams.holes ) ?
    find(game.teams.holes, {hole: currentHole}) : {hole: currentHole, teams: []};
  //console.log('h', h);

  const setMultiplier = (mult, newValue) => {

    //console.log('setMultiplier', currentHole, teamNum, mult, newValue);

    let newGame = cloneDeep(game);
    // TODO: these deletes are hacky for the future...
    // maybe just grab the properties we know are in GameInput type
    delete newGame._key;
    delete newGame.rounds;
    delete newGame.players;

    const holesToUpdate = getHolesToUpdate(mult.scope, game.holes, currentHole);
    holesToUpdate.map(h => {
      const holeIndex = findIndex(newGame.teams.holes, {hole: h});
      if( holeIndex < 0 ) console.log('setMultiplier hole does not exist');
      //console.log('holeIndex', holeIndex);

      // if multipliers doesn't exist, create blank
      if( !newGame.teams.holes[holeIndex].multipliers ) {
        newGame.teams.holes[holeIndex].multipliers = [];
      }
      const mults = newGame.teams.holes[holeIndex].multipliers;
      if( newValue && !find(mults, {
        name: mult.name,
        team: teamNum,
        first_hole: currentHole,
      }) ) {
        mults.push({
          name: mult.name,
          team: teamNum,
          first_hole: currentHole,
        });
      }
      if( !newValue && find(mults, {name: mult.name}) ) {
        const newMults = filter(mults, m => (
          !(m.name == mult.name && m.team == teamNum && m.first_hole == currentHole)
        ));
        newGame.teams.holes[holeIndex].multipliers = newMults;
      }

    });

    //console.log('setMultiplier newGame', newGame);

    const { loading, error, data } = updateGame({
      variables: {
        gkey: gkey,
        game: newGame,
      },
      refetchQueries: [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: gkey
        }
      }],
    });


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
    ) {
      selected = true;
      type = 'solid';
      color = 'white';
      bgColor = red;
      if(mult.existing) disabled=true;
    }

    return (
      <Button
        title={mult.name}
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
        onPress={() => {
          if( !mult.existing ) {
            setMultiplier(mult, !selected);
          }
        }}
      />
    );

  };


  const hole = find(scoring.holes, { hole: currentHole });
  if( !hole ) return null;

  const team = find(hole.teams, {team: teamNum});
  if( !team ) return null;

  const team_mults = [];
  // see if we have any mults already working
  h.multipliers.map(hMult => {
    if( hMult.first_hole != currentHole && hMult.team == teamNum ) {
      const existingMult = find(gamespec.multipliers, {name: hMult.name});
      team_mults.push({
        ...existingMult,
        existing: true,
      });
    }
  });

  // add in the user mults for this particular hole
  gamespec.multipliers.map(gsMult => {
    // only give options for multipliers based_on == 'user'
    if( gsMult.based_on != 'user' ) return;

    try {
      const replaced = gsMult.availability.replace(/'/g, '"');
      const availability = JSON.parse(replaced);

      if( jsonLogic.apply(availability, {
        scoring: new ScoringWrapper(scoring, currentHole),
        team: team,
      }) ) {
        team_mults.push(gsMult);
      }
    } catch( e ) {
      console.log('logic error', e);
    }

  });
  console.log('team mults', teamNum, team_mults);
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
    paddingLeft: 10,
    paddingRight: 10,
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
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 13,
  },
});