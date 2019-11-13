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



const Teams = ({teams, players, renderPlayer}) => {

  console.log('teams', teams);
  console.log('players', players);

  const _renderTeam = ({item}) => {

    const playersOnTeam = filter(players, p => {
      return (p.team == item.team);
    });
    console.log('playersOnTeam', item.team, playersOnTeam);

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
