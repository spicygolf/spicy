import React, { useContext } from 'react';
import {
  FlatList,
  StyleSheet,
} from 'react-native';
import {
  Card,
} from 'react-native-elements';
import { find } from 'lodash';

import TeamJunk from 'common/components/teamJunk';
import { GameContext } from 'features/game/gameContext';



const Teams = ({teams, renderPlayer}) => {

  //console.log('Teams teams', teams);
  const { game } = useContext(GameContext);
  const { players } = game;

  const _renderTeam = ({item}) => {
    //console.log('_renderTeam item', item);
    const playersOnTeam = [];
    item.players.map(pkey => {
      const p = find(players, {_key: pkey});
      playersOnTeam.push(p);
    });
    //console.log('playersOnTeam', item.team, playersOnTeam);

    return (
      <Card
        title={`Team ${item.team}`}
        containerStyle={styles.container}
        titleStyle={styles.title}
      >
        <FlatList
          data={playersOnTeam}
          renderItem={renderPlayer}
          keyExtractor={item => item._key}
        />
        <TeamJunk />
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
    paddingBottom: 0,
    margin: 10,
  },
  title: {
    fontSize: 16,
  },
});
