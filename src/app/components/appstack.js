import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
} from 'react-native';
import {
  createMaterialBottomTabNavigator
} from '@react-navigation/material-bottom-tabs';
import {
  Icon
} from 'react-native-elements';
import AsyncStorage from '@react-native-community/async-storage';

import FeedStack from 'features/feed/feedstack';
import GamesStack from 'features/games/gamesstack';
import ProfileStack from 'features/profile/profilestack';
import RegisterAgain from 'features/account/registerAgain';
import { getCurrentUser } from 'common/utils/account';
import { CurrentPlayerContext } from 'features/players/currentPlayerContext';
import CurrentPlayer from 'features/players/currentPlayer';
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

  const [ content, setContent ] = useState(<ActivityIndicator />);

  const { user } = props;

  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [currentPlayerKey, setCurrentPlayerKey] = useState(null);
  const [token, setToken] = useState(null);

  const getCreds = async () => {
    const c = await getCurrentUser(user);
    //console.log('getCreds', c);
    if( c && c.currentPlayerKey && c.token ) {
      setCurrentPlayerKey(c.currentPlayerKey);
      setToken(c.token);
      await AsyncStorage.setItem('currentPlayer', c.currentPlayerKey);
      await AsyncStorage.setItem('token', c.token);
      setContent(tabs());
    } else {
      if( c && c.message ) {
        // try to get creds from local storage
        const newCurrentPlayerKey = await AsyncStorage.getItem('currentPlayer');
        const newToken = await AsyncStorage.getItem('token');
        if( newToken && newCurrentPlayerKey ) {
          // TODO: DRY (above)
          setCurrentPlayerKey(newCurrentPlayerKey);
          setToken(newToken);
          setContent(tabs());
        } else {
          console.log('something is wrong:', c);
          if( c.navTo ) {
            switch( c.navTo ) {
              case 'RegisterAgain':
                setContent(<RegisterAgain
                  fbUser={c.fbUser}
                  retryCreds={retryCreds}
                />);
                break;
              default:
                //setContent(<Alert message={c.message} />);
                break;
            }
          } else {
            // TODO: navigate to an Error component
            //setContent(<Alert message={c.message} />);
          }
        }
      }
    }
  };

  const retryCreds = async () => {
    await getCreds();
  };

  useEffect(
    () => {
      getCreds();
    }, [user]
  );

  const tabs = () => {
    const Tab = createMaterialBottomTabNavigator();

    return (
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
  }

  if( currentPlayerKey && token ) {
    return (
      <CurrentPlayerContext.Provider
        value={{
          currentPlayer,
          setCurrentPlayer,
          currentPlayerKey,
          setCurrentPlayerKey,
          token,
          setToken,
          user,
        }}
      >
        <CurrentPlayer pkey={currentPlayerKey} />
        { content }
      </CurrentPlayerContext.Provider>
    );
  } else {
    return (<ActivityIndicator />);
  }
};

export default AppStack;
