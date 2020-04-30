import React, { useContext, useEffect, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Card
} from 'react-native-elements';
import { useMutation } from '@apollo/client';

import GameNav from 'features/games/gamenav';
import { GameContext } from 'features/game/gameContext';
import { UPDATE_LINK_MUTATION } from 'common/graphql/link';
import { GET_GAME_QUERY } from 'features/game/graphql';
import { course_handicap } from 'common/utils/handicap';
import { get_round_for_player } from 'common/utils/rounds';
import { blue } from 'common/colors';

const { width } = Dimensions.get('window')



const EditPlayer = props => {

  const { route } = props;
  const player = (route && route.params && route.params.player) ?
    route.params.player : null;
  const { _key: pkey } = player;

  const { game } = useContext(GameContext);
  const round = get_round_for_player(game.rounds, pkey);

  const initHI = (round && round.handicap_index) ?
    round.handicap_index.toString() : '';
  const [ HI, setHI ] = useState(initHI);
  const initCH = round.course_handicap ? round.course_handicap.toString() : '-';
  const [ CH, setCH ] = useState(initCH);
  const initGH = (round && round.game_handicap) ?
    round.game_handicap.toString() : '';
  const [ GH, setGH ] = useState(initGH);

  const [ updateLink ] = useMutation(UPDATE_LINK_MUTATION);


  const update = () => {
    //console.log('update', HI, initHI, CH, initCH, GH, initGH);
    let doUpdate = false;
    const other = [];

    if( HI != initHI ) {
      other.push({key: 'handicap_index', value: HI});
      doUpdate = true;
    }

    if( CH != initCH ) {
      other.push({key: 'course_handicap', value: CH});
      doUpdate = true;
    }

    if( GH != initGH ) {
      other.push({key: 'game_handicap', value: GH});
      doUpdate = true;
    }

    if( doUpdate ) {
      //console.log('doUpdate');
      // update 'round2game' edge with these two handicaps on them

      const { loading, error, data } = updateLink({
        variables: {
          from: {type: 'round', value: round._key},
          to: {type: 'game', value: game._key},
          other: other,
        },
        refetchQueries: () => [{
          query: GET_GAME_QUERY,
          variables: {
            gkey: game._key
          }
        }],
        awaitRefetchQueries: true,
      });
      if( error ) {
        console.log('error updating round2game', error);
      }
    }

  };

  useEffect(
    () => {
      if( initCH == '-' ) {
        setCH(course_handicap(HI, round.tee, game.scope.holes));
        update();
      }
    }, [CH]
  );

  return (
    <View>
      <GameNav
        title={player.name}
        showBack={true}
        backTo={'GameSetup'}
      />
      <ScrollView style={styles.scrollview_container}>
        <Card
          title='Handicap'
        >
          <View style={styles.field_container}>
            <Text style={styles.field_label}>Handicap Index</Text>
            <View style={styles.field_input_view}>
              <TextInput
                style={styles.field_input}
                onChangeText={text => {
                  setHI(text);
                  const newCH = course_handicap(text, round.tee, game.scope.holes);
                  //console.log('newCH', newCH, round, game.scope.holes);
                  setCH(newCH);
                }}
                onEndEditing={() => update()}
                keyboardType='decimal-pad'
                value={HI.toString()}
              />
            </View>
          </View>
          <View style={styles.field_container}>
            <Text style={styles.field_label}>Course Handicap</Text>
            <View style={styles.field_display_view}>
              <Text style={styles.field_display}>
                {( CH != null ) ? CH.toString() : '-'}
              </Text>
            </View>
          </View>
          <View style={styles.divider}>
            <View style={styles.hrLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.hrLine} />
          </View>
          <View style={styles.field_container}>
            <Text style={styles.field_label}>Game Handicap</Text>
            <View style={styles.field_input_view}>
              <TextInput
                style={styles.field_input}
                onChangeText={text => {
                  setGH(parseFloat(text) || '');
                }}
                onEndEditing={() => update()}
                keyboardType='decimal-pad'
                value={GH.toString()}
              />
            </View>
          </View>
          <Text style={styles.explanation}>
            Full course handicap that overrides numbers above
          </Text>
        </Card>
        <Card title='Round'>

        </Card>
      </ScrollView>
    </View>
  );
};

export default EditPlayer;


const styles = StyleSheet.create({
  scrollview_container: {
    height: '100%',
  },
  field_container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  field_label: {
    fontWeight: 'bold',
    margin: 5,
    flex: 1,
  },
  field_input_view: {
    flex: 1,
    justifyContent: 'center',
  },
  field_input: {
    height: 40,
    width: 75,
    color: '#000',
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
  field_display_view: {
    flex: 1,
    justifyContent: 'center',
    margin: 10,
  },
  field_display: {
    fontSize: 18,
    justifyContent: 'center',
    padding: 5,
  },
  explanation: {
    padding: 5,
  },
  divider: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  hrLine: {
    width: width / 3.5,
    backgroundColor: blue,
    height: 1,
  },
  dividerText: {
    color: blue,
    textAlign: 'center',
    width: width / 8,
  },
});