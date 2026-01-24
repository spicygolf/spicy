import { useQuery } from "@apollo/client";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { green } from "common/colors";
import { GameListContext } from "features/games/gameListContext";
import GameNav from "features/games/gamenav";
import { GAMESPECS_FOR_PLAYER_QUERY } from "features/games/graphql";
import NewGameCards from "features/games/newGameCards";
import NewGameList from "features/games/newGameList";
import { CurrentPlayerContext } from "features/players/currentPlayerContext";
import { orderBy } from "lodash";
import { useContext, useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const TabIcon = ({ name, color }) => {
  return <Icon size={24} color={color} name={name} />;
};

const NewGameScreen = () => {
  let total = 0;
  const { currentPlayer } = useContext(CurrentPlayerContext);
  const [gameList, setGameList] = useState();

  const { data, loading, error } = useQuery(GAMESPECS_FOR_PLAYER_QUERY, {
    variables: {
      pkey: currentPlayer._key,
    },
    fetchPolicy: "cache-and-network",
  });

  let content;

  if (loading) {
    content = <ActivityIndicator />;
  }

  // TODO: error component instead of below...
  if (error && error.message !== "Network request failed") {
    console.log(error);
    content = <Text>Error: {error.message}</Text>;
  }

  //console.log('data', data);
  if (data?.gameSpecsForPlayer) {
    data.gameSpecsForPlayer.map(({ player_count }) => {
      total += player_count;
    });
    // console.log('player total games', player_total);
  }
  const gamespecs = data?.gameSpecsForPlayer
    ? orderBy(data.gameSpecsForPlayer, ["player_count"], ["desc"])
    : [];

  useEffect(
    () => {
      setGameList({
        gamespecs,
        total,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  const Tab = createMaterialTopTabNavigator();

  content = (
    <View style={styles.container}>
      <GameNav title="New Game" showBack={true} />
      <Tab.Navigator
        initialRouteName="AddPlayerFavorites"
        screenOptions={{}}
        tabBarOptions={{
          activeTintColor: green,
          inactiveTintColor: "#555",
          style: {
            backgroundColor: "none",
          },
          labelStyle: {
            textTransform: "none",
            fontSize: 12,
          },
          indicatorStyle: {
            backgroundColor: green,
          },
          tabStyle: {
            justifyContent: "flex-start",
          },
          showIcon: true,
        }}
      >
        <Tab.Screen
          name="NewGameList"
          component={NewGameList}
          options={{
            title: "List",
            tabBarIcon: ({ focused }) => {
              return <TabIcon color={focused ? green : "#555"} name="toc" />;
            },
          }}
        />
        <Tab.Screen
          name="NewGameCards"
          component={NewGameCards}
          options={{
            title: "Description",
            tabBarIcon: ({ focused }) => {
              return (
                <TabIcon color={focused ? green : "#555"} name="article" />
              );
            },
          }}
        />
      </Tab.Navigator>
    </View>
  );

  return (
    <GameListContext.Provider
      value={{
        gameList,
        setGameList,
      }}
    >
      {content}
    </GameListContext.Provider>
  );
};

export default NewGameScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
