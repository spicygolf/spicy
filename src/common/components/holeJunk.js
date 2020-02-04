import React, { useContext, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import { GameContext } from 'features/game/gamecontext';



const HoleJunk = props => {

  const { hole, score, rkey } = props;
  const { gamespec } = useContext(GameContext);

  return (
    <View>
      <Text>Prox</Text>
    </View>
  );

};

export default HoleJunk;


const styles = StyleSheet.create({

});
