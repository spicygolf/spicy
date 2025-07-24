import {
  createMaterialTopTabNavigator,
  type MaterialTopTabNavigationOptions,
  type MaterialTopTabScreenProps,
} from "@react-navigation/material-top-tabs";
import { useEffect } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { GameHeader } from "@/components/game/GameHeader";
import { useGameContext } from "@/contexts/GameContext";
import { useGame } from "@/hooks";
import { GameLeaderboard } from "@/screens/game/GameLeaderboard";
import { GameScoring } from "@/screens/game/GameScoring";
import { GameSettings } from "@/screens/game/GameSettings";

// Types for the navigation stack
type GameScreenRouteProp = {
  key: string;
  name: string;
  params: {
    gameId?: string;
    screen?: {
      name: string;
      params?: {
        gameId?: string;
      };
    };
    params?: {
      gameId?: string;
    };
  };
};

type GameNavigatorProps = {
  route: GameScreenRouteProp;
};

export type GameNavigatorParamList = {
  GameLeaderboard: { gameId: string };
  GameSettings: { gameId: string };
  GameScoring: { gameId: string };
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
  "GameSettings"
>;

export function GameNavigator({ route }: GameNavigatorProps) {
  const { setGame } = useGameContext();
  // Extract gameId from route params or from the deep link path
  const gameId =
    route.params?.gameId ||
    route.params?.screen?.params?.gameId ||
    route.params?.params?.gameId;

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
    },
    tabBarLabelStyle: {
      padding: 0,
      marginTop: 0,
      marginBottom: 20,
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
          initialParams={{ gameId: route.params.gameId }}
          options={{
            title: "Leaderboard",
          }}
        />
        <Tabs.Screen
          name="GameScoring"
          component={GameScoring}
          initialParams={{ gameId: route.params.gameId }}
          options={{
            title: "Scoring",
          }}
        />
        <Tabs.Screen
          name="GameSettings"
          component={GameSettings}
          initialParams={{ gameId: route.params.gameId }}
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
