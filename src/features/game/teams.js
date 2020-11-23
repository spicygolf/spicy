import React, { useContext } from 'react';
import {
  FlatList,
  StyleSheet,
} from 'react-native';
import {
  Card,
} from 'react-native-elements';
import { find } from 'lodash';

import Player from 'features/game/player';
import TeamJunk from 'common/components/teamJunk';
import TeamMultipliers from 'common/components/teamMultipliers';
import TeamTotals from 'common/components/teamTotals';
import { GameContext } from 'features/game/gameContext';



const Teams = ({teams, scoring, currentHole }) => {

  //console.log('Teams teams', teams);
  const { game, activeGameSpec } = useContext(GameContext);
  const { players } = game;

  const _renderPlayer = ({item}) => {
    return (
      <Player
        player={item}
        game={game}
        currentHole={currentHole}
      />);
  };

  const _renderTeam = ({item}) => {
    //console.log('_renderTeam item', item);
    const playersOnTeam = [];
    item.players.map(pkey => {
      const p = find(players, {_key: pkey});
      if( p ) playersOnTeam.push(p);
    });
    //console.log('playersOnTeam', item.team, playersOnTeam);

    return (
      <Card
        containerStyle={styles.container}
        titleStyle={styles.title}
      >
        <FlatList
          data={playersOnTeam}
          renderItem={_renderPlayer}
          keyExtractor={item => item._key}
        />
        <TeamJunk
          team={item.team}
          scoring={scoring}
          currentHole={currentHole}
        />
        <TeamMultipliers
          team={item.team}
          scoring={scoring}
          currentHole={currentHole}
        />
        <TeamTotals
          team={item.team}
          scoring={scoring}
          currentHole={currentHole}
          type={activeGameSpec.type}
          betterPoints={activeGameSpec.better}
        />
      </Card>
    );

  };

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
    paddingTop: 0,
    paddingBottom: 5,
    margin: 10,
  },
  title: {
    fontSize: 16,
  },
});
