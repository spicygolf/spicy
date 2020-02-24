import React, { useContext } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Card,
  Icon,
} from 'react-native-elements';
import { cloneDeep, filter, find, findIndex } from 'lodash';
import { useMutation } from '@apollo/react-hooks';

import { GET_GAME_QUERY } from 'features/games/graphql';
import { UPDATE_GAME_MUTATION } from 'features/game/graphql';
import { GameContext } from 'features/game/gameContext';
import { blue } from 'common/colors';


const TeamChooser = props => {

  const [ updateGame ] = useMutation(UPDATE_GAME_MUTATION);

  const { currentHole } = props;
  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const h = ( game && game.teams && game.teams.holes ) ?
    find(game.teams.holes, {hole: currentHole}) : {hole: currentHole, teams: []};
  //console.log('h', h);


  const removeFromTeam = (teamNum, pkey) => {
    //console.log('removeFromTeam', teamNum, pkey);

    // remove player from this team (across appropriate holes)
    let newGame = cloneDeep(game);
    delete newGame._key;
    delete newGame.rounds;
    delete newGame.players;
    const holeIndex = findIndex(newGame.teams.holes, {hole: currentHole});
    const teamIndex = findIndex(newGame.teams.holes[holeIndex].teams, {team: teamNum});
    //console.log('holeIndex', holeIndex, 'teamIndex', teamIndex, 'teamNum', teamNum);
    const players = newGame.teams.holes[holeIndex].teams[teamIndex].players;
    const newPlayers = filter(players, p => p != pkey);
    //console.log('newPlayers', newPlayers);
    newGame.teams.holes[holeIndex].teams[teamIndex].players = newPlayers;
    console.log('removeFromTeam newGame', newGame);

    console.log('mutation', UPDATE_GAME_MUTATION);

    const { loading, error, data } = updateGame({
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

  }

  const addToTeam = (teamNum, pkey) => {
    console.log('addToTeam', teamNum, pkey);

    // remove player from other team (across appropriate holes)


    // add player to this team (across appropriate holes)

  }

  const _renderPlayer = ({item}) => {

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
            onPress={() => removeFromTeam(teamNum, item._key)}
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
            onPress={() => addToTeam(teamNum, item._key)}
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
    <Card title='Choose Teams'>
      <View style={styles.container}>
        <View style={styles.teamTitleView}>
          <Text style={styles.title}>Team 1</Text>
          <Text style={styles.title}>Team 2</Text>
        </View>
        <FlatList
          data={game.players}
          renderItem={_renderPlayer}
          keyExtractor={item => item._key}
        />
      </View>
    </Card>
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