import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationOptions,
  type MaterialTopTabScreenProps,
} from "@react-navigation/material-top-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { GameHeader } from "@/components/game/GameHeader";
import { useGameContext } from "@/contexts/GameContext";
import { useGame } from "@/hooks";
import { GameSettingsNavigator } from "@/navigators/GameSettingsNavigator";
import type { GamesNavigatorParamList } from "@/navigators/GamesNavigator";
import { GameLeaderboard } from "@/screens/game/GameLeaderboard";
import { GameScoring } from "@/screens/game/GameScoring";

// Props type for the GameNavigator screen
type GameNavigatorProps = NativeStackScreenProps<
  GamesNavigatorParamList,
  "Game"
>;

export type GameNavigatorParamList = {
  GameLeaderboard: { gameId: string };
  GameScoring: { gameId: string };
  GameSettingsNavigator: { gameId: string };
};

export type GameLeaderboardProps = MaterialTopTabScreenProps<
  GameNavigatorParamList,
  "GameLeaderboard"
>;

export type GameScoringProps = MaterialTopTabScreenProps<
  GameNavigatorParamList,
  "GameScoring"
>;

export type GameSettingsProps = MaterialTopTabScreenProps<
  GameNavigatorParamList,
  "GameSettingsNavigator"
>;

export function GameNavigator({ route }: GameNavigatorProps) {
  const { theme } = useUnistyles();
  const { setGame } = useGameContext();
  // Extract gameId from route params
  const gameId = route.params.gameId;

  const { game } = useGame(gameId, { requireGame: true });

  // Update the current game in context when the route changes
  useEffect(() => {
    setGame(game);
    return () => {
      setGame(null);
    };
  }, [game, setGame]);

  if (!game) {
    return null; // or a loading spinner
  }

  const Tabs = createMaterialTopTabNavigator<GameNavigatorParamList>();

  const tabScreenOptions: MaterialTopTabNavigationOptions = {
    tabBarIndicatorStyle: styles.selectedTabLine,
    swipeEnabled: false,
    tabBarStyle: {
      height: 35,
      backgroundColor: theme.colors.background,
    },
    tabBarLabelStyle: {
      padding: 0,
      marginTop: 0,
      marginBottom: 20,
      color: theme.colors.primary,
    },
  };

  return (
    <View style={styles.container}>
      <GameHeader game={game} />
      <Tabs.Navigator
        initialRouteName="GameScoring"
        screenOptions={tabScreenOptions}
      >
        <Tabs.Screen
          name="GameLeaderboard"
          component={GameLeaderboard}
          initialParams={{ gameId }}
          options={{
            title: "Leaderboard",
          }}
        />
        <Tabs.Screen
          name="GameScoring"
          component={GameScoring}
          initialParams={{ gameId }}
          options={{
            title: "Scoring",
          }}
        />
        <Tabs.Screen
          name="GameSettingsNavigator"
          component={GameSettingsNavigator}
          initialParams={{ gameId }}
          options={{
            title: "Settings",
          }}
        />
      </Tabs.Navigator>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  selectedTabLine: {
    backgroundColor: theme.colors.action,
    height: 4,
  },
}));
