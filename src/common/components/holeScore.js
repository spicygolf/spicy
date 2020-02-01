import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { blue } from 'common/colors';



const HoleScore = props => {

  const { hole, gross } = props;
  const par = parseInt(hole.par);
  const first = (par - 2 >= 0 ? par - 2 : 0);

  // populate array of score options
  let score_options = [];
  for( let i = 1; i < 20; i++) {
    score_options.push({
      key: i.toString(),
      toPar: i - par,
      selected: (i == gross),
    })
  }


  const renderScore = item => {
    //console.log('item', item);
    let classes = [styles.score_option];
    if( item.selected ) {
      classes.push(styles.score_option_selected);
    } else {
      classes.push(styles.score_option_not_selected);
    }

    return (
      <View style={classes}>
        <Text style={styles.hole_score_text}>{item.key}</Text>
      </View>
    )
  };

  return (
    <FlatList
      horizontal={true}
      data={score_options}
      renderItem={({item}) => renderScore(item)}
      initialScrollIndex={first}
    />
  );

};

export default HoleScore;


const styles = StyleSheet.create({
  score_option: {
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 15,
    paddingRight: 15,
  },
  score_option_selected: {
    backgroundColor: blue,
  },
  score_option_not_selected: {
    backgroundColor: '#ddd',
  },
  hole_score_text: {
    fontSize: 30,
  },

});