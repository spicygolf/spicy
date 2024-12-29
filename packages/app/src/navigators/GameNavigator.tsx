import React from 'react';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { GameProvider } from '@/providers/game';
import { GameScoring } from '@/screens/game/GameScoring';
import { GameSettings } from '@/screens/game/GameSettings';

export type GameNavigatorParamList = {
  GameSettings: undefined;
  GameScoring: undefined;
};

export type GameSettingsProps = NativeStackScreenProps<
  GameNavigatorParamList,
  'GameSettings'
>;
export type GameScoringProps = NativeStackScreenProps<
  GameNavigatorParamList,
  'GameScoring'
>;

export function GameNavigator() {
  const Stack = createNativeStackNavigator<GameNavigatorParamList>();

  return (
    <GameProvider>
      <Stack.Navigator initialRouteName="GameSettings">
        <Stack.Screen
          name="GameSettings"
          component={GameSettings}
          options={{
            title: 'Settings',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="GameScoring"
          component={GameScoring}
          options={{
            title: 'Scoring',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </GameProvider>
  );
}
