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



const Teams = props => {

  const { game } = useContext(GameContext);

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
    if( !game || !game.teams || !game.teams.rotate ) return null;

    const option = findIndex(options, {slug: game.teams.rotate});
    //console.log('option', option);
    return option;
  };

  const buttons = options.map(o => o.caption);

  return (
    <Card title='Teams'>
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
});
