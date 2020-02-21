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

import { GameContext } from 'features/game/gameContext';
import { blue } from 'common/colors';



const Teams = props => {

  const { game } = useContext(GameContext);

  const never = () => (<Text>Never</Text>);
  const every1 = () => (
    <View style={styles.buttonView}>
      <Text>Every</Text>
      <Text>Hole</Text>
    </View>
  );
  const every3 = () => (
    <View style={styles.buttonView}>
      <Text>Every</Text>
      <Text>3 Holes</Text>
    </View>
  );
  const every6 = () => (
    <View style={styles.buttonView}>
      <Text>Every</Text>
      <Text>6 Holes</Text>
    </View>
  );
  const buttons = [
    {element: never},
    {element: every1},
    {element: every3},
  ];
  if( game.holes == 'all18' ) buttons.push({element: every6});

  return (
    <Card title='Teams'>
      <Text>Teams Rotate:</Text>
      <ButtonGroup
        buttons={buttons}
        textStyle={styles.buttonText}
      />
    </Card>
  );

};

export default Teams;


const styles = StyleSheet.create({
  buttonView: {
    alignItems: 'center',
  },
});
