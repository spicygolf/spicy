import React, { useContext } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  ButtonGroup,
  Card,
} from 'react-native-elements';
import { findIndex } from 'lodash';

import { GameContext } from 'features/game/gameContext';
import { blue } from 'common/colors';
import TeamChooser from 'common/components/teamChooser';
import { getGamespecKVs } from 'common/utils/game';


const Teams = props => {

  const { game } = useContext(GameContext);
  const teamsFromGamespecs = getGamespecKVs(game, 'teams');
  if( !teamsFromGamespecs.includes(true) ) return null;

  const options = [
    {slug: 'never' , caption: 'Never'  },
    {slug: 'every1', caption: 'Every 1'},
    {slug: 'every3', caption: 'Every 3'},
    {slug: 'every6', caption: 'Every 6'},
  ];

  const updateRotation = selectedIndex => {
    console.log('selectedIndex', options[selectedIndex].slug);

    // TODO: write the slug to the game object with an update mutation

  };

  const getSelected = () => {
    if( !game || !game.scope || !game.scope.teams_rotate ) return null;

    const option = findIndex(options, {slug: game.scope.teams_rotate});
    //console.log('option', option);
    return option;
  };

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
        disabled={[1,2,3]}
        selectedIndex={getSelected()}
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
