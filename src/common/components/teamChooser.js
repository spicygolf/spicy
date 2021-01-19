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
import { getTeams } from 'common/utils/teams';
import { getGameMeta, setGameMeta } from 'common/utils/metadata';
import { blue } from 'common/colors';



const TeamChooser = props => {

  // TODO: modify this to support more than just two teams
  //       or, just make a ManyTeamChooser component
  const teamCount = 2;

  const [ updateGameHoles ] = useMutation(UPDATE_GAME_HOLES_MUTATION);

  const { currentHole, from } = props;
  //console.log('currentHole', currentHole);
  const { game } = useContext(GameContext);
  const { _key: gkey } = game;
  const teams = getTeams(game, currentHole);
  const gameHole = ( game && game.holes && game.holes.length )
    ? find(game.holes, {hole: currentHole})
    : {hole: currentHole, teams: []};


  const changeTeamsForPlayer = async (pkey, addToTeam, removeFromTeam) => {
    //console.log('pkey', pkey);
    //console.log('addToTeam', addToTeam);
    //console.log('removeFromTeam', removeFromTeam);

    // get holes for updating, either from game metadata or game setup
    const gameMeta = await getGameMeta(gkey);
    const holesToUpdate = (gameMeta && gameMeta.holesToUpdate && gameMeta.holesToUpdate.length)
      ? gameMeta.holesToUpdate
      : getHolesToUpdate(game.scope.teams_rotate, game, currentHole);
    //console.log('holesToUpdate', holesToUpdate);

    // set up variable for mutation
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
          teams: [],
          multipliers: [],
        });
      }
      const holeIndex = findIndex(newHoles, {hole: h});
      //console.log('hole', h);

      // if team data doesn't exist, create blanks
      if( !newHoles[holeIndex].teams ) newHoles[holeIndex].teams = [];
      //console.log('teams', newHoles[holeIndex].teams);
      for( let i=0; i < teamCount; i++ ) {
        const teamNum = (i+1).toString();
        const teamIndex = find(newHoles[holeIndex].teams, {team: teamNum});
        //console.log('blanks', teamNum, teamIndex);
        if( !teamIndex || teamIndex < 0 ) {
          newHoles[holeIndex].teams.push({
            __typename: 'Team',
            team: teamNum,
            players: [],
            junk: []
          });
        }
      }

      newHoles[holeIndex].teams = newHoles[holeIndex].teams.map(t => {
        let newTeam = cloneDeep(t);
        // remove player from team, if match removeFromTeam
        if( removeFromTeam == t.team ) {
          newTeam.players = filter(t.players, p => p != pkey);
        }
        // add player to team, if match addToTeam
        if( addToTeam == t.team ) {
          newTeam.players.push(pkey);
        }
        //console.log('newTeam', newTeam);
        return newTeam;
      });
    });
    const newHolesWithoutTypes = omitTypename(newHoles);
    //console.log('newHoles final', newHolesWithoutTypes);

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

    if( error ) {
      console.log('Error updating game - teamChooser', error);
    } else {
      // if we've chosen teams, clear out game metadata on holesToUpdate
      if( teams ) {
        setGameMeta(gkey, 'holesToUpdate', []);
      }
    }
  };


  const _renderPlayer = ({item, index}) => {
    if( !item ) return;

    let team;
    if( gameHole && gameHole.teams ) {
      team = find(gameHole.teams, t => (
        t && t.players && t.players.includes(item._key)
      ));
    }
    //console.log('team', item.name, team);

    const teamIcon = (teamNum) => {
      if( team && team.team && team.team == teamNum ) {
        //console.log('remove', from, teamNum, index);
        // removing from a team
        return (
          <Icon
            name='check-circle'
            type='material-community'
            color={blue}
            size={30}
            iconStyle={styles.icon}
            onPress={() => changeTeamsForPlayer(item._key, null, teamNum)}
            testID={`${from}_remove_player_from_team_${teamNum}_${index}`}
          />
        );
      } else {
        //console.log('add', from, teamNum, index);
        // adding to a team
        return (
          <Icon
            name='plus-circle'
            type='material-community'
            color='#aaa'
            size={30}
            iconStyle={styles.icon}
            onPress={() => changeTeamsForPlayer(item._key, teamNum, teamNum == '1' ? '2' : '1')}
            testID={`${from}_add_player_to_team_${teamNum}_${index}`}
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


  let sorted_players = game.players;
  if( game && game.scope && game.scope.wolf_order ) {
    sorted_players = game.scope.wolf_order.map(pkey => {
      const p = find(game.players, {_key: pkey});
      if( !p ) console.log('a player in wolf_order that is not in players?');
      return p;
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.teamTitleView}>
        <Text style={styles.title}>Team 1</Text>
        <Text style={styles.title}>Team 2</Text>
      </View>
      <FlatList
        data={sorted_players}
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