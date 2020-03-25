import React, { useContext } from 'react';

import {
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';

import {
  Card,
  Icon,
  ListItem
} from 'react-native-elements';

import { useNavigation } from '@react-navigation/native';

import RemovePlayer from 'features/gameSetup/removePlayer';
import TeeSelector from 'features/gameSetup/teeSelector';
import HandicapBadge from 'common/components/handicapBadge';
import { GameContext } from 'features/game/gameContext';
import { get_round_for_player } from 'common/utils/rounds';
import { blue } from 'common/colors';



const Players = props => {

  const navigation = useNavigation();
  const { game, gamespec } = useContext(GameContext);
  const { _key: gkey, rounds, players } = game;


  const _itemPressed = player => {
    navigation.navigate('EditPlayer', {player: player});
  };

  const _shouldShowAddButton = players => {
    let ret = true;
    if( gamespec.max_players < 1 ) return true;
    try {
      const player_count = players.length;
      ret = (player_count < gamespec.max_players);
    } catch(e) {
      console.log('error in shouldShowButton', e);
    }
    return ret;
  }

  const _renderPlayer = ({item}) => {
    if( item && item.name ) {
      const pkey = item._key;

      const round = get_round_for_player(rounds, pkey);
      const rkey = (round && round._key) ? round._key : null;
      const tee =  (round && round.tee ) ? round.tee : null;

      const ch = (round && round.course_handicap) ?
        round.course_handicap : null;
      const gh = (round && round.game_handicap) ?
        round.game_handicap : null;
      const hi = (round && round.handicap_index) ?
        round.handicap_index : null;

      const subtitle = (
        <TeeSelector
          game={game}
          tee={tee}
          rkey={rkey}
          player={item}
        />
      );

      return (
        <ListItem
          key={pkey}
          title={item.name || ''}
          subtitle={subtitle}
          onPress={() => _itemPressed(item)}
          rightElement={
            <RemovePlayer
              gkey={gkey}
              pkey={pkey}
              rkey={rkey}
            />
          }
          rightIcon={
            <HandicapBadge
              game_handicap={gh}
              course_handicap={ch}
              handicap_index={hi}
            />
          }
          contentContainerStyle={{
            flex: 6,
          }}
        />
      );

    } else {
      return null;
    }
  };

  const button = _shouldShowAddButton(players) ? (
    <Icon
      name='add-circle'
      color={blue}
      size={40}
      title='Add Player'
      onPress={() => navigation.navigate('AddPlayer')}
      testID='add_player_button'
    />
  ) : null;

  return (
    <Card>
      <View style={styles.cardTitle}>
        <Text style={styles.title}>Players</Text>
      </View>
      <View style={styles.listContainer}>
        <FlatList
          data={players}
          renderItem={_renderPlayer}
          keyExtractor={item => item._key}
        />
      </View>
      { button }
    </Card>
  );

};

export default Players;


const styles = StyleSheet.create({
  cardTitle: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555'
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10
  },
});
