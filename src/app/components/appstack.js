import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
} from 'react-native';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import {
  Icon
} from 'react-native-elements';
import AsyncStorage from '@react-native-community/async-storage';
import { useLazyQuery } from '@apollo/react-hooks';

import FeedStack from 'features/feed/feedstack';
import GamesStack from 'features/games/gamesstack';
import ProfileStack from 'features/profile/profilestack';
import { getCurrentUser } from 'common/utils/account';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import { GET_PLAYER_QUERY } from 'features/players/graphql';
import { green, red, blue } from 'common/colors';



const TabIcon = ({type, name, color, testID}) => {
  return (
    <Icon
      size={24}
      color={color}
      type={type}
      name={name}
      testID={testID}
    />
  );
};


const AppStack = props => {

  const { user } = props;
  const [ creds, setCreds ] = useState();

  // grab current player object from db
  const [ currentPlayer, setCurrentPlayer ] = useState(null);
  const [ getPlayer, {error: cpError, data: cpData} ] = useLazyQuery(GET_PLAYER_QUERY);
  if (cpError) console.log('Error fetching current player', cpError);
  //console.log('cpData', cpData);
  if( cpData && cpData.getPlayer && !currentPlayer ) {
    //console.log('setting currentPlayer', cpData);
    setCurrentPlayer(cpData.getPlayer);
  }

  useEffect(
    () => {
      const getCreds = async () => {
        const c = await getCurrentUser(user);
        if( c && c.currentPlayerKey && c.token ) {
          await AsyncStorage.setItem('currentPlayer', c.currentPlayerKey);
          await AsyncStorage.setItem('token', c.token);
          setCreds(c);
          getPlayer({
            variables: {
              player: c.currentPlayerKey,
            }
          });
        } else {
          if( c && c.message ) {
            // TODO: navigate to an Error component
            console.log('something is wrong', c.message);
          }
        }
      };
      getCreds();
    }, [user]
  );

  if( !creds ) return (
    <ActivityIndicator />
  );

  const Tab = createMaterialBottomTabNavigator();

  const tabs = (
    <Tab.Navigator
      initialRouteName='GamesStack'
      shifting={true}
      activeColor='#fff'
      inactiveColor='#ccc'
    >
      <Tab.Screen
        name='FeedStack'
        component={FeedStack}
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => {
            return (
              <TabIcon
                color={focused ? '#fff' : '#ccc' }
                name='comment'
                type='font-awesome'
                />
            );
          },
          tabBarColor: blue,
          tabBarTestID: 'feed_tab'
        }}
      />
      <Tab.Screen
        name='GamesStack'
        component={GamesStack}
        options={{
          title: 'Games',
          tabBarIcon: ({ focused }) => {
            return (
              <TabIcon
              color={focused ? '#fff' : '#ccc' }
              name='edit'
              type='font-awesome'
              />
            );
          },
          tabBarColor: green,
          tabBarTestID: 'games_tab'
        }}
      />
      <Tab.Screen
        name='ProfileStack'
        component={ProfileStack}
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => {
            return (
              <TabIcon
              color={focused ? '#fff' : '#ccc' }
              name='user'
              type='font-awesome'
              />
            );
          },
          tabBarColor: red,
          tabBarTestID: 'profile_tab'
        }}
      />
    </Tab.Navigator>
  );


  return (
    <CurrentPlayerContext.Provider value={{
      currentPlayerKey: creds.currentPlayerKey,
      currentPlayer: currentPlayer,
      token: creds.token,
    }}>
      {tabs}
    </CurrentPlayerContext.Provider>
  );

};

export default AppStack;
