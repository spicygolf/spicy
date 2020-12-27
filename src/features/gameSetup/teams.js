import React, { useContext } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import {
  ButtonGroup,
  Card,
} from 'react-native-elements';
import { useMutation } from '@apollo/client';
import { cloneDeep, findIndex } from 'lodash';

import { UPDATE_GAME_SCOPE_MUTATION } from 'features/game/graphql';
import { GameContext } from 'features/game/gameContext';
import { blue } from 'common/colors';
import TeamChooser from 'common/components/teamChooser';
import {
  getGamespecKVs,
  omitTypename,
  teamsRotateOptions,
} from 'common/utils/game';



const Teams = props => {

  const { game } = useContext(GameContext);
  const [ updateGameScope ] = useMutation(UPDATE_GAME_SCOPE_MUTATION);

  const teamsFromGamespecs = getGamespecKVs(game, 'teams');
  if( !teamsFromGamespecs.includes(true) ) return null;

  const updateRotation = async selectedIndex => {
    if( !game || !game.scope ) return;

    //console.log('selectedIndex', teamsRotateOptions[selectedIndex].slug);
    let newScope = cloneDeep(game.scope);
    newScope.teams_rotate = teamsRotateOptions[selectedIndex].slug;
    const newScopeWithoutTypes = omitTypename(newScope);

    const { loading, error, data } = await updateGameScope({
      variables: {
        gkey: game._key,
        scope: newScopeWithoutTypes,
      },
      optimisticResponse: {
        __typename: 'Mutation',
        updateGameScope: {
          __typename: 'Game',
          _key: game._key,
          scope: newScope,
        },
      }
    });

    if( error ) console.log('Error updating game scope - gameSetup teams', error);
  };

  let selected = -1;
  if( game  && game.scope && game.scope.teams_rotate ) {
    selected = findIndex(teamsRotateOptions, {slug: game.scope.teams_rotate});
  }

  const buttons = teamsRotateOptions.map(o => o.caption);

  let chooser = null;

  if( game && game.scope && game.scope.teams_rotate && game.scope.teams_rotate == 'never' ) {
    chooser = (
      <View style={styles.chooserView}>
        <Text>Choose Teams:</Text>
        <TeamChooser currentHole='1' from='game_setup' />
      </View>
    );
  }

  return (
    <View testID='game_setup_teams_card'>
    <Card>
      <Card.Title>Teams</Card.Title>
      <Card.Divider />
      <Text>Teams Rotate:</Text>
      <ButtonGroup
        buttons={buttons}
        selectedIndex={selected}
        onPress={updateRotation}
        textStyle={styles.textStyle}
        selectedButtonStyle={styles.selectedButton}
        selectedTextStyle={styles.selectedText}
      />
      { chooser }
    </Card>
    </View>
  );

};

export default Teams;


const styles = StyleSheet.create({
  buttonView: {
    alignItems: 'center',
  },
  textStyle: {
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  selectedButton: {
    backgroundColor: blue,
  },
  selectedText: {
    color: 'white',
  },
  chooserView: {
    paddingTop: 20,
  }
});
