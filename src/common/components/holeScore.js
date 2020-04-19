import React, { useContext, useEffect, useRef } from 'react';
import {
  FlatList,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { useMutation, gql } from '@apollo/client';
import { cloneDeep, findIndex } from 'lodash';

import { get_score_value, get_net_score } from 'common/utils/rounds';
import { upsertScore } from 'common/utils/score';
import { blue } from 'common/colors';
import { POST_SCORE_MUTATION } from 'features/rounds/graphql';
import { GameContext } from 'features/game/gameContext';
import { GET_GAME_QUERY } from 'features/game/graphql';

const circle_blk = require('../../../assets/img/circle_blk.png');
const circle_wht = require('../../../assets/img/circle_wht.png');
const square_blk = require('../../../assets/img/square_blk.png');
const square_wht = require('../../../assets/img/square_wht.png');




const HoleScore = props => {

  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const { hole, score, rkey } = props;

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
  //console.log('holeScore score', score);
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
    //console.log('item', item);
    let score_styles = [styles.score_option];
    let hole_score_styles = [styles.hole_score_text];
    let src = null;

    if( item.selected ) {
      score_styles.push(styles.score_option_selected);
      hole_score_styles.push(styles.hole_score_text_selected);
      if( item.toPar == -1 ) src = circle_wht;
      if( item.toPar == 1 ) src = square_wht;
    } else {
      score_styles.push(styles.score_option_not_selected);
      hole_score_styles.push(styles.hole_score_text_not_selected);
      if( item.toPar == -1 ) src = circle_blk;
      if( item.toPar == 1 ) src = square_blk;
    }

    let content = (
      <Text style={hole_score_styles}>{item.key}</Text>
    );

    if( score.pops && score.pops != '0' ) {
      const net = get_net_score(item.key, score);
      content = (
        <Text style={[hole_score_styles, styles.pop_text]}>
          {item.key}/{net}
        </Text>
      );
    }

    return (
      <TouchableHighlight onPress={() => setScore(item)}>
        <View style={score_styles}>
          <ImageBackground
            source={src}
            style={styles.imgBg}
          >
              { content }
          </ImageBackground>
        </View>
      </TouchableHighlight>
    )
  };

  const setScore = (item) => {
    if( item.key == gross ) return; // no change in score, so do nothing
    const { key:newGross } = item;
    const newScore = upsertScore(score, newGross);

    const { loading, error, data } = postScore({
      variables: {
        round: rkey,
        score: newScore,
      },
      update: (cache, { data: { postScore } }) => {
        // read game from cache
        const { getGame } = cache.readQuery({
          query: GET_GAME_QUERY,
          variables: {
            gkey: gkey,
          },
        });
        // create new game to write back
        const newGame = cloneDeep(getGame);
        const r = findIndex(newGame.rounds, {_key: rkey});
        const h = findIndex(newGame.rounds[r].scores, {hole: hole.hole});
        newGame.rounds[r].scores[h].values = postScore.values;
        //write back to cache
        cache.writeQuery({
          query: GET_GAME_QUERY,
          variables: {
            gkey: gkey,
          },
          data: {
            getGame: newGame
          },
        });
      },
    });

  };

  const _scrollTo = index => {
    if( !index || !flatlistRef || !flatlistRef.current ) return;
    flatlistRef.current.scrollToIndex({
      index: index,
      viewPosition: 0.5,
    });
  };

  // after component has rendered, either center 'par' or player's gross score
  useEffect(
    () => {
      //console.log('gross', gross, 'first', first);
      const index = gross ? parseInt(gross) - 1 : first;
      _scrollTo(index);
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
        // this horrible hack seems to fix #15
        setTimeout(() => _scrollTo(e.index), 250);
      }}
    />
  );

};

export default HoleScore;


const styles = StyleSheet.create({
  score_option: {
    width: 40,
    height: 40,
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
  imgBg: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  }
});