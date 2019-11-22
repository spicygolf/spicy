'use strict';

import React from 'react';

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

import { filter } from 'lodash';

import { blue } from 'common/colors';



const Teams = ({teams, players, gamespec, renderPlayer, nav}) => {

  //console.log('Teams teams', teams);
  //console.log('Teams players', players);
  //console.log('Teams gamespec', gamespec);

  const addButton = team => (
    <Icon
      name='add-circle'
      color={blue}
      size={40}
      title='Add Player'
      onPress={() => nav.navigate('AddPlayer', {team: team})}
      testID='add_player_button'
    />
  );
  const noAddButton = _ => (<Icon name='add-circle' size={40} color='#fff'/>);

  const _renderTeam = ({item}) => {

    const playersOnTeam = filter(players, p => {
      return (p.team == item.team);
    });
    //console.log('playersOnTeam', item.team, playersOnTeam);
    const button = ( playersOnTeam.length < gamespec.team_size )
      ? addButton : noAddButton;

    return (
      <View>
        <View>
          <Text style={styles.team}>Team {item.team}</Text>
        </View>
        <FlatList
          data={playersOnTeam}
          renderItem={renderPlayer}
          keyExtractor={item => item._key}
        />
        {button(item.team)}
      </View>
    );
  }


  const flatlist = (
    <FlatList
      data={teams}
      renderItem={_renderTeam}
      keyExtractor={item => String(item.team)}
    />
  );

  return flatlist;
};

export default Teams;


const styles = StyleSheet.create({
  team: {
    fontWeight: 'bold'
  }
});
