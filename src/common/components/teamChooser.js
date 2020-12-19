import React, { useContext } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Icon,
} from 'react-native-elements';
import { cloneDeep, filter, find, findIndex, orderBy } from 'lodash';
import { useMutation } from '@apollo/client';

import { UPDATE_GAME_HOLES_MUTATION } from 'features/game/graphql';
import { GameContext } from 'features/game/gameContext';
import { omitTypename } from 'common/utils/game';
import { getHolesToUpdate } from 'common/utils/game';
import { blue } from 'common/colors';


const TeamChooser = props => {

  const [ updateGameHoles ] = useMutation(UPDATE_GAME_HOLES_MUTATION);

  const { currentHole } = props;
  //console.log('currentHole', currentHole);
  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const h = ( game && game.holes && game.holes.length )
    ? find(game.holes, {hole: currentHole})
    : {hole: currentHole, teams: []};
  //console.log('h', h);


  const changeTeamsForPlayer = async (pkey, addToTeam, removeFromTeam) => {
    //console.log('pkey', pkey);
    console.log('addToTeam', addToTeam);
    console.log('removeFromTeam', removeFromTeam);

    // set up variables for mutation
    const holesToUpdate = getHolesToUpdate(game.scope.teams_rotate, game, currentHole);
    //console.log('holesToUpdate', holesToUpdate);
    let newHoles = cloneDeep(game.holes);
    if( !newHoles ) {
      newHoles = [];
    }

    holesToUpdate.map(h => {
      // if hole data doesn't exist, create blanks
      if( findIndex(newHoles, {hole: h}) < 0 ) {
        newHoles.push({
          __typename: 'GameHole',
          hole: h,
          teams: [
            {__typename: 'Team', team: '1', players: []},
            {__typename: 'Team', team: '2', players: []},
          ],
          multipliers: [],
        });
      }
      const holeIndex = findIndex(newHoles, {hole: h});
      //console.log('holeIndex', holeIndex);

      // ****** remove player from team ******
      let rmTeamIndex = findIndex(newHoles[holeIndex].teams, {team: removeFromTeam});
      //console.log('rmTeamIndex', rmTeamIndex);
      if( rmTeamIndex < 0 ) {
        newHoles[holeIndex].teams.push({
          __typename: 'Team',
          team: removeFromTeam,
          players: [],
          junk: [],
        });
        rmTeamIndex = 0;
      }
      const rmPlayers = newHoles[holeIndex].teams[rmTeamIndex].players;
      const rmNewPlayers = filter(rmPlayers, p => p != pkey);
      //console.log('rmNewPlayers', rmNewPlayers);
      newHoles[holeIndex].teams[rmTeamIndex].players = rmNewPlayers;
      //console.log('removeFromTeam newHoles', newHoles);

      // ****** add player to team ******
      if( !addToTeam ) return;

      // first remove this player from all other teams (to be safe)
      const newTeams = newHoles[holeIndex].teams.map(t => {
        let players = t.players.filter(p => (p != pkey));
        return {
          ...t,
          players,
        }
      });
      newHoles[holeIndex].teams = orderBy(newTeams, ['team'], ['asc']);
      //console.log('teams after removing player from all other teams', newHoles[holeIndex].teams);

      let addTeamIndex = findIndex(newHoles[holeIndex].teams, {team: addToTeam});
      if( addTeamIndex < 0 ) {
        newHoles[holeIndex].teams.push({
          __typename: 'Team',
          team: addToTeam,
          players: [],
          junk: [],
        });
        addTeamIndex = 0;
      }
      //console.log('holeIndex', holeIndex, 'addTeamIndex', addTeamIndex);
      if( addTeamIndex < 0 ) return;
      const addPlayers = newHoles[holeIndex].teams[addTeamIndex].players;
      addPlayers.push(pkey);
      //console.log('addPlayers', addPlayers);
      newHoles[holeIndex].teams[addTeamIndex].players = addPlayers;
      //console.log('addToTeam newHoles', newHoles);
    });
    //console.log('removeFromTeam newHoles final', newHoles);
    const newHolesWithoutTypes = omitTypename(newHoles);

    const { loading, error, data } = await updateGameHoles({
      variables: {
        gkey: gkey,
        holes: newHolesWithoutTypes,
      },
      optimisticResponse: {
        __typename: 'Mutation',
        updateGameHoles: {
          __typename: 'Game',
          _key: gkey,
          holes: newHoles,
        },
      }
    });

    if( error ) console.log('Error updating game - teamChooser', error);
  };


  const _renderPlayer = ({item}) => {
    if( !item ) return;

    let team;
    if( h && h.teams ) {
      team = find(h.teams, t => (
        t && t.players && t.players.includes(item._key)
      ));
    }
    //console.log('team', item.name, team);

    const teamIcon = (teamNum) => {
      if( team && team.team && team.team == teamNum ) {
        return (
          <Icon
            name='check-circle'
            type='material-community'
            color={blue}
            size={30}
            iconStyle={styles.icon}
            onPress={() => changeTeamsForPlayer(item._key, null, teamNum)}
          />
        );
      } else {
        return (
          <Icon
            name='plus-circle'
            type='material-community'
            color='#aaa'
            size={30}
            iconStyle={styles.icon}
            onPress={() => changeTeamsForPlayer(item._key, teamNum, teamNum == '1' ? '2' : '1')}
          />
        );
      }
    };

    const team1 = teamIcon('1');
    const team2 = teamIcon('2');

    return (
      <View style={styles.teamChooserView}>
        { team1 }
        <Text style={styles.player_name}>{item.name || ''}</Text>
        { team2 }
      </View>
    );

  };


  return (
    <View style={styles.container}>
      <View style={styles.teamTitleView}>
        <Text style={styles.title}>Team 1</Text>
        <Text style={styles.title}>Team 2</Text>
      </View>
      <FlatList
        data={game.players}
        renderItem={_renderPlayer}
        keyExtractor={item => {
          if( item && item._key ) return item._key;
          return Math.random().toString();
        }}
      />
    </View>
  );

};

export default TeamChooser;


const styles = StyleSheet.create({
  container: {

  },
  teamTitleView: {
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  teamChooserView: {
    flex: 10,
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  title: {
    textDecorationLine: 'underline',
    paddingBottom: 20,
  },
  icon: {
    padding: 10,
  },
  player_name: {
    paddingTop: 15,
  },
});