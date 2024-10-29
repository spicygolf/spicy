import { useMutation } from '@apollo/client';
import { POST_SCORE_MUTATION, ROUND_FRAGMENT } from 'features/rounds/graphql';
import { find } from 'lodash';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const ToggleHole = ({ round_id, hole, type, gotit, updateCache }) => {
  const [postScore] = useMutation(POST_SCORE_MUTATION);

  const toggle = async () => {
    const { data, loading, error, cache } = await postScore({
      variables: {
        rkey: round_id,
        score: {
          hole: hole,
          values: [
            {
              k: type,
              v: !gotit,
              ts: '', // TODO: replace moment with date-fns: moment.utc().format(),
            },
          ],
        },
      },
    });

    /*
     // TODO: this was part of react-apollo removal, but was not fully
     //       refactored, as it's not being used.
     // Check previous revision to see how Mutation object was being used.
     // This commented code below has two different `scores` vars that were in
     // two different functions/areas of Mutation object.

    //console.log('update cache', cache._queryable._snapshot);
    // read existing score fragment
    const { scores } = cache.readFragment({
      id: postScore._key,
      fragment: ROUND_FRAGMENT,
    });
    // update scores
    const newScores = updateCache(scores);
    // write updated score fragment
    // TODO: inspect result from writeFragment and handle?
    cache.writeFragment({
      id: postScore._key,
      fragment: ROUND_FRAGMENT,
      data: {
        _key: postScore._key,
        scores: newScores,
      },
    });

    //if( loading ) console.log('loading');
    if (error) {
      console.log('error', error);
    }
    if (data && data.postScore) {
      // requery fragment after a mutation
      const { scores } = cache.readFragment({
        id: round_id,
        fragment: ROUND_FRAGMENT,
      });
      const h = find(scores, { hole: hole });
      if (h) {
        const v = find(h.values, { k: type });
        if (v) {
          gotit = v.v;
        }
      }
    }
    */
  };

  const gotitStyle = gotit ? styles.yes : styles.no;
  const gotitTextStyle = gotit ? styles.yesText : styles.noText;

  return (
    <View style={[styles.hole, gotitStyle]}>
      <TouchableOpacity onPress={() => toggle()}>
        <Text style={[styles.holeText, gotitTextStyle]}>{hole}</Text>
      </TouchableOpacity>
    </View>
  );
};

var styles = StyleSheet.create({
  hole: {
    flex: 1,
    margin: 3,
  },
  holeText: {
    fontSize: 20,
    textAlign: 'center',
  },
  no: {
    borderColor: '#aaa',
    borderWidth: 1,
  },
  noText: {
    color: '#aaa',
  },
  yes: {
    borderColor: '#000',
    borderWidth: 2,
  },
  yesText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
