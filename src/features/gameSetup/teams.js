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
} from 'common/utils/game';



const Teams = props => {

  const { game } = useContext(GameContext);
  const [ updateGameScope ] = useMutation(UPDATE_GAME_SCOPE_MUTATION);

  const teamsFromGamespecs = getGamespecKVs(game, 'teams');
  if( !teamsFromGamespecs.includes(true) ) return null;

  const options = [
    {slug: 'never' , caption: 'Never'  },
    {slug: 'every1', caption: 'Every 1'},
    {slug: 'every3', caption: 'Every 3'},
    {slug: 'every6', caption: 'Every 6'},
  ];

  const updateRotation = async selectedIndex => {
    if( !game || !game.scope ) return;

    //console.log('selectedIndex', options[selectedIndex].slug);
    let newScope = cloneDeep(game.scope);
    newScope.teams_rotate = options[selectedIndex].slug;
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
    selected = findIndex(options, {slug: game.scope.teams_rotate});
  }

  const buttons = options.map(o => o.caption);

  let chooser = null;

  if( game && game.scope && game.scope.teams_rotate && game.scope.teams_rotate == 'never' ) {
    chooser = (
      <View style={styles.chooserView}>
        <Text>Choose Teams:</Text>
        <TeamChooser currentHole="1" />
      </View>
    );
  }

  return (
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
