import { createStackNavigator } from '@react-navigation/stack';
import GameSummary from 'features/gameSummary/gameSummary';
import PostScores from 'features/gameSummary/postScores';
import React from 'react';

const GameSummaryStack = (props) => {
  const Stack = createStackNavigator();

  return (
    <Stack.Navigator initialRouteName="GameSummary" headerMode="none">
      <Stack.Screen name="GameSummary" component={GameSummary} />
      <Stack.Screen name="PostScores" component={PostScores} />
    </Stack.Navigator>
  );
};

export default GameSummaryStack;
