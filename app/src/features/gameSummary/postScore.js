import { useMutation } from '@apollo/client';
import { getHoles } from 'common/utils/game';
import { get_hole, get_round_for_player, get_score_value } from 'common/utils/rounds';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { POST_ROUND_MUTATION } from 'features/rounds/graphql';
import { reduce } from 'lodash';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Button, Card } from 'react-native-elements';

const PostScore = (props) => {
  const { player, game } = props;
  //console.log('player', player);

  const { currentPlayer } = useContext(CurrentPlayerContext);
  //console.log('currentPlayer', currentPlayer);

  const round = get_round_for_player(game.rounds, player.pkey);
  const totalHoles = getHoles(game).length;
  const [posting, setPosting] = useState();
  const [postRoundToHandicapService] = useMutation(POST_ROUND_MUTATION);

  const calcPosting = (lRound) => {
    return lRound.scores.map((s) => {
      const gross = get_score_value('gross', s);
      const hole = get_hole(s.hole, lRound);
      //console.log('renderHole hole', hole);
      const coursePops = parseFloat(s.coursePops) || 0;
      const net = gross - coursePops;
      const par = parseInt(hole.par, 10);
      const netToPar = net - par;
      //console.log('calcPosting netToPar', netToPar);
      let adjusted = gross;
      let isAdjusted = false;
      if (netToPar > 2) {
        // can't take more than a 'net double' on a hole
        adjusted = adjusted - (netToPar - 2);
        isAdjusted = true;
      }
      return {
        hole,
        gross,
        net,
        par,
        netToPar,
        adjusted,
        isAdjusted,
      };
    });
  };

  const postRound = async (rkey) => {
    const { error } = await postRoundToHandicapService({
      variables: {
        rkey,
        posted_by: currentPlayer.name,
      },
    });

    if (error) {
      // TODO: error component
      console.log('Error posting round to handicap service', error);
    }
  };

  const postRoundButton = () => {
    let ret = null;
    if (round.posting == null) {
      if (player.holesScored < totalHoles) {
        ret = (
          <View>
            <Text>thru {player.holesScored}</Text>
          </View>
        );
      } else {
        ret = (
          <Button
            title="Post Round"
            disabled="true"
            buttonStyle={styles.buttonStyle}
            titleStyle={styles.buttonTitle}
            onPress={() => postRound(round._key)}
          />
        );
      }
    } else if (round.posting && round.posting.success === true) {
      const { date_validated, adjusted_gross_score, posted_by, estimated_handicap } =
        round.posting;
      const dt = moment(date_validated).format('lll');
      ret = (
        <View>
          <Text style={styles.postingTxt}>
            posted: {adjusted_gross_score} trend: {estimated_handicap}
          </Text>
          <Text style={styles.postingTxt}>at: {dt}</Text>
          <Text style={styles.postingTxt}>by: {posted_by}</Text>
        </View>
      );
    } else {
      // posting has failed
      const msgs = round.posting.messages.map((message) => (
        <Text style={[styles.postingTxt, styles.postingError]}>{message}</Text>
      ));
      ret = <View>{msgs}</View>;
    }
    return ret;
  };

  const calcAdjustedTotal = () =>
    reduce(posting, (sum, h) => sum + (parseFloat(h.adjusted) || 0), 0);

  const header = () => (
    <View style={styles.holeContainer}>
      <Text style={styles.hdr}>Hole</Text>
      <Text style={styles.hdr}>Handicap</Text>
      <Text style={styles.hdr}>Gross</Text>
      <Text style={styles.hdr}>Adjusted</Text>
    </View>
  );

  const footer = () => {
    const adjustedTotal = calcAdjustedTotal();
    return (
      <View style={styles.holeContainer}>
        <Text style={styles.hdr}>Totals</Text>
        <Text style={styles.hdr} />
        <View style={styles.hdr}>
          <Text style={styles.grossTxt}>{player.gross}</Text>
        </View>
        <View style={styles.hdr}>
          <Text style={styles.grossTxt}>{adjustedTotal}</Text>
        </View>
      </View>
    );
  };

  const renderHole = ({ item, index }) => {
    return (
      <View style={styles.holeContainer}>
        <View style={styles.hole}>
          <Text style={styles.holeTxt}>{item.hole.hole}</Text>
        </View>
        <View style={styles.hdcp}>
          <Text style={styles.hdcpTxt}>{item.hole.handicap}</Text>
        </View>
        <View style={styles.gross}>
          <Text style={styles.grossTxt}>{item.gross}</Text>
        </View>
        <View style={styles.adjusted}>
          <Text style={[styles.adjustedTxt, item.isAdjusted ? styles.isAdjusted : null]}>
            {item.adjusted}
          </Text>
        </View>
      </View>
    );
  };

  useEffect(() => {
    const newPosting = calcPosting(round);
    setPosting(newPosting);
  }, [round]);

  return (
    <Card containerStyle={styles.container} wrapperStyle={styles.wrapper}>
      <View style={styles.playerView}>
        <View style={styles.playerViewTxt}>
          <Text style={styles.playerName}>{player.name}</Text>
          <Text style={styles.courseHandicap}>
            Course Handicap: {player.courseHandicap}
          </Text>
        </View>
        <View style={styles.postRoundButton}>{postRoundButton()}</View>
      </View>
      {header()}
      <View style={styles.flatListView}>
        <FlatList
          contentContainerStyle={styles.flatList}
          data={posting}
          renderItem={renderHole}
          keyExtractor={(item) => item.hole.hole}
        />
      </View>
      {footer()}
    </Card>
  );
};

export default PostScore;

const styles = StyleSheet.create({
  adjusted: {
    flex: 1,
    justifyContent: 'center',
  },
  adjustedTxt: {
    alignSelf: 'center',
    borderColor: 'transparent',
    borderWidth: 1,
    color: '#000',
    fontSize: 12,
    height: 21,
    paddingHorizontal: 15,
    paddingVertical: 2,
    textAlign: 'right',
  },
  buttonStyle: {
    width: 150,
  },
  buttonTitle: {
    fontSize: 14,
  },
  container: {
    flex: 1,
    marginTop: 0,
  },
  courseHandicap: {
    fontSize: 11,
  },
  flatList: {},
  flatListView: {
    flex: 1,
  },
  gross: {
    flex: 1,
    justifyContent: 'center',
    textAlign: 'center',
  },
  grossTxt: {
    alignSelf: 'center',
    fontSize: 12,
  },
  hdcp: {
    flex: 1,
    justifyContent: 'center',
    textAlign: 'center',
  },
  hdcpTxt: {
    alignSelf: 'center',
    color: '#666',
    fontSize: 12,
  },
  hdr: {
    backgroundColor: '#eee',
    color: '#333',
    flex: 1,
    fontSize: 12,
    paddingVertical: 5,
    textAlign: 'center',
  },
  hole: {
    flex: 1,
    justifyContent: 'center',
    textAlign: 'center',
  },
  holeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  holeTxt: {
    alignSelf: 'center',
    color: '#666',
    fontSize: 12,
  },
  isAdjusted: {
    borderColor: '#111',
    borderWidth: 1,
  },
  playerName: {
    fontWeight: 'bold',
  },
  playerView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 5,
  },
  playerViewTxt: {
    flex: 3,
  },
  postRoundButton: {
    alignItems: 'flex-end',
    flex: 4,
  },
  postingError: {
    color: 'red',
    fontWeight: 'bold',
  },
  postingTxt: {
    fontSize: 10,
  },
  wrapper: {
    flex: 1,
  },
});
