'use strict';

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Mutation, withApollo } from 'react-apollo';
import gql from 'graphql-tag';
import moment from 'moment';

import { baseUrl } from 'common/config';
import GameNav from 'features/games/gamenav';
import { postScore } from 'features/rounds/graphql';


const ToggleHole = ({round_id, hole, type, gotit}) => {
  const gotitStyle = gotit ? styles.yes : styles.no;
  const gotitTextStyle = gotit ? styles.yesText : styles.noText;

  return (
    <Mutation
      mutation={postScore}
      update={
        (cache, { data: { postScore } }) => {
          console.log('postScore update - cache', cache);
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

class BirdieEmAllScore extends React.Component {

  constructor(props) {
    super(props);
    this.scorecard = this.scorecard.bind(this);
  }

  scorecard() {
    const { player, round_id, score, courseHoles } = this.props;

    return (
      <View style={styles.ninesContainer}>
        {
          courseHoles.map((nine, i) => (
            <View key={i} style={styles.nine}>
              {
                nine.map(hole => {
                  const gotit = (score.holes.indexOf(hole) >= 0);
                  return (
                    <ToggleHole
                      key={hole}
                      round_id={round_id}
                      hole={hole}
                      type='birdie'
                      gotit={gotit}
                    />
                  );
                })
              }
            </View>
          ))
        }
      </View>
    );
  }

  render() {
    const { player } = this.props;
    return (
      <View>
        <GameNav
          title={player.name}
          showBack={true}
          showScore={false}
        />
        <View style={styles.cardContainer}>
          {this.scorecard()}
        </View>
      </View>
    );
  }
};

export default withApollo(BirdieEmAllScore);




var styles = StyleSheet.create({
  cardContainer: {
    padding: 15
  },
  ninesContainer: {
    alignItems: 'center'
  },
  nine: {
    flexDirection: 'row',
    paddingBottom: 10
  },
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
