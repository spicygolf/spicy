'use strict';

import React from 'react';

import {
  FlatList,
  StyleSheet,
} from 'react-native';

import {
  Card,
} from 'react-native-elements';

import { filter } from 'lodash';



const Teams = ({teams, players, renderPlayer}) => {

  //console.log('Teams teams', teams);
  //console.log('Teams players', players);
  //console.log('Teams gamespec', gamespec);

  const _renderTeam = ({item}) => {

    const playersOnTeam = filter(players, p => {
      return (p.team == item.team);
    });
    //console.log('playersOnTeam', item.team, playersOnTeam);

    return (
      <Card
        title={`Team ${item.team}`}
        containerStyle={styles.container}
        titleStyle={styles.wrapper}
      >
        <FlatList
          data={playersOnTeam}
          renderItem={renderPlayer}
          keyExtractor={item => item._key}
        />
      </Card>
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
  container: {
    paddingLeft: 5,
    paddingRight: 5,
    margin: 10,
  },
  wrapper: {
    fontSize: 16,
  }
});
