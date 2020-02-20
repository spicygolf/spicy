import React, { useContext } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';
import {
  Button,
  Icon,
} from 'react-native-elements';
import { useMutation } from '@apollo/react-hooks';
import { filter, sortBy } from 'lodash';

import { GameContext } from 'features/game/gameContext';
import { GET_GAME_QUERY } from 'features/games/graphql';
import { POST_SCORE_MUTATION } from 'features/rounds/graphql';
import { blue } from 'common/colors';
import {
  get_net_score,
  get_score,
  get_score_value
} from 'common/utils/rounds';
import { upsertScore } from 'common/utils/upsertScore';



const HoleJunk = props => {

  const [ postScore ] = useMutation(POST_SCORE_MUTATION);

  const { hole, score, rkey } = props;
  const par = (hole && hole.par) ? parseFloat(hole.par) : 0.0;

  const { game, gamespec } = useContext(GameContext);
  const { _key: gkey } = game;
  const { junk } = gamespec;
  if( !junk ) return null;
  const sorted_junk = sortBy(junk, ['seq']);


  const setJunk = (junk, newValue) => {

    //console.log('setJunk', hole, score, rkey, junk, newValue);
    let newScore = upsertScore([score], hole.hole, junk.name, newValue);

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

    if( junk.limit == 'one_per_group' && newValue == true ) {
      // We just set this junk to 'true', and it's a limit of one per group, so
      // we have to set the other players in group to false.

      const otherRounds = filter(game.rounds, r => (r._key != rkey));
      otherRounds.map(r => {
        const s = get_score(hole.hole, r);
        newScore = upsertScore([s], hole.hole, junk.name, false);

        const { loading, error, data } = postScore({
          variables: {
            round: r._key,
            score: newScore[0] || [],
          },
          refetchQueries: [{
            query: GET_GAME_QUERY,
            variables: {
              gkey: gkey
            }
          }],
        });

      });

    }

  };


  const renderJunk = junk => {

    // TODO: junk.name needs l10n, i18n - use junk.name as slug
    let type = 'outline';
    let color = blue;

    // don't show team junk here
    if( junk.show_in == 'team' ) return null;

    // TODO: are all junk true/false?
    const val = get_score_value(junk.name, score);
    let selected = (val && (val == true || val == 'true')) ? true : false;

    // if junk shouldn't be rendered except if a condition is achieved, then
    // return null
    if( junk.show_in == 'score' ) {

      const based_on = junk.based_on || 'gross';
      let s = get_score_value('gross', score);
      if( based_on == 'net' ) {
        s = get_net_score(s, score, gkey);
      }

      if( !junk.score_to_par ) {
        console.log(`Invalid game setup.  Junk '${junk.name}' doesn't have 'score_to_par' set properly.`);
      }

      // assumes junk.score_to_par is in form '{fit} {amount}' like 'exactly -2'
      const [fit, amount] = junk.score_to_par.split(' ');
      //console.log(junk.name, junk.based_on, s, hole.par, fit, amount);
      switch( fit ) {
        case 'exactly':
          if( (s - par) != parseFloat(amount) ) return null;
          selected = true;
          break;
        case 'less_than':
          console.log('less_than');
          break;
        case 'greater_than':
          console.log('greater_than');
          break;
        default:
          // if condition not achieved, return null
          return null;
      }

    }


    if( selected ) {
      type = 'solid';
      color = 'white';
    }

    return (
      <Button
        title={junk.name}
        icon={
          <Icon
            style={styles.icon}
            name={junk.icon}
            size={20}
            color={color}
          />}
        type={type}
        buttonStyle={styles.button}
        titleStyle={styles.buttonTitle}
        onPress={() => {
          // only set in DB if junk is based on user input
          if( junk.based_on == 'user') setJunk(junk, !selected);
        }}
      />
    );

  };

  return (
    <View>
      <FlatList
        horizontal={true}
        inverted={true}
        data={sorted_junk}
        renderItem={({item}) => renderJunk(item)}
        keyExtractor={item => item.name}
      />
    </View>
  );
};

export default HoleJunk;


const styles = StyleSheet.create({
  icon: {
    padding: 5,
  },
  button: {
    padding: 2,
    marginLeft: 5,
    borderColor: blue,
  },
  buttonTitle: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 13,
  }
});
