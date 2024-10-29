import { useMutation } from '@apollo/client';
import { blue } from 'common/colors';
import { getWolfPlayerIndex, omitTypename } from 'common/utils/game';
import { getHolesToUpdate } from 'common/utils/game';
import { getGameMeta, setGameMeta } from 'common/utils/metadata';
import { getTeams } from 'common/utils/teams';
import { GameContext } from 'features/game/gameContext';
import { UPDATE_GAME_HOLES_MUTATION } from 'features/game/graphql';
import { cloneDeep, filter, find, findIndex } from 'lodash';
import React, { useCallback, useContext, useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-elements';

const TeamChooser = (props) => {
  // TODO: modify this to support more than just two teams
  //       or, just make a ManyTeamChooser component
  const teamCount = 2;

  const [updateGameHoles] = useMutation(UPDATE_GAME_HOLES_MUTATION);

  const { currentHole, from } = props;
  //console.log('teamChooser currentHole', currentHole);
  const { game, activeGameSpec, readonly } = useContext(GameContext);
  const { _key: gkey } = game;
  const teams = getTeams(game, currentHole);
  const gameHole =
    game && game.holes && game.holes.length
      ? find(game.holes, { hole: currentHole })
      : { hole: currentHole, teams: [] };

  // wolf vars
  const isWolf = activeGameSpec.team_determination === 'wolf';
  const wolfPlayerIndex = isWolf ? getWolfPlayerIndex({ game, currentHole }) : -1;
  const wolfPKey = isWolf ? game.scope.wolf_order[wolfPlayerIndex] : '';
  const team1Text = isWolf ? '   Wolf' : 'Team 1';
  const team2Text = isWolf ? 'Opponents' : 'Team 2';

  const changeTeamsForPlayer = useCallback(
    async (pkey, addToTeam, removeFromTeam) => {
      //console.log('pkey', pkey);
      //console.log('addToTeam', addToTeam);
      //console.log('removeFromTeam', removeFromTeam);
      if (readonly) {
        return;
      } // view mode only, so don't allow changes

      // get holes for updating, either from game metadata or game setup
      const gameMeta = await getGameMeta(gkey);
      const holesToUpdate =
        gameMeta && gameMeta.holesToUpdate && gameMeta.holesToUpdate.length
          ? gameMeta.holesToUpdate
          : getHolesToUpdate(game.scope.teams_rotate, game, currentHole);
      //console.log('teamChooser holesToUpdate', holesToUpdate, gameMeta);

      // set up variable for mutation
      let newHoles = cloneDeep(game.holes);
      if (!newHoles) {
        newHoles = [];
      }

      holesToUpdate.map((h) => {
        // if hole data doesn't exist, create blanks
        if (findIndex(newHoles, { hole: h }) < 0) {
          newHoles.push({
            __typename: 'GameHole',
            hole: h,
            teams: [],
            multipliers: [],
          });
        }
        const holeIndex = findIndex(newHoles, { hole: h });
        //console.log('hole', h);

        // if team data doesn't exist, create blanks
        if (!newHoles[holeIndex].teams) {
          newHoles[holeIndex].teams = [];
        }
        //console.log('teams', newHoles[holeIndex].teams);
        for (let i = 0; i < teamCount; i++) {
          const teamNum = (i + 1).toString();
          const teamIndex = find(newHoles[holeIndex].teams, { team: teamNum });
          //console.log('blanks', teamNum, teamIndex);
          if (!teamIndex || teamIndex < 0) {
            newHoles[holeIndex].teams.push({
              __typename: 'Team',
              team: teamNum,
              players: [],
              junk: [],
            });
          }
        }

        newHoles[holeIndex].teams = newHoles[holeIndex].teams.map((t) => {
          let newTeam = cloneDeep(t);
          // remove player from team, if match removeFromTeam
          if (removeFromTeam === t.team) {
            newTeam.players = filter(t.players, (p) => p !== pkey);
          }
          // add player to team, if match addToTeam
          if (addToTeam === t.team) {
            newTeam.players.push(pkey);
          }
          //console.log('newTeam', newTeam);
          return newTeam;
        });
      });
      const newHolesWithoutTypes = omitTypename(newHoles);
      //console.log('newHoles final', newHolesWithoutTypes);

      const { error } = await updateGameHoles({
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
        },
      });

      if (error) {
        console.log('Error updating game - teamChooser', error);
      } else {
        // if we've chosen teams, clear out game metadata on holesToUpdate
        if (teams) {
          setGameMeta(gkey, 'holesToUpdate', []);
        }
      }
    },
    [currentHole, game, gkey, readonly, teams, updateGameHoles],
  );

  const _renderPlayer = ({ item, index }) => {
    if (!item) {
      return;
    }

    const isWolfPlayer = item._key === wolfPKey;
    //console.log('isWolfPlayer', item.name, isWolfPlayer);

    let team;
    if (gameHole && gameHole.teams) {
      team = find(gameHole.teams, (t) => t && t.players && t.players.includes(item._key));
    }
    //console.log('team', item.name, team);

    const teamIcon = (teamNum) => {
      if (team && team.team && team.team === teamNum) {
        //console.log('remove', from, teamNum, index);
        // removing from a team
        if (!isWolfPlayer) {
          return (
            <Icon
              name="check-circle"
              type="material-community"
              color={blue}
              size={30}
              iconStyle={styles.icon}
              onPress={() => changeTeamsForPlayer(item._key, null, teamNum)}
              testID={`${from}_remove_player_from_team_${teamNum}_${index}`}
            />
          );
        } else {
          return (
            <Icon
              name="wolf-pack-battalion"
              type="font-awesome-5"
              color={blue}
              size={30}
              iconStyle={styles.icon}
            />
          );
        }
      } else {
        //console.log('add', from, teamNum, index);
        // adding to a team
        if (!isWolfPlayer) {
          return (
            <Icon
              name="plus-circle"
              type="material-community"
              color="#aaa"
              size={30}
              iconStyle={styles.icon}
              onPress={() =>
                changeTeamsForPlayer(item._key, teamNum, teamNum === '1' ? '2' : '1')
              }
              testID={`${from}_add_player_to_team_${teamNum}_${index}`}
            />
          );
        } else {
          return (
            <Icon
              name="plus-circle"
              type="material-community"
              color="transparent"
              size={30}
              iconStyle={styles.icon}
            />
          );
        }
      }
    };

    const team1 = teamIcon('1');
    const team2 = teamIcon('2');

    return (
      <View style={styles.teamChooserView}>
        {team1}
        <Text style={styles.player_name}>{item.name || ''}</Text>
        {team2}
      </View>
    );
  };

  useEffect(() => {
    const checkWolf = async () => {
      if (wolfPlayerIndex < 0) {
        return;
      }
      const wolfOnTeamOne =
        typeof find(gameHole.teams, (team) => {
          if (team.team !== '1') {
            return false;
          }
          if (team && team.players && team.players.length) {
            return team.players.includes(wolfPKey);
          }
          return false;
        }) !== 'undefined';
      if (wolfOnTeamOne) {
        return;
      }

      // we got to here, so need to doctor up gameHole teams w/ Wolf
      await changeTeamsForPlayer(wolfPKey, '1', '2');
      //console.log('teamChooser useEffect', gameHole, wolfPlayerIndex, wolfOnTeamOne);
    };

    if (isWolf) {
      checkWolf();
    }
  }, [
    game.scope.wolf_order,
    currentHole,
    isWolf,
    wolfPlayerIndex,
    gameHole.teams,
    changeTeamsForPlayer,
    wolfPKey,
  ]);

  let sorted_players = game.players;
  if (game && game.scope && game.scope.wolf_order) {
    sorted_players = game.scope.wolf_order.map((pkey) => {
      const p = find(game.players, { _key: pkey });
      if (!p) {
        console.log('a player in wolf_order that is not in players?');
      }
      return p;
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.teamTitleView}>
        <Text style={styles.title}>{team1Text}</Text>
        <Text style={styles.title}>{team2Text}</Text>
      </View>
      <FlatList
        data={sorted_players}
        renderItem={_renderPlayer}
        keyExtractor={(item) => {
          if (item && item._key) {
            return item._key;
          }
          return Math.random().toString();
        }}
      />
    </View>
  );
};

export default TeamChooser;

const styles = StyleSheet.create({
  container: {},
  icon: {
    padding: 10,
  },
  player_name: {
    paddingTop: 15,
  },
  teamChooserView: {
    flex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  teamTitleView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    paddingBottom: 20,
    textDecorationLine: 'underline',
  },
});
