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
import { filter, find, findIndex } from 'lodash';
import { useMutation } from '@apollo/client';

import { GET_GAME_QUERY } from 'features/game/graphql';
import { UPDATE_GAME_MUTATION } from 'features/game/graphql';
import { GameContext } from 'features/game/gameContext';
import { getNewGameForUpdate } from 'common/utils/game';
import { getHolesToUpdate } from 'common/utils/teams';
import { blue } from 'common/colors';


const TeamChooser = props => {

  const [ updateGame ] = useMutation(UPDATE_GAME_MUTATION);

  const { currentHole } = props;
  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const h = ( game && game.teams && game.teams.holes ) ?
    find(game.teams.holes, {hole: currentHole}) : {hole: currentHole, teams: []};
  //console.log('h', h);


  const changeTeamsForPlayer = async (pkey, addToTeam, removeFromTeam) => {
    //console.log('pkey', pkey);
    //console.log('addToTeam', addToTeam);
    //console.log('removeFromTeam', removeFromTeam);

    // remove player from this team (across appropriate holes)
    let newGame = getNewGameForUpdate(game);

    const holesToUpdate = getHolesToUpdate(newGame.teams.rotate, game.holes);
    if( !newGame.teams.holes ) {
      newGame.teams.holes = [];
    }
    holesToUpdate.map(h => {
      // if hole data doesn't exist, create blanks
      if( findIndex(newGame.teams.holes, {hole: h}) < 0 ) {
        newGame.teams.holes.push(
          {
            hole: h,
            teams: [
              {team: '1', players: []},
              {team: '2', players: []},
            ],
            multipliers: [],
          }
        );
      }
      const holeIndex = findIndex(newGame.teams.holes, {hole: h});
      //console.log('holeIndex', holeIndex);

      // ****** remove player from team ******
      if( findIndex(newGame.teams.holes[holeIndex].teams, {team: removeFromTeam}) < 0 ) {
        newGame.teams.holes[holeIndex].teams.push(
          {
            team: removeFromTeam,
            players: [],
          }
        );
      }
      const rmTeamIndex = findIndex(newGame.teams.holes[holeIndex].teams, {team: removeFromTeam});
      //console.log('rmTeamIndex', rmTeamIndex);
      if( rmTeamIndex < 0 ) return;
      const rmPlayers = newGame.teams.holes[holeIndex].teams[rmTeamIndex].players;
      const rmNewPlayers = filter(rmPlayers, p => p != pkey);
      //console.log('rmNewPlayers', rmNewPlayers);
      newGame.teams.holes[holeIndex].teams[rmTeamIndex].players = rmNewPlayers;
      //console.log('removeFromTeam newGame', newGame);

      // ****** add player to team ******
      if( !addToTeam ) return;
      if( findIndex(newGame.teams.holes[holeIndex].teams, {team: addToTeam}) < 0 ) {
        newGame.teams.holes[holeIndex].teams.push(
          {
            team: addToTeam,
            players: [],
          }
        );
      }
      const addTeamIndex = findIndex(newGame.teams.holes[holeIndex].teams, {team: addToTeam});
      //console.log('holeIndex', holeIndex, 'addTeamIndex', addTeamIndex);
      if( addTeamIndex < 0 ) return;
      const addPlayers = newGame.teams.holes[holeIndex].teams[addTeamIndex].players;
      addPlayers.push(pkey);
      //console.log('addPlayers', addPlayers);
      newGame.teams.holes[holeIndex].teams[addTeamIndex].players = addPlayers;
      //console.log('addToTeam newGame', newGame);

    });

    //console.log('removeFromTeam newGame final', newGame);

    const { loading, error, data } = await updateGame({
      variables: {
        gkey: gkey,
        game: newGame,
      },
      refetchQueries: [{
        query: GET_GAME_QUERY,
        variables: {
          gkey: gkey
        }
      }],
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