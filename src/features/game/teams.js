import React, { useContext, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Card,
  Icon,
  Overlay,
} from 'react-native-elements';
import { find, orderBy } from 'lodash';

import Player from 'features/game/player';
import ChangeTeams from 'features/game/changeTeams';
import TeamJunk from 'common/components/teamJunk';
import TeamMultipliers from 'common/components/teamMultipliers';
import TeamTotals from 'common/components/teamTotals';
import { GameContext } from 'features/game/gameContext';



const Teams = ({teams, scoring, currentHole }) => {

  //console.log('Teams teams', teams);
  const { game, activeGameSpec } = useContext(GameContext);
  const { players } = game;
  const ordered_teams = orderBy(teams, ['team'], ['asc']);

  const [visible, setVisible] = useState(false);

  const toggleOverlay = () => {
    setVisible(!visible);
  };

  const changeTeamsContent = (
    game &&
    game.scope &&
    game.scope.teams_rotate &&
    game.scope.teams_rotate != 'never')
    ? (
        <TouchableOpacity
          onPress={toggleOverlay}
        >
          <Icon
            type='material'
            name="people"
            color="#999"
          />
        </TouchableOpacity>
      )
    : null;

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
    if( !playersOnTeam.length ) return null; // bandaid (item 1) for #143

    return (
      <View>
        <Card
          containerStyle={styles.container}
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
          <View style={styles.settings_totals}>
            { changeTeamsContent }
            <TeamTotals
              team={item.team}
              scoring={scoring}
              currentHole={currentHole}
              type={activeGameSpec.type}
              betterPoints={activeGameSpec.better}
            />
          </View>
        </Card>
      </View>
    );

  };

  const flatlist = (
    <FlatList
      data={ordered_teams}
      renderItem={_renderTeam}
      keyExtractor={item => String(item.team)}
    />
  );

  return (
    <View>
      { flatlist }
      <Overlay isVisible={visible} onBackdropPress={toggleOverlay}>
          <ChangeTeams
            currentHole={currentHole}
            close={toggleOverlay}
          />
        </Overlay>
    </View>
  );
};

export default Teams;


const styles = StyleSheet.create({
  container: {
    paddingLeft: 5,
    paddingRight: 5,
    paddingTop: 0,
    paddingBottom: 5,
    margin: 5,
  },
  settings_totals: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    marginHorizontal: 5,
  },
});
