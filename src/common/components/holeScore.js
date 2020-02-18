import React, { useContext, useEffect, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { useMutation } from '@apollo/react-hooks';

import { get_score_value } from 'common/utils/rounds';
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
  if( !hole ) {
    console.log('no hole', score, rkey);
    return null;
  }

  const gross = get_score_value('gross', score);

  const par = parseInt(hole.par);
  const first = (par - 2 >= 0 ? par - 1 : 0);
  const flatlistRef = useRef(null);

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
    let score_styles = [styles.score_option];
    let hole_score_styles = [styles.hole_score_text];
    if( item.selected ) {
      score_styles.push(styles.score_option_selected);
      hole_score_styles.push(styles.hole_score_text_selected);
    } else {
      score_styles.push(styles.score_option_not_selected);
      hole_score_styles.push(styles.hole_score_text_not_selected);
    }

    return (
      <TouchableHighlight onPress={() => setScore(item)}>
        <View style={score_styles}>
          <Text style={hole_score_styles}>{item.key}</Text>
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
      flatlistRef.current.scrollToIndex({
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
      ref={flatlistRef}
      onScrollToIndexFailed={(e) => {
        console.log('onScrollToIndexFailed e', e);
      }}
    />
  );

};

export default HoleScore;


const styles = StyleSheet.create({
  score_option: {
    paddingTop: 5,
    paddingBottom: 5,
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
    fontSize: 26,
  },
  hole_score_text_selected: {
    color: 'white',
  },
  hole_score_text_not_selected: {
    color: '#111',
  },

});