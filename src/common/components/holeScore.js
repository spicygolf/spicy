import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { useMutation, gql } from '@apollo/client';

import useAppState from 'hooks/useAppState';
import { omitTypename } from 'common/utils/game';
import {
  get_score_value,
  get_net_score,
} from 'common/utils/rounds';
import { upsertScore } from 'common/utils/score';
import { shapeStyles } from 'common/utils/styles';
import { blue } from 'common/colors';
import { POST_SCORE_MUTATION } from 'features/rounds/graphql';



const scoreSize = 40;

const HoleScore = props => {

  const { hole, score, rkey, test } = props;
  // some testing things
  const { team, player_index } = test;
  const h = hole.hole;

  const { justBecameActive } = useAppState();

  const [ postScore ] = useMutation(POST_SCORE_MUTATION);

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
  //console.log('holeScore score', hole, score);
  //const net = get_net_score(gross, score);

  const par = parseInt(hole.par);
  const first = (par - 2 >= 0 ? par - 1 : 0);
  const flatlistRef = useRef(null);

  // populate array of score options
  let score_options = [];
  for( let i = 1; i < 13; i++) {
    score_options.push({
      key: i.toString(),
      toPar: i - par,
      selected: (i == gross),
    })
  }

  const renderScore = item => {

    //console.log('renderScore item', item);
    let score_styles = [styles.score_option];
    let hole_score_styles = [styles.hole_score_text];
    let size = scoreSize - 2;
    let color = 'transparent';
    let outerShape = shapeStyles(size, color).none;
    let innerShape = shapeStyles(size-5, color).none;

    if( item.selected ) {
      score_styles.push(styles.score_option_selected);
      hole_score_styles.push(styles.hole_score_text_selected);
      color = 'white';
    } else {
      score_styles.push(styles.score_option_not_selected);
      hole_score_styles.push(styles.hole_score_text_not_selected);
      color = 'black';
    }
    if( item.toPar == -2 ) {  // eagle
      innerShape = shapeStyles(size-5, color).circle;
      outerShape = shapeStyles(size,   color).circle;
    }
    if( item.toPar == -1 ) {  // birdie
      outerShape = shapeStyles(size,   color).circle;
    }
    if( item.toPar ==  1 ) {  // bogey
      outerShape = shapeStyles(size,   color).square;
    }
    if( item.toPar ==  2 ) {  // double bogey
      innerShape = shapeStyles(size-5, color).square;
      outerShape = shapeStyles(size,   color).square;
    }

    let content = (
      <Text style={hole_score_styles}>{item.key}</Text>
    );

    if( score && score.pops && score.pops != '0' ) {
      const net = get_net_score(item.key, score);
      content = (
        <Text style={[hole_score_styles, styles.pop_text]}>
          {item.key}/{net}
        </Text>
      );
    }
    const testID=`h_${h}_t_${team}_p_${player_index+1}_s_${item.key}`;
    //console.log('testID', testID);
    return (
      <TouchableHighlight
        onPress={() => setScore(item)}
        onLongPress={() => setScore(item)}
        testID={testID}
      >
        <View style={score_styles}>
          <View style={outerShape}>
            <View style={innerShape}>
              { content }
            </View>
          </View>
        </View>
      </TouchableHighlight>
    )
  };

  const setScore = async (item) => {
    if( item.key == gross ) return; // no change in score, so do nothing
    const { key:newGross } = item;
    let newScore = upsertScore(score, newGross);
    const newScoreWithoutTypes = omitTypename(newScore);

    const { loading, error, data } = await postScore({
      variables: {
        rkey: rkey,
        score: newScoreWithoutTypes,
      },
      optimisticResponse: {
        __typename: 'Mutation',
        postScore: {
          __typename: 'Round',
          _key: rkey,
          scores: [newScore],
        },
      },
    });
    if( error ) console.log('Error posting score - holeScore', error);
  };

  const scroll = () => {
    const index = gross ? parseInt(gross) - 1 : first;
    if( !index || !flatlistRef || !flatlistRef.current ) return;
    flatlistRef.current.scrollToIndex({
      index: index,
      viewPosition: 0.5,
    });
  };

  // after component has rendered, either center 'par' or player's gross score
  useEffect( () => scroll() );
    // also scroll/center after device becomes active again
  useEffect( () => scroll(), [ justBecameActive ] );

  return (
    <FlatList
      horizontal={true}
      data={score_options}
      renderItem={({item}) => renderScore(item)}
      ref={flatlistRef}
      onStartShouldSetPanResponderCapture={(evt, gestureState) => false}
      onScrollToIndexFailed={(e) => {
        console.log('onScrollToIndexFailed e', e);
        // this horrible hack seems to fix #15
        setTimeout(() => scroll(), 250);
      }}
    />
  );

};

export default HoleScore;


const styles = StyleSheet.create({
  score_option: {
    width: scoreSize,
    height: scoreSize,
    padding: 1,
  },
  score_option_selected: {
    backgroundColor: blue,
  },
  score_option_not_selected: {
    backgroundColor: '#ddd',
  },
  touchable: {
    height: '100%',
    width: '100%',
  },
  hole_score_text: {
    fontSize: 24,
  },
  hole_score_text_selected: {
    color: 'white',
  },
  hole_score_text_not_selected: {
    color: '#111',
  },
  pop_text: {
    fontSize: 14,
  },
});