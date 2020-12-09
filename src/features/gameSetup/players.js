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
  const { game } = useContext(GameContext);

  const { _key: gkey, rounds, players } = game;

  const _itemPressed = player => {
    if( !player ) return;
    // check to see if round exists... if not, don't go here
    const round = get_round_for_player(rounds, player._key);
    if( round ) navigation.navigate('EditPlayer', {player: player});
  };

  const _shouldShowAddButton = players => {
    return true; //TODO: fixme now that multiple gamespecs could be on each game
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
    //console.log('renderPlayer item', item);
    if( item && item.name && item._key ) {
      const name = item.name || '';
      const pkey = item._key;

      let rkey, tee, ch, gh, hi;

      const round = get_round_for_player(rounds, pkey);
      if( round ) {
        rkey = round._key;
        tee =  round.tee;
        ch = round.course_handicap;
        gh = round.game_handicap;
        hi = round.handicap_index;
      }

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
          onPress={() => _itemPressed(item)}
        >
          <ListItem.Content style={styles.player}>
            <ListItem.Title>{name}</ListItem.Title>
            <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>
          </ListItem.Content>
          <HandicapBadge
              game_handicap={gh}
              course_handicap={ch}
              handicap_index={hi}
            />
          <RemovePlayer
              gkey={gkey}
              pkey={pkey}
              rkey={rkey}
            />
        </ListItem>
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
      <Card.Title style={styles.title}>Players</Card.Title>
      <Card.Divider />
      <View style={styles.listContainer}>
        <FlatList
          data={players}
          renderItem={_renderPlayer}
          keyExtractor={item => {
            if( item && item._key ) return item._key;
            return Math.random().toString();
          }}
        />
      </View>
      { button }
    </Card>
  );

};

export default Players;


const styles = StyleSheet.create({
  title: {
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  player: {
    flex: 6,
  },
  listContainer: {
    marginTop: 0,
    marginBottom: 10,
  },
});
