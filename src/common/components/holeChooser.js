import React, { useContext, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from 'react-native-elements';

import { GameContext } from 'features/game/gameContext';



const HoleChooser = ({holes, setHoles, active}) => {

  const { game } = useContext(GameContext);

  const holePressed = (h, on) => {
    let newHoles = [...holes];
    //console.log('hole pressed', h, on, newHoles);
    if( on ) {
      newHoles.push(h);
    } else {
      const i = newHoles.indexOf(h);
      if( i > -1 ) newHoles.splice(i, 1);
    }
    //console.log('newHoles after', newHoles);
    setHoles(newHoles);
  };

  const rowCount = Math.ceil(game.holes.length / 9);
  let rows = Array(rowCount), r=0;
  while(r<rowCount) {
    rows[r] = r;
    r++;
  }
  const rowsContent = rows.map(r => {
    const holeButtons = game.holes.slice(r*9, r*9+9).map(h => {
      const on = holes.includes(h.hole);
      return (
        <Button
          key={h.hole}
          buttonStyle={styles.holeButton}
          title={h.hole}
          type={on ? 'solid' : 'outline'}
          onPress={active ? () => holePressed(h.hole, !on) : () => {}}
        />
      );
    });
    return (<View key={r} style={styles.rowOfHoles}>{ holeButtons }</View>);
  });

  return (
    <View style={styles.previewView}>
      <Text>Preview:</Text>
      { rowsContent }
    </View>
  );
};

export default HoleChooser;


const styles = StyleSheet.create({
  rowOfHoles: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  holeButton: {
    margin: 1,
    minWidth: '10%',
  },
});