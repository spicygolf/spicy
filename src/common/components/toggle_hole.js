'use strict';

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import moment from 'moment';

import { POST_SCORE_MUTATION, roundFragment } from 'features/rounds/graphql';


export const ToggleHole = ({round_id, hole, type, gotit, updateCache}) => {
  const gotitStyle = gotit ? styles.yes : styles.no;
  const gotitTextStyle = gotit ? styles.yesText : styles.noText;

  return (
    <Mutation
      mutation={POST_SCORE_MUTATION}
      update={
        (cache, { data: { postScore } }) => {
          console.log('update cache', cache._queryable._snapshot);
          // read existing score fragment
          const { scores } = cache.readFragment({
            id: postScore._key,
            fragment: roundFragment
          });
          // update scores
          const newScores = updateCache(scores);
          // write updated score fragment
          let res = cache.writeFragment({
            id: postScore._key,
            fragment: roundFragment,
            data: {
              _key: postScore._key,
              scores: newScores
            }
          });
        }
      }
    >
      {(postScore, { loading, error, data }) => {
        if( loading ) console.log('loading');
        if( error ) console.log('error', error);
        if( data && data.postScore ) {
          //console.log('mutation', data.postScore);
        }
        return (
          <View style={[styles.hole, gotitStyle]}>
            <TouchableOpacity
              onPress={() => postScore({
                variables: {
                  round: round_id,
                  score: {
                    hole: hole,
                    values: [{
                      k: type,
                      v: !gotit,
                      ts: moment.utc().format()
                    }]
                  }
                }
              })
            }
            >
              <Text style={[styles.holeText, gotitTextStyle]}>{hole}</Text>
            </TouchableOpacity>
          </View>
        )
      }}
    </Mutation>
  );

}

var styles = StyleSheet.create({
  hole: {
    margin: 3,
    flex: 1
  },
  yes: {
    borderColor: '#000',
    borderWidth: 2
  },
  no: {
    borderColor: '#aaa',
    borderWidth: 1
  },
  holeText: {
    textAlign: 'center',
    fontSize: 20
  },
  yesText: {
    color: '#000',
    fontWeight: 'bold'
  },
  noText: {
    color: "#aaa"
  }
});
