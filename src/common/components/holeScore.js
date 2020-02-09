import React, { useContext, useEffect } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { useMutation } from '@apollo/react-hooks';

import { get_gross } from 'common/utils/rounds';
import { upsertScore } from 'common/utils/upsertScore';
import { blue } from 'common/colors';
import { GET_GAME_QUERY } from 'features/games/graphql';
import { POST_SCORE_MUTATION } from 'features/rounds/graphql';
import { GameContext } from 'features/game/gameContext';



const HoleScore = props => {

  const [ postScore ] = useMutation(POST_SCORE_MUTATION);

  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const { hole, score, rkey } = props;

  // TODO: this is possibly from not having a round linked
  //       maybe the warnings icon in Game Setup tab?
  //
  // TODO: this also could be because the course/tee has no holes.
  //
  if( !hole ) return null;

  const gross = get_gross(score);

  const par = parseInt(hole.par);
  const first = (par - 2 >= 0 ? par - 1 : 0);
  let flatlistRef;

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
      <TouchableHighlight onPress={() => setScore(item)}>
        <View style={classes}>
          <Text style={styles.hole_score_text}>{item.key}</Text>
        </View>
      </TouchableHighlight>
    )
  };

  const setScore = (item) => {

    const { key:newGross } = item;
    const newScore = upsertScore([score], hole.hole, 'gross', newGross);

    const { loading, error, data } = postScore({
      variables: {
        round: rkey,
        score: newScore[0] || [],
      },
      refetchQueries: [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: gkey
        }
      }],
    });

  };

  // after component has rendered, either center 'par' or player's gross score
  useEffect(
    () => {
      //console.log('gross', gross, 'first', first);
      const index = gross ? parseInt(gross) - 1 : first;
      flatlistRef.scrollToIndex({
        index: index,
        viewPosition: 0.5,
      });
    }
  );

  return (
    <FlatList
      horizontal={true}
      data={score_options}
      renderItem={({item}) => renderScore(item)}
      ref={(ref => flatlistRef = ref)}
      onScrollToIndexFailed={(e) => {
        console.log('onScrollToIndexFailed e', e);
      }}
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