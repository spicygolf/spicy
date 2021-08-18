'use strict';

import { gql } from '@apollo/client';
import { POST_SCORE_MUTATION, ROUND_FRAGMENT } from 'features/rounds/graphql';
import { find } from 'lodash';
import moment from 'moment';
import React from 'react';
import { Mutation } from 'react-apollo';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const ToggleHole = ({ round_id, hole, type, gotit, updateCache }) => {
  return (
    <Mutation
      mutation={POST_SCORE_MUTATION}
      update={(cache, { data: { postScore } }) => {
        //console.log('update cache', cache._queryable._snapshot);
        // read existing score fragment
        const { scores } = cache.readFragment({
          id: postScore._key,
          fragment: ROUND_FRAGMENT,
        });
        // update scores
        const newScores = updateCache(scores);
        // write updated score fragment
        let res = cache.writeFragment({
          id: postScore._key,
          fragment: ROUND_FRAGMENT,
          data: {
            _key: postScore._key,
            scores: newScores,
          },
        });
      }}
    >
      {(postScore, { loading, error, data, client }) => {
        //if( loading ) console.log('loading');
        if (error) console.log('error', error);
        if (data && data.postScore) {
          // requery fragment after a mutation
          const { scores } = client.cache.readFragment({
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

        const gotitStyle = gotit ? styles.yes : styles.no;
        const gotitTextStyle = gotit ? styles.yesText : styles.noText;

        return (
          <View style={[styles.hole, gotitStyle]}>
            <TouchableOpacity
              onPress={() =>
                postScore({
                  variables: {
                    rkey: round_id,
                    score: {
                      hole: hole,
                      values: [
                        {
                          k: type,
                          v: !gotit,
                          ts: moment.utc().format(),
                        },
                      ],
                    },
                  },
                })
              }
            >
              <Text style={[styles.holeText, gotitTextStyle]}>{hole}</Text>
            </TouchableOpacity>
          </View>
        );
      }}
    </Mutation>
  );
};

var styles = StyleSheet.create({
  hole: {
    margin: 3,
    flex: 1,
  },
  yes: {
    borderColor: '#000',
    borderWidth: 2,
  },
  no: {
    borderColor: '#aaa',
    borderWidth: 1,
  },
  holeText: {
    textAlign: 'center',
    fontSize: 20,
  },
  yesText: {
    color: '#000',
    fontWeight: 'bold',
  },
  noText: {
    color: '#aaa',
  },
});
