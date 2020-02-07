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
import Teams from 'features/gameSetup/teams';
import TeeSelector from 'features/gameSetup/teeSelector';
import { GameContext } from 'features/game/gameContext';
import { getTeams } from 'common/utils/teams';
import { get_round_for_player } from 'common/utils/rounds';
import { blue } from 'common/colors';



const Players = props => {

  const navigation = useNavigation();
  const { game, gamespec } = useContext(GameContext);
  const { _key: gkey, rounds, players, start } = game;


  const _itemPressed = player => {
    console.log('pressed player', player);

    // TODO: maybe implement me?
    // I could see this being used for choosing a round or multiple that the
    // player may have going that current day.
    //
    //navigate('player_item', {player: player});
  };

  const _shouldShowAddButton = players => {
    let ret = true;
    if( gamespec.team_size > 1 ) return false;
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

      const handicap = (item && item.handicap && item.handicap.display) ?
        item.handicap.display : 'no handicap';

      const subtitle = (
        <TeeSelector
          game={game}
          tee={tee}
          rkey={rkey}
          pkey={pkey}
        />
      );

      return (
        <ListItem
          key={pkey}
          title={item.name || ''}
          subtitle={subtitle}
          badge={{
            value: handicap,
          }}
          onPress={() => _itemPressed(item)}
          rightIcon={
            <RemovePlayer
              gkey={gkey}
              pkey={pkey}
              rkey={rkey}
            />
          }
        />
      );

    } else {
      return null;
    }
  };

  const addButton = (
    <Icon
      name='add-circle'
      color={blue}
      size={40}
      title='Add Player'
      onPress={() => navigation.navigate('AddPlayer')}
      testID='add_player_button'
    />
  );
  const noAddButton = (<Icon name='add-circle' size={40} color='#fff'/>);
  const showButton = _shouldShowAddButton(players);

  let content = null;
  if( gamespec.team_size && gamespec.team_size > 1 ) {
    const teams = getTeams(players, gamespec);
    content = (
      <Teams
        teams={teams}
        players={players}
        gamespec={gamespec}
        renderPlayer={_renderPlayer}
      />
    );
  } else {
    content = (
      <FlatList
        data={players}
        renderItem={this._renderPlayer}
        keyExtractor={item => item._key}
      />
    );
  }

  return (
    <Card>
      <View style={styles.cardTitle}>
        { noAddButton }
        <Text style={styles.title}>Players</Text>
        { showButton ? addButton : noAddButton }
      </View>
      <View style={styles.listContainer}>
        {content}
      </View>
    </Card>
  );

};

export default Players;


const styles = StyleSheet.create({
  cardTitle: {
    flexDirection: 'row',
    flex: 3,
    alignItems: 'center',
    justifyContent: 'space-between'
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
