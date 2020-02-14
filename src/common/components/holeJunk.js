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
import { sortBy } from 'lodash';

import { GameContext } from 'features/game/gameContext';
import { blue } from 'common/colors';
import { get_score_value } from 'common/utils/rounds';



const HoleJunk = props => {

  const { gamespec } = useContext(GameContext);
  const { junk } = gamespec;
  if( !junk ) return null;

  const sorted_junk = sortBy(junk, ['seq']);

  const { hole, score, rkey } = props;

  const setJunk = (junk, selected) => {
    console.log('setJunk', hole, score, rkey, junk, selected);
  };

  const renderJunk = junk => {

    // TODO: junk.name needs l10n, i18n - use junk.name as slug
    let type = 'outline';
    let color = blue;

    const val = get_score_value(junk.name, score);
    const selected = (val && val.v && val.v == true) ? true : false;
    if( selected ) {
      type = 'solid';
      color = 'white';
    }

    return (
      <Button
        title={junk.name}
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
        onPress={() => setJunk(junk)}
      />
    );

  };

  return (
    <View>
      <FlatList
        horizontal={true}
        data={sorted_junk}
        renderItem={({item}) => renderJunk(item)}
        keyExtractor={item => item.name}
      />
    </View>
  );
};

export default HoleJunk;


const styles = StyleSheet.create({
  icon: {
    padding: 5,
  },
  button: {
    padding: 2,
    borderColor: blue,
  },
  buttonTitle: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 13,
  }
});
